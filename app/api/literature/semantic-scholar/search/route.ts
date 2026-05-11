import { NextResponse } from "next/server";

type SemanticScholarSearchRequest = {
    query?: string;
    limit?: number;
    year?: string;
};

type NormalizedPaper = {
    source: string;
    source_id: string;
    title: string;
    authors: string;
    year: number | null;
    venue: string | null;
    publication_date: string | null;
    abstract: string | null;
    tldr: string | null;
    doi: string | null;
    url: string | null;
    citation_count: number | null;
    influential_citation_count: number | null;
    reference_count: number | null;
    fields_of_study: string | null;
    raw: unknown;
};

function getText(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
    return null;
}

function getNumber(value: unknown): number | null {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

function normalizeDate(value: unknown): string | null {
    const text = getText(value);
    if (!text) return null;

    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed.toISOString().split("T")[0];
}

function normalizePaper(item: any): NormalizedPaper {
    const authors = Array.isArray(item?.authors)
        ? item.authors
            .map((author: any) => author?.name)
            .filter(Boolean)
            .join(", ")
        : "";

    const doi =
        getText(item?.externalIds?.DOI) ||
        getText(item?.externalIds?.doi) ||
        null;

    const fieldsOfStudy = Array.isArray(item?.fieldsOfStudy)
        ? item.fieldsOfStudy.filter(Boolean).join(", ")
        : null;

    return {
        source: "semantic_scholar",
        source_id: getText(item?.paperId) || getText(item?.corpusId) || "",
        title: getText(item?.title) || "Untitled paper",
        authors,
        year: getNumber(item?.year),
        venue: getText(item?.venue) || getText(item?.publicationVenue?.name),
        publication_date: normalizeDate(item?.publicationDate),
        abstract: getText(item?.abstract),
        tldr: getText(item?.tldr?.text),
        doi,
        url: getText(item?.url),
        citation_count: getNumber(item?.citationCount),
        influential_citation_count: getNumber(item?.influentialCitationCount),
        reference_count: getNumber(item?.referenceCount),
        fields_of_study: fieldsOfStudy,
        raw: item,
    };
}

async function safelyReadJson(request: Request) {
    const text = await request.text();

    if (!text.trim()) {
        return {
            ok: false,
            error: "Request body is empty. Send JSON with a query.",
            body: null,
        };
    }

    try {
        return {
            ok: true,
            error: null,
            body: JSON.parse(text),
        };
    } catch {
        return {
            ok: false,
            error: "Invalid JSON body.",
            body: null,
        };
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message:
            "Semantic Scholar paper search route is working. Use POST with JSON body, for example: { \"query\": \"agentic AI chemical engineering\", \"limit\": 10 }",
        api_key_configured: Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY),
    });
}

export async function POST(request: Request) {
    try {
        const parsed = await safelyReadJson(request);

        if (!parsed.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    error: parsed.error,
                    example: {
                        query: "agentic AI chemical engineering",
                        limit: 10,
                    },
                },
                { status: 400 }
            );
        }

        const body = parsed.body as SemanticScholarSearchRequest;
        const query = body.query?.trim();

        if (!query) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Query is required.",
                },
                { status: 400 }
            );
        }

        const limit = Math.min(Math.max(body.limit || 10, 1), 20);

        const fields = [
            "paperId",
            "corpusId",
            "title",
            "authors",
            "year",
            "venue",
            "publicationVenue",
            "publicationDate",
            "abstract",
            "tldr",
            "externalIds",
            "url",
            "citationCount",
            "influentialCitationCount",
            "referenceCount",
            "fieldsOfStudy",
        ].join(",");

        const params = new URLSearchParams({
            query,
            limit: String(limit),
            fields,
        });

        if (body.year?.trim()) {
            params.set("year", body.year.trim());
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
            headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
        }

        const response = await fetch(
            `https://api.semanticscholar.org/graph/v1/paper/search?${params.toString()}`,
            {
                method: "GET",
                headers,
                cache: "no-store",
            }
        );

        const payload = await response.json().catch(() => ({}));

        if (response.status === 429) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Semantic Scholar rate limit reached. Wait 30 to 60 seconds and try again, or add SEMANTIC_SCHOLAR_API_KEY to .env.local.",
                    status: 429,
                    api_key_configured: Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY),
                    semanticScholarResponse: payload,
                },
                { status: 429 }
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    step: "semantic-scholar-search",
                    status: response.status,
                    statusText: response.statusText,
                    semanticScholarResponse: payload,
                },
                { status: response.status }
            );
        }

        const papers = Array.isArray(payload?.data)
            ? payload.data.map(normalizePaper)
            : [];

        return NextResponse.json({
            ok: true,
            query,
            count: papers.length,
            papers,
            api_key_configured: Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY),
            raw: payload,
        });
    } catch (error) {
        console.error("Semantic Scholar search route error:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown Semantic Scholar search error.",
            },
            { status: 500 }
        );
    }
}