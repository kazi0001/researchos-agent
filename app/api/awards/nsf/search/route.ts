import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type NsfAwardSearchRequest = {
    query?: string;
    rows?: number;
    offset?: number;
    printFields?: string;
    saveToDatabase?: boolean;
};

type NormalizedNsfAward = {
    source: string;
    source_award_id: string;
    award_number: string;
    title: string;
    agency: string;
    program: string | null;
    program_officer: string | null;
    pi_name: string | null;
    co_pi_names: string | null;
    institution: string | null;
    institution_state: string | null;
    institution_country: string | null;
    amount: number | null;
    amount_text: string | null;
    start_date: string | null;
    end_date: string | null;
    award_year: number | null;
    abstract: string | null;
    keywords: string | null;
    topic_tags: string | null;
    url: string | null;
    raw_json: any;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function safelyReadJson(request: Request) {
    const text = await request.text();

    if (!text.trim()) {
        return {
            ok: false,
            body: null,
            error: "Request body is empty. Send JSON with a query.",
        };
    }

    try {
        return {
            ok: true,
            body: JSON.parse(text),
            error: null,
        };
    } catch {
        return {
            ok: false,
            body: null,
            error: "Invalid JSON body.",
        };
    }
}

function getText(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
    return null;
}

function getNumber(value: unknown): number | null {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const cleaned = value.replace(/[$,]/g, "");
        const parsed = Number(cleaned);
        return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
}

function normalizeDate(value: unknown): string | null {
    const text = getText(value);
    if (!text) return null;

    const parsed = new Date(text);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString().split("T")[0];
}

function getYear(value: string | null) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        const match = value.match(/\d{4}/);
        return match ? Number(match[0]) : null;
    }

    return date.getFullYear();
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

function normalizeNsfAward(item: any, query: string): NormalizedNsfAward {
    const awardNumber =
        getText(item.id) ||
        getText(item.awardId) ||
        getText(item.awardeeAwardNumber) ||
        getText(item.award_number) ||
        "";

    const title =
        getText(item.title) ||
        getText(item.awardTitle) ||
        getText(item.award_title) ||
        "Untitled NSF award";

    const startDate =
        normalizeDate(item.startDate) ||
        normalizeDate(item.date) ||
        normalizeDate(item.effectiveDate) ||
        normalizeDate(item.awardStartDate);

    const endDate =
        normalizeDate(item.expDate) ||
        normalizeDate(item.endDate) ||
        normalizeDate(item.awardEndDate);

    const amount =
        getNumber(item.fundsObligatedAmt) ||
        getNumber(item.amount) ||
        getNumber(item.awardAmount);

    const piName =
        getText(item.piFirstName) && getText(item.piLastName)
            ? `${getText(item.piFirstName)} ${getText(item.piLastName)}`
            : getText(item.piName) ||
            getText(item.pdPIName) ||
            getText(item.primaryInvestigator) ||
            null;

    const institution =
        getText(item.awardeeName) ||
        getText(item.institution) ||
        getText(item.organization) ||
        getText(item.awardee) ||
        null;

    const program =
        getText(item.programName) ||
        getText(item.program) ||
        getText(item.fundProgramName) ||
        getText(item.pgmName) ||
        null;

    const abstract =
        stripHtml(item.abstractText) ||
        stripHtml(item.abstract) ||
        stripHtml(item.awardAbstract) ||
        null;

    const keywords = [
        getText(item.primaryProgram),
        getText(item.programName),
        getText(item.fundProgramName),
        getText(item.pgmEleCode),
        getText(item.cfdaNumber),
    ]
        .filter(Boolean)
        .join("; ");

    return {
        source: "nsf",
        source_award_id: awardNumber || title,
        award_number: awardNumber,
        title,
        agency: "NSF",
        program,
        program_officer:
            getText(item.poName) ||
            getText(item.programOfficer) ||
            getText(item.pdName) ||
            null,
        pi_name: piName,
        co_pi_names:
            getText(item.coPDPI) ||
            getText(item.coPIs) ||
            getText(item.coPiNames) ||
            null,
        institution,
        institution_state:
            getText(item.awardeeStateCode) ||
            getText(item.state) ||
            getText(item.institutionState) ||
            null,
        institution_country:
            getText(item.awardeeCountryCode) ||
            getText(item.country) ||
            getText(item.institutionCountry) ||
            null,
        amount,
        amount_text: amount ? `$${amount.toLocaleString()}` : null,
        start_date: startDate,
        end_date: endDate,
        award_year: getYear(startDate),
        abstract,
        keywords: keywords || null,
        topic_tags: query,
        url: awardNumber
            ? `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${awardNumber}`
            : "https://www.nsf.gov/awardsearch/",
        raw_json: item,
    };
}

