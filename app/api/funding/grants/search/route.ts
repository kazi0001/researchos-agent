import { NextResponse } from "next/server";

type GrantsGovSearchRequest = {
    keyword?: string;
    rows?: number;
    oppStatuses?: string;
    agencies?: string;
};

type NormalizedGrantOpportunity = {
    source: string;
    source_id: string;
    opportunity_number: string | null;
    title: string;
    agency: string | null;
    agency_code: string | null;
    deadline: string | null;
    posted_date: string | null;
    close_date: string | null;
    status: string | null;
    category: string | null;
    url: string | null;
    raw: unknown;
};

function normalizeDate(value: unknown): string | null {
    if (!value || typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const parsed = new Date(trimmed);

    if (Number.isNaN(parsed.getTime())) {
        return trimmed;
    }

    return parsed.toISOString().split("T")[0];
}

function getText(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    if (typeof value === "number") {
        return String(value);
    }

    return null;
}

function normalizeOpportunity(item: any): NormalizedGrantOpportunity {
    const opportunityId =
        getText(item.id) ||
        getText(item.opportunityId) ||
        getText(item.oppId) ||
        getText(item.opportunity_id) ||
        getText(item.number) ||
        "";

    const opportunityNumber =
        getText(item.opportunityNumber) ||
        getText(item.oppNum) ||
        getText(item.number) ||
        null;

    const title =
        getText(item.opportunityTitle) ||
        getText(item.title) ||
        getText(item.oppTitle) ||
        "Untitled Grants.gov opportunity";

    const agency =
        getText(item.agencyName) ||
        getText(item.agency) ||
        getText(item.owningAgencyName) ||
        getText(item.topAgencyName) ||
        null;

    const agencyCode =
        getText(item.agencyCode) ||
        getText(item.owningAgencyCode) ||
        getText(item.topAgencyCode) ||
        null;

    const closeDate =
        normalizeDate(item.closeDate) ||
        normalizeDate(item.closeDateStr) ||
        normalizeDate(item.responseDate) ||
        normalizeDate(item.archiveDate);

    const postedDate =
        normalizeDate(item.postedDate) ||
        normalizeDate(item.postedDateStr) ||
        normalizeDate(item.openDate);

    const status =
        getText(item.oppStatus) ||
        getText(item.opportunityStatus) ||
        getText(item.status) ||
        null;

    const category =
        getText(item.opportunityCategory) ||
        getText(item.category) ||
        getText(item.fundingInstrumentType) ||
        null;

    const sourceId = opportunityId || opportunityNumber || title;

    return {
        source: "grants.gov",
        source_id: sourceId,
        opportunity_number: opportunityNumber,
        title,
        agency,
        agency_code: agencyCode,
        deadline: closeDate,
        posted_date: postedDate,
        close_date: closeDate,
        status,
        category,
        url: opportunityNumber
            ? `https://www.grants.gov/search-results-detail/${opportunityNumber}`
            : "https://www.grants.gov/search-results",
        raw: item,
    };
}

function extractOpportunities(payload: any): any[] {
    if (Array.isArray(payload?.data?.oppHits)) {
        return payload.data.oppHits;
    }

    if (Array.isArray(payload?.data?.opportunities)) {
        return payload.data.opportunities;
    }

    if (Array.isArray(payload?.oppHits)) {
        return payload.oppHits;
    }

    if (Array.isArray(payload?.opportunities)) {
        return payload.opportunities;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
}

async function safelyReadJson(request: Request) {
    const text = await request.text();

    if (!text.trim()) {
        return {
            ok: false,
            error: "Request body is empty. Send JSON with a keyword.",
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
            error: "Invalid JSON body. Send valid JSON with a keyword.",
            body: null,
        };
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message:
            "Grants.gov search route is working. Use POST with JSON body, for example: { \"keyword\": \"critical minerals\", \"rows\": 5 }",
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
                        keyword: "critical minerals",
                        rows: 5,
                    },
                },
                { status: 400 }
            );
        }

        const body = parsed.body as GrantsGovSearchRequest;

        const keyword = body.keyword?.trim();

        if (!keyword) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Keyword is required.",
                    example: {
                        keyword: "critical minerals",
                        rows: 5,
                    },
                },
                { status: 400 }
            );
        }

        const rows = Math.min(Math.max(body.rows || 10, 1), 50);

        const grantsGovRequestBody = {
            keyword,
            rows,
            oppStatuses: body.oppStatuses || "posted|forecasted",
            agencies: body.agencies || undefined,
        };

        const response = await fetch("https://api.grants.gov/v1/api/search2", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(grantsGovRequestBody),
            cache: "no-store",
        });

        const payload = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    step: "grants-gov-search",
                    status: response.status,
                    statusText: response.statusText,
                    grantsGovRequestBody,
                    grantsGovResponse: payload,
                },
                { status: response.status }
            );
        }

        const rawItems = extractOpportunities(payload);
        const opportunities = rawItems.map(normalizeOpportunity);

        return NextResponse.json({
            ok: true,
            keyword,
            count: opportunities.length,
            opportunities,
            grantsGovRequestBody,
            raw: payload,
        });
    } catch (error) {
        console.error("Grants.gov search route error:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown Grants.gov search error.",
            },
            { status: 500 }
        );
    }
}