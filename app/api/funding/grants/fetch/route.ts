import { NextResponse } from "next/server";

type GrantsGovFetchRequest = {
    opportunityId?: string | number;
};

type NormalizedGrantDetails = {
    source: string;
    source_id: string;
    opportunity_id: string;
    opportunity_number: string | null;
    title: string;
    agency: string | null;
    agency_code: string | null;
    top_agency: string | null;
    deadline: string | null;
    posted_date: string | null;
    close_date: string | null;
    archive_date: string | null;
    category: string | null;
    award_ceiling: string | null;
    award_floor: string | null;
    estimated_total_program_funding: string | null;
    expected_number_of_awards: string | null;
    cost_sharing: string | null;
    eligibility: string | null;
    summary: string | null;
    contact: string | null;
    cfda_numbers: string | null;
    url: string | null;
    raw: unknown;
};

function getText(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    if (typeof value === "number") {
        return String(value);
    }

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    return null;
}

function stripHtml(value: unknown): string | null {
    const text = getText(value);

    if (!text) {
        return null;
    }

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

function normalizeDate(value: unknown): string | null {
    const text = getText(value);

    if (!text) {
        return null;
    }

    const parsed = new Date(text);

    if (Number.isNaN(parsed.getTime())) {
        return text;
    }

    return parsed.toISOString().split("T")[0];
}

function joinTexts(values: Array<unknown>, separator = "\n") {
    const cleaned = values
        .map((value) => stripHtml(value) || getText(value))
        .filter(Boolean) as string[];

    if (cleaned.length === 0) {
        return null;
    }

    return cleaned.join(separator);
}

function stringifyMaybe(value: unknown): string | null {
    if (!value) {
        return null;
    }

    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    try {
        return JSON.stringify(value);
    } catch {
        return null;
    }
}

function extractCfdaNumbers(data: any): string | null {
    const cfdaList =
        data?.cfdaList ||
        data?.cfdas ||
        data?.synopsis?.cfdaList ||
        data?.synopsis?.cfdas;

    if (!Array.isArray(cfdaList)) {
        return null;
    }

    const numbers = cfdaList
        .map((item) => {
            if (typeof item === "string" || typeof item === "number") {
                return String(item);
            }

            return (
                getText(item?.cfdaNumber) ||
                getText(item?.number) ||
                getText(item?.programNumber) ||
                getText(item?.cfda)
            );
        })
        .filter(Boolean);

    return numbers.length > 0 ? numbers.join(", ") : null;
}

function extractEligibility(data: any): string | null {
    const synopsis = data?.synopsis || {};

    const applicantTypes =
        synopsis?.applicantEligibilityDesc ||
        synopsis?.applicantEligibilityDescription ||
        synopsis?.eligibleApplicants ||
        data?.eligibleApplicants ||
        data?.eligibility;

    const additional =
        synopsis?.additionalEligibilityInformation ||
        synopsis?.additionalEligibilityDesc ||
        data?.additionalEligibilityInformation;

    return joinTexts([applicantTypes, additional], "\n\n");
}

function extractContact(data: any): string | null {
    const synopsis = data?.synopsis || {};

    return joinTexts(
        [
            synopsis?.agencyContactName,
            synopsis?.agencyContactDesc,
            synopsis?.agencyContactEmail,
            synopsis?.agencyContactPhone,
            synopsis?.agencyContactEmailDesc,
        ],
        "\n"
    );
}

function extractSummary(data: any): string | null {
    const synopsis = data?.synopsis || {};

    return (
        stripHtml(synopsis?.synopsisDesc) ||
        stripHtml(synopsis?.description) ||
        stripHtml(data?.description) ||
        stripHtml(data?.summary) ||
        "Detailed opportunity information was fetched from Grants.gov. Review the original opportunity page for complete solicitation instructions."
    );
}

function normalizeGrantDetails(payload: any): NormalizedGrantDetails {
    const data = payload?.data || payload || {};
    const synopsis = data?.synopsis || {};

    const opportunityId =
        getText(data?.id) ||
        getText(data?.opportunityId) ||
        getText(synopsis?.opportunityId) ||
        "";

    const opportunityNumber =
        getText(data?.opportunityNumber) ||
        getText(synopsis?.opportunityNumber) ||
        null;

    const title =
        getText(data?.opportunityTitle) ||
        getText(synopsis?.opportunityTitle) ||
        "Untitled Grants.gov opportunity";

    const agency =
        getText(synopsis?.agencyName) ||
        getText(data?.agencyName) ||
        getText(synopsis?.agencyDetails?.agencyName) ||
        getText(synopsis?.topAgencyDetails?.agencyName) ||
        null;

    const agencyCode =
        getText(synopsis?.agencyCode) ||
        getText(data?.owningAgencyCode) ||
        getText(synopsis?.agencyDetails?.agencyCode) ||
        null;

    const topAgency =
        getText(synopsis?.topAgencyDetails?.agencyName) ||
        getText(synopsis?.topAgencyDetails?.topAgencyCode) ||
        null;

    const closeDate =
        normalizeDate(synopsis?.closeDate) ||
        normalizeDate(synopsis?.responseDate) ||
        normalizeDate(data?.closeDate);

    const postedDate =
        normalizeDate(synopsis?.postingDate) ||
        normalizeDate(synopsis?.postedDate) ||
        normalizeDate(data?.postedDate);

    const archiveDate =
        normalizeDate(synopsis?.archiveDate) || normalizeDate(data?.archiveDate);

    const category =
        getText(data?.opportunityCategory?.description) ||
        getText(data?.opportunityCategory?.category) ||
        getText(synopsis?.opportunityCategory) ||
        null;

    const awardCeiling =
        getText(synopsis?.awardCeiling) ||
        getText(synopsis?.awardCeilingFormatted) ||
        null;

    const awardFloor =
        getText(synopsis?.awardFloor) ||
        getText(synopsis?.awardFloorFormatted) ||
        null;

    const estimatedTotalProgramFunding =
        getText(synopsis?.estimatedTotalProgramFunding) ||
        getText(synopsis?.estimatedTotalProgramFundingFormatted) ||
        null;

    const expectedNumberOfAwards =
        getText(synopsis?.expectedNumberOfAwards) ||
        getText(synopsis?.expectedNumberOfAwardsFormatted) ||
        null;

    const costSharing =
        getText(synopsis?.costSharingOrMatchingRequirement) ||
        getText(synopsis?.costSharing) ||
        null;

    const sourceId = opportunityId || opportunityNumber || title;

    return {
        source: "grants.gov",
        source_id: sourceId,
        opportunity_id: opportunityId,
        opportunity_number: opportunityNumber,
        title,
        agency,
        agency_code: agencyCode,
        top_agency: topAgency,
        deadline: closeDate,
        posted_date: postedDate,
        close_date: closeDate,
        archive_date: archiveDate,
        category,
        award_ceiling: awardCeiling,
        award_floor: awardFloor,
        estimated_total_program_funding: estimatedTotalProgramFunding,
        expected_number_of_awards: expectedNumberOfAwards,
        cost_sharing: costSharing,
        eligibility: extractEligibility(data),
        summary: extractSummary(data),
        contact: extractContact(data),
        cfda_numbers: extractCfdaNumbers(data),
        url: opportunityId
            ? `https://www.grants.gov/search-results-detail/${opportunityId}`
            : opportunityNumber
                ? `https://www.grants.gov/search-results-detail/${opportunityNumber}`
                : "https://www.grants.gov/search-results",
        raw: data,
    };
}

async function safelyReadJson(request: Request) {
    const text = await request.text();

    if (!text.trim()) {
        return {
            ok: false,
            error: "Request body is empty. Send JSON with an opportunityId.",
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
            error: "Invalid JSON body. Send valid JSON with an opportunityId.",
            body: null,
        };
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message:
            "Grants.gov fetch route is working. Use POST with JSON body, for example: { \"opportunityId\": 289999 }",
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
                        opportunityId: 289999,
                    },
                },
                { status: 400 }
            );
        }

        const body = parsed.body as GrantsGovFetchRequest;
        const opportunityId = body.opportunityId;

        if (!opportunityId) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "opportunityId is required.",
                    example: {
                        opportunityId: 289999,
                    },
                },
                { status: 400 }
            );
        }

        const response = await fetch(
            "https://api.grants.gov/v1/api/fetchOpportunity",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    opportunityId,
                }),
                cache: "no-store",
            }
        );

        const payload = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    step: "grants-gov-fetch-opportunity",
                    status: response.status,
                    statusText: response.statusText,
                    grantsGovRequestBody: {
                        opportunityId,
                    },
                    grantsGovResponse: payload,
                },
                { status: response.status }
            );
        }

        const details = normalizeGrantDetails(payload);

        return NextResponse.json({
            ok: true,
            opportunityId,
            details,
            raw: payload,
        });
    } catch (error) {
        console.error("Grants.gov fetchOpportunity route error:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown Grants.gov fetchOpportunity error.",
            },
            { status: 500 }
        );
    }
}