function extractAwards(payload: any): any[] {
    if (Array.isArray(payload?.response?.award)) return payload.response.award;
    if (Array.isArray(payload?.response?.awards)) return payload.response.awards;
    if (Array.isArray(payload?.award)) return payload.award;
    if (Array.isArray(payload?.awards)) return payload.awards;
    if (Array.isArray(payload)) return payload;

    return [];
}

function scoreAwardRelevance(award: NormalizedNsfAward, query: string) {
    const queryWords = query
        .toLowerCase()
        .split(/[\s,;:()\-_/]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 3);

    const uniqueWords = Array.from(new Set(queryWords));

    const text = [
        award.title,
        award.abstract,
        award.program,
        award.keywords,
        award.institution,
        award.pi_name,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    const matches = uniqueWords.filter((word) => text.includes(word));

    const matchRatio =
        uniqueWords.length > 0 ? matches.length / uniqueWords.length : 0;

    let score = Math.round(35 + matchRatio * 55);

    if (award.abstract) score += 5;
    if (award.amount && award.amount > 500000) score += 3;
    if (award.award_year && award.award_year >= new Date().getFullYear() - 5) {
        score += 5;
    }

    score = Math.max(0, Math.min(100, score));

    const reason =
        matches.length > 0
            ? `Matched query terms: ${matches.slice(0, 12).join(", ")}.`
            : "Limited keyword overlap. Manual review recommended.";

    return {
        relevance_score: score,
        relevance_reason: reason,
        strategic_lesson:
            score >= 80
                ? "Strongly relevant prior NSF award. Review abstract, program, PI/institution, and framing language for proposal strategy."
                : score >= 60
                    ? "Moderately relevant NSF award. Useful for landscape mapping and program-fit analysis."
                    : "Lower relevance award. Keep only if it supports a broader funding landscape.",
    };
}

async function insertSearchRun(query: string) {
    const { data, error } = await supabaseAdmin
        .from("award_search_runs")
        .insert([
            {
                source: "nsf",
                query,
                run_type: "manual",
                status: "started",
                started_at: new Date().toISOString(),
            },
        ])
        .select("id")
        .single();

    if (error) throw error;
    return data.id as string;
}

async function completeSearchRun(
    runId: string,
    awardsFound: number,
    newAwardsAdded: number,
    duplicateAwardsSeen: number,
    runSummary: string
) {
    const { error } = await supabaseAdmin
        .from("award_search_runs")
        .update({
            status: "completed",
            finished_at: new Date().toISOString(),
            awards_found: awardsFound,
            new_awards_added: newAwardsAdded,
            duplicate_awards_seen: duplicateAwardsSeen,
            run_summary: runSummary,
        })
        .eq("id", runId);

    if (error) throw error;
}

async function failSearchRun(runId: string, errorMessage: string) {
    await supabaseAdmin
        .from("award_search_runs")
        .update({
            status: "failed",
            finished_at: new Date().toISOString(),
            error_message: errorMessage,
        })
        .eq("id", runId);
}

async function saveAward(award: NormalizedNsfAward, query: string) {
    const scores = scoreAwardRelevance(award, query);

    const { data: existing, error: existingError } = await supabaseAdmin
        .from("funded_awards")
        .select("id")
        .eq("source", "nsf")
        .eq("source_award_id", award.source_award_id)
        .limit(1)
        .maybeSingle();

    if (existingError) throw existingError;

    if (existing?.id) {
        return {
            added: false,
            id: existing.id as string,
        };
    }

    const { data, error } = await supabaseAdmin
        .from("funded_awards")
        .insert([
            {
                source: award.source,
                source_award_id: award.source_award_id,
                award_number: award.award_number,
                title: award.title,
                agency: award.agency,
                program: award.program,
                program_officer: award.program_officer,
                pi_name: award.pi_name,
                co_pi_names: award.co_pi_names,
                institution: award.institution,
                institution_state: award.institution_state,
                institution_country: award.institution_country,
                amount: award.amount,
                amount_text: award.amount_text,
                start_date: award.start_date,
                end_date: award.end_date,
                award_year: award.award_year,
                abstract: award.abstract,
                keywords: award.keywords,
                topic_tags: award.topic_tags,
                url: award.url,
                relevance_score: scores.relevance_score,
                relevance_reason: scores.relevance_reason,
                strategic_lesson: scores.strategic_lesson,
                raw_json: award.raw_json,
            },
        ])
        .select("id")
        .single();

    if (error) throw error;

    return {
        added: true,
        id: data.id as string,
    };
}

async function searchNsfAwards(query: string, rows: number, offset: number) {
    const params = new URLSearchParams({
        keyword: query,
        rpp: String(rows),
        offset: String(offset),
        printFields:
            "id,title,abstractText,awardeeName,awardeeStateCode,awardeeCountryCode,piFirstName,piLastName,coPDPI,startDate,expDate,fundsObligatedAmt,programName,poName,primaryProgram,cfdaNumber",
    });

    const url = `https://www.research.gov/awardapi-service/v1/awards.json?${params.toString()}`;

    const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            payload?.message ||
            payload?.error ||
            `NSF Award Search failed with status ${response.status}`
        );
    }

    return payload;
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message:
            "NSF Award Search route is working. Use POST with { query, rows, offset, saveToDatabase }.",
        example: {
            query: "physics-informed machine learning chemical engineering",
            rows: 10,
            offset: 0,
            saveToDatabase: true,
        },
    });
}

