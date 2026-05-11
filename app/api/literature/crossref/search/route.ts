import { NextResponse } from "next/server";

type CrossrefSearchRequest = {
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

function stripHtml(value: unknown): string | null {
    const text = getText(value);

    if (!text) return null;

    return text
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function getFirstArrayText(value: unknown): string | null {
    if (Array.isArray(value) && value.length > 0) {
        return getText(value[0]);
    }

    return getText(value);
}

function getDatePartsDate(value: any): string | null {
    const dateParts = value?.["date-parts"];

    if (!Array.isArray(dateParts) || !Array.isArray(dateParts[0])) {
        return null;
    }

    const [year, month = 1, day = 1] = dateParts[0];

    if (!year) return null;

    const date = new Date(Number(year), Number(month) - 1, Number(day));

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString().split("T")[0];
}

function getDateYear(value: any): number | null {
    const dateParts = value?.["date-parts"];

    if (!Array.isArray(dateParts) || !Array.isArray(dateParts[0])) {
        return null;
    }

    const year = Number(dateParts[0][0]);

    return Number.isNaN(year) ? null : year;
}

function getBestPublicationDate(item: any): string | null {
    return (
        getDatePartsDate(item?.published) ||
        getDatePartsDate(item?.["published-print"]) ||
        getDatePartsDate(item?.["published-online"]) ||
        getDatePartsDate(item?.issued) ||
        getDatePartsDate(item?.created)
    );
}

function getBestYear(item: any): number | null {
    return (
        getDateYear(item?.published) ||
        getDateYear(item?.["published-print"]) ||
        getDateYear(item?.["published-online"]) ||
        getDateYear(item?.issued) ||
        getDateYear(item?.created)
    );
}

function normalizeAuthorName(author: any): string | null {
    const given = getText(author?.given);
    const family = getText(author?.family);
    const name = getText(author?.name);

    if (given && family) return `${given} ${family}`;
    if (family) return family;
    if (name) return name;

    return null;
}

function normalizePaper(item: any): NormalizedPaper {
    const doi = getText(item?.DOI);
    const title = getFirstArrayText(item?.title) || "Untitled Crossref work";

    const authors = Array.isArray(item?.author)
        ? item.author.map(normalizeAuthorName).filter(Boolean).join(", ")
        : "";

    const venue =
        getFirstArrayText(item?.["container-title"]) ||
        getFirstArrayText(item?.["short-container-title"]) ||
        getText(item?.publisher);

    const fieldsOfStudy = Array.isArray(item?.subject)
        ? item.subject.filter(Boolean).join(", ")
        : null;

    const publicationDate = getBestPublicationDate(item);
    const year = getBestYear(item);

    return {
        source: "crossref",
        source_id:
            doi ||
            getText(item?.URL) ||
            getText(item?.resource?.primary?.URL) ||
            title,
        title,
        authors,
        year,
        venue,
        publication_date: publicationDate,
        abstract: stripHtml(item?.abstract),
        tldr: null,
        doi,
        url: getText(item?.URL) || (doi ? `https://doi.org/${doi}` : null),
        citation_count: getNumber(item?.["is-referenced-by-count"]),
        influential_citation_count: null,
        reference_count: Array.isArray(item?.reference)
            ? item.reference.length
            : getNumber(item?.["references-count"]),
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
            "Crossref paper search route is working. Use POST with JSON body, for example: { \"query\": \"agentic AI chemical engineering\", \"limit\": 10 }",
        mailto_configured: Boolean(process.env.CROSSREF_MAILTO),
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

        const body = parsed.body as CrossrefSearchRequest;
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

        const limit = Math.min(Math.max(body.limit || 10, 1), 50);

        const params = new URLSearchParams({
            "query.bibliographic": query,
            rows: String(limit),
            sort: "relevance",
            order: "desc",
        });

        if (process.env.CROSSREF_MAILTO) {
            params.set("mailto", process.env.CROSSREF_MAILTO);
        }

        if (body.year?.trim()) {
            const yearValue = body.year.trim();

            if (/^\d{4}$/.test(yearValue)) {
                params.set("filter", `from-pub-date:${yearValue},until-pub-date:${yearValue}`);
            } else if (/^\d{4}-\d{4}$/.test(yearValue)) {
                const [fromYear, toYear] = yearValue.split("-");
                params.set("filter", `from-pub-date:${fromYear},until-pub-date:${toYear}`);
            }
        }

        const response = await fetch(
            `https://api.crossref.org/works?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": `ResearchOS-Agent/0.1 (mailto:${process.env.CROSSREF_MAILTO || "no-email-provided"})`,
                },
                cache: "no-store",
            }
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    step: "crossref-search",
                    status: response.status,
                    statusText: response.statusText,
                    crossrefResponse: payload,
                },
                { status: response.status }
            );
        }

        const items = Array.isArray(payload?.message?.items)
            ? payload.message.items
            : [];

        const papers = items.map(normalizePaper);

        return NextResponse.json({
            ok: true,
            query,
            count: papers.length,
            papers,
            mailto_configured: Boolean(process.env.CROSSREF_MAILTO),
            raw: payload,
        });
    } catch (error) {
        console.error("Crossref search route error:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown Crossref search error.",
            },
            { status: 500 }
        );
    }
}