export async function POST(request: Request) {
    let runId: string | null = null;

    try {
        const parsed = await safelyReadJson(request);

        if (!parsed.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    error: parsed.error,
                },
                { status: 400 }
            );
        }

        const body = parsed.body as NsfAwardSearchRequest;

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

        const rows = Math.min(Math.max(body.rows || 10, 1), 50);
        const offset = Math.max(body.offset || 0, 0);
        const saveToDatabase = body.saveToDatabase !== false;

        runId = await insertSearchRun(query);

        const payload = await searchNsfAwards(query, rows, offset);
        const rawAwards = extractAwards(payload);

        const normalizedAwards = rawAwards.map((item) =>
            normalizeNsfAward(item, query)
        );

        let newAwardsAdded = 0;
        let duplicateAwardsSeen = 0;

        const awardsWithScores = normalizedAwards.map((award) => {
            const scores = scoreAwardRelevance(award, query);

            return {
                ...award,
                relevance_score: scores.relevance_score,
                relevance_reason: scores.relevance_reason,
                strategic_lesson: scores.strategic_lesson,
            };
        });

        if (saveToDatabase) {
            for (const award of normalizedAwards) {
                if (!award.source_award_id || !award.title) continue;

                const result = await saveAward(award, query);

                if (result.added) {
                    newAwardsAdded += 1;
                } else {
                    duplicateAwardsSeen += 1;
                }
            }
        }

        const runSummary = `NSF award search for "${query}" found ${normalizedAwards.length} awards, added ${newAwardsAdded} new awards, and saw ${duplicateAwardsSeen} duplicates.`;

        await completeSearchRun(
            runId,
            normalizedAwards.length,
            newAwardsAdded,
            duplicateAwardsSeen,
            runSummary
        );

        return NextResponse.json({
            ok: true,
            source: "nsf",
            query,
            rows,
            offset,
            saveToDatabase,
            awards_found: normalizedAwards.length,
            new_awards_added: newAwardsAdded,
            duplicate_awards_seen: duplicateAwardsSeen,
            awards: awardsWithScores,
            run_id: runId,
            run_summary: runSummary,
            raw: payload,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown NSF award search error.";

        console.error("NSF Award Search route error:", error);

        if (runId) {
            await failSearchRun(runId, errorMessage);
        }

        return NextResponse.json(
            {
                ok: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}