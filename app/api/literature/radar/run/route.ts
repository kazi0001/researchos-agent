import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ResearchTopic = {
    id: string;
    topic_name: string;
    keywords: string;
    description: string | null;
    preferred_source: string | null;
    search_frequency: string | null;
    is_active: boolean | null;
    last_searched_at: string | null;
    next_search_at: string | null;
};

type PaperCandidate = {
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
    raw: any;
};

type RadarRunRequest = {
    topicId?: string;
    limitPerTopic?: number;
    runType?: "manual" | "scheduled";
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
            ok: true,
            body: {},
            error: null,
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
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    if (typeof value === "number") {
        return String(value);
    }

    return null;
}

function getNumber(value: unknown): number | null {
    if (typeof value === "number") {
        return value;
    }

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

function normalizeDate(value: unknown): string | null {
    const text = getText(value);

    if (!text) return null;

    const parsed = new Date(text);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString().split("T")[0];
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

function normalizeSemanticScholarPaper(item: any): PaperCandidate {
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

function normalizeCrossrefPaper(item: any): PaperCandidate {
    const doi = getText(item?.DOI);
    const title = getFirstArrayText(item?.title) || "Untitled Crossref work";

    const authors = Array.isArray(item?.author)
        ? item.author
            .map((author: any) => {
                const given = getText(author?.given);
                const family = getText(author?.family);
                const name = getText(author?.name);

                if (given && family) return `${given} ${family}`;
                if (family) return family;
                if (name) return name;
                return null;
            })
            .filter(Boolean)
            .join(", ")
        : "";

    const venue =
        getFirstArrayText(item?.["container-title"]) ||
        getFirstArrayText(item?.["short-container-title"]) ||
        getText(item?.publisher);

    const publicationDate =
        getDatePartsDate(item?.published) ||
        getDatePartsDate(item?.["published-print"]) ||
        getDatePartsDate(item?.["published-online"]) ||
        getDatePartsDate(item?.issued) ||
        getDatePartsDate(item?.created);

    const year =
        getDateYear(item?.published) ||
        getDateYear(item?.["published-print"]) ||
        getDateYear(item?.["published-online"]) ||
        getDateYear(item?.issued) ||
        getDateYear(item?.created);

    const fieldsOfStudy = Array.isArray(item?.subject)
        ? item.subject.filter(Boolean).join(", ")
        : null;

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

async function searchSemanticScholar(query: string, limit: number) {
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

    if (!response.ok) {
        throw new Error(
            payload?.message ||
            payload?.error ||
            `Semantic Scholar failed with status ${response.status}`
        );
    }

    const data = Array.isArray(payload?.data) ? payload.data : [];
    return data.map(normalizeSemanticScholarPaper);
}

async function searchCrossref(query: string, limit: number) {
    const params = new URLSearchParams({
        "query.bibliographic": query,
        rows: String(limit),
        sort: "relevance",
        order: "desc",
    });

    if (process.env.CROSSREF_MAILTO) {
        params.set("mailto", process.env.CROSSREF_MAILTO);
    }

    const response = await fetch(
        `https://api.crossref.org/works?${params.toString()}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": `ResearchOS-Agent/0.1 (mailto:${process.env.CROSSREF_MAILTO || "no-email-provided"
                    })`,
            },
            cache: "no-store",
        }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            payload?.message ||
            payload?.error ||
            `Crossref failed with status ${response.status}`
        );
    }

    const items = Array.isArray(payload?.message?.items)
        ? payload.message.items
        : [];

    return items.map(normalizeCrossrefPaper);
}

async function searchForTopic(topic: ResearchTopic, limit: number) {
    const source = topic.preferred_source || "auto";

    if (source === "semantic_scholar") {
        return searchSemanticScholar(topic.keywords, limit);
    }

    if (source === "crossref") {
        return searchCrossref(topic.keywords, limit);
    }

    try {
        return await searchSemanticScholar(topic.keywords, limit);
    } catch (semanticError) {
        console.warn(
            `Semantic Scholar failed for topic "${topic.topic_name}", using Crossref fallback.`,
            semanticError
        );
        return searchCrossref(topic.keywords, limit);
    }
}

function calculatePaperScores(paper: PaperCandidate, topic: ResearchTopic) {
    const text = [
        paper.title,
        paper.abstract,
        paper.tldr,
        paper.fields_of_study,
        paper.venue,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    const keywords = topic.keywords
        .toLowerCase()
        .split(/[\s,;]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 3);

    const uniqueKeywords = Array.from(new Set(keywords));
    const matchedKeywords = uniqueKeywords.filter((keyword) =>
        text.includes(keyword)
    );

    const keywordMatchRatio =
        uniqueKeywords.length > 0
            ? matchedKeywords.length / uniqueKeywords.length
            : 0;

    const aiRelevanceScore = Math.min(
        100,
        Math.round(35 + keywordMatchRatio * 55 + (paper.abstract ? 10 : 0))
    );

    const currentYear = new Date().getFullYear();
    const year = paper.year || currentYear;
    const age = Math.max(0, currentYear - year);
    const noveltyScore = Math.max(20, Math.min(100, 100 - age * 8));

    const citations = paper.citation_count || 0;
    const influential = paper.influential_citation_count || 0;
    const citationContextScore = Math.min(
        100,
        Math.round(citations * 1.5 + influential * 5)
    );

    const proposalUsefulnessScore = Math.round(
        aiRelevanceScore * 0.55 + noveltyScore * 0.25 + citationContextScore * 0.2
    );

    const matchScore = Math.round(
        aiRelevanceScore * 0.6 + noveltyScore * 0.2 + citationContextScore * 0.2
    );

    const matchReason =
        matchedKeywords.length > 0
            ? `Matched topic keywords: ${matchedKeywords.slice(0, 12).join(", ")}.`
            : "Saved by Literature Radar based on topic search; manual review recommended.";

    return {
        aiRelevanceScore,
        noveltyScore,
        citationContextScore,
        proposalUsefulnessScore,
        matchScore,
        matchReason,
    };
}

async function findExistingPaper(paper: PaperCandidate) {
    if (paper.doi) {
        const { data, error } = await supabaseAdmin
            .from("papers")
            .select("id")
            .eq("doi", paper.doi)
            .limit(1)
            .maybeSingle();

        if (!error && data?.id) {
            return data.id as string;
        }
    }

    const { data, error } = await supabaseAdmin
        .from("papers")
        .select("id")
        .eq("source", paper.source)
        .eq("source_id", paper.source_id)
        .limit(1)
        .maybeSingle();

    if (!error && data?.id) {
        return data.id as string;
    }

    return null;
}

async function insertNewPaper(
    paper: PaperCandidate,
    topic: ResearchTopic,
    scores: ReturnType<typeof calculatePaperScores>
) {
    const { data, error } = await supabaseAdmin
        .from("papers")
        .insert([
            {
                source: paper.source,
                source_id: paper.source_id,
                title: paper.title,
                authors: paper.authors,
                year: paper.year,
                venue: paper.venue,
                publication_date: paper.publication_date,
                abstract: paper.abstract,
                tldr: paper.tldr,
                doi: paper.doi,
                url: paper.url,
                citation_count: paper.citation_count,
                influential_citation_count: paper.influential_citation_count,
                reference_count: paper.reference_count,
                fields_of_study: paper.fields_of_study,
                topic_tags: topic.keywords,
                relevance_reason: scores.matchReason,
                status: "saved",
                paper_status: "saved",
                review_notes: "",
                manuscript_use_note: "",
                proposal_use_note: "",
                ai_relevance_score: scores.aiRelevanceScore,
                novelty_score: scores.noveltyScore,
                citation_context_score: scores.citationContextScore,
                proposal_usefulness_score: scores.proposalUsefulnessScore,
                manual_rating: null,
                discovery_status: "new",
                discovered_for_topic: topic.topic_name,
                first_seen_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
                added_by_agent: true,
                raw_json: paper.raw,
            },
        ])
        .select("id")
        .single();

    if (error) {
        throw error;
    }

    return data.id as string;
}

async function updateExistingPaperSeen(
    paperId: string,
    topic: ResearchTopic,
    scores: ReturnType<typeof calculatePaperScores>
) {
    const { error } = await supabaseAdmin
        .from("papers")
        .update({
            last_seen_at: new Date().toISOString(),
            discovered_for_topic: topic.topic_name,
            ai_relevance_score: scores.aiRelevanceScore,
            novelty_score: scores.noveltyScore,
            citation_context_score: scores.citationContextScore,
            proposal_usefulness_score: scores.proposalUsefulnessScore,
            updated_at: new Date().toISOString(),
        })
        .eq("id", paperId);

    if (error) {
        throw error;
    }
}

async function upsertPaperTopicMatch(
    paperId: string,
    topic: ResearchTopic,
    radarRunId: string,
    scores: ReturnType<typeof calculatePaperScores>,
    isNew: boolean
) {
    const { error } = await supabaseAdmin.from("paper_topic_matches").upsert(
        {
            paper_id: paperId,
            topic_id: topic.id,
            radar_run_id: radarRunId,
            match_score: scores.matchScore,
            match_reason: scores.matchReason,
            is_new: isNew,
            is_relevant: scores.matchScore >= 50,
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "paper_id,topic_id",
        }
    );

    if (error) {
        throw error;
    }
}

function getNextSearchAt(frequency: string | null) {
    const date = new Date();

    if (frequency === "weekly") {
        date.setDate(date.getDate() + 7);
    } else if (frequency === "manual") {
        return null;
    } else {
        date.setDate(date.getDate() + 1);
    }

    return date.toISOString();
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message:
            "Literature Radar run route is working. Use POST to run active topic searches.",
        example: {
            runType: "manual",
            limitPerTopic: 3,
        },
    });
}

export async function POST(request: Request) {
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

    const body = parsed.body as RadarRunRequest;
    const limitPerTopic = Math.min(Math.max(body.limitPerTopic || 3, 1), 10);
    const runType = body.runType || "manual";

    let radarRunId: string | null = null;

    try {
        const { data: runData, error: runError } = await supabaseAdmin
            .from("literature_radar_runs")
            .insert([
                {
                    run_type: runType,
                    status: "started",
                    started_at: new Date().toISOString(),
                },
            ])
            .select("id")
            .single();

        if (runError) {
            throw runError;
        }

        if (!runData?.id) {
            throw new Error("Failed to create literature radar run.");
        }

        const activeRadarRunId: string = runData.id;
        radarRunId = activeRadarRunId;

        let topicsQuery = supabaseAdmin
            .from("research_topics")
            .select("*")
            .eq("is_active", true);

        if (body.topicId) {
            topicsQuery = topicsQuery.eq("id", body.topicId);
        }

        const { data: topics, error: topicsError } = await topicsQuery.order(
            "created_at",
            { ascending: true }
        );

        if (topicsError) {
            throw topicsError;
        }

        const activeTopics = (topics || []) as ResearchTopic[];

        let papersFound = 0;
        let newPapersAdded = 0;
        let duplicatePapersSeen = 0;

        const topicSummaries: Array<{
            topic: string;
            found: number;
            added: number;
            duplicates: number;
            error?: string;
        }> = [];

        for (const topic of activeTopics) {
            let topicFound = 0;
            let topicAdded = 0;
            let topicDuplicates = 0;

            try {
                const papers = await searchForTopic(topic, limitPerTopic);

                topicFound = papers.length;
                papersFound += papers.length;

                for (const paper of papers) {
                    if (!paper.source_id || !paper.title) {
                        continue;
                    }

                    const scores = calculatePaperScores(paper, topic);
                    const existingPaperId = await findExistingPaper(paper);

                    let paperId: string;
                    let isNew = false;

                    if (existingPaperId) {
                        paperId = existingPaperId;
                        duplicatePapersSeen += 1;
                        topicDuplicates += 1;

                        await updateExistingPaperSeen(paperId, topic, scores);
                    } else {
                        paperId = await insertNewPaper(paper, topic, scores);
                        newPapersAdded += 1;
                        topicAdded += 1;
                        isNew = true;
                    }

                    const activeRadarRunId = radarRunId;

                    if (!activeRadarRunId) {
                        throw new Error("Literature radar run ID was not created.");
                    }

                    await upsertPaperTopicMatch(
                        paperId,
                        topic,
                        activeRadarRunId,
                        scores,
                        isNew
                    );
                }

                await supabaseAdmin
                    .from("research_topics")
                    .update({
                        last_searched_at: new Date().toISOString(),
                        next_search_at: getNextSearchAt(topic.search_frequency),
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", topic.id);

                topicSummaries.push({
                    topic: topic.topic_name,
                    found: topicFound,
                    added: topicAdded,
                    duplicates: topicDuplicates,
                });

                // Respect Semantic Scholar 1 request/second limit when topics use auto/S2.
                await new Promise((resolve) => setTimeout(resolve, 1100));
            } catch (topicError) {
                const errorMessage =
                    topicError instanceof Error
                        ? topicError.message
                        : "Unknown topic search error.";

                topicSummaries.push({
                    topic: topic.topic_name,
                    found: topicFound,
                    added: topicAdded,
                    duplicates: topicDuplicates,
                    error: errorMessage,
                });
            }
        }

        const runSummary = topicSummaries
            .map((item) => {
                if (item.error) {
                    return `${item.topic}: error: ${item.error}`;
                }

                return `${item.topic}: found ${item.found}, added ${item.added}, duplicates ${item.duplicates}`;
            })
            .join("\n");

        await supabaseAdmin
            .from("literature_radar_runs")
            .update({
                status: "completed",
                finished_at: new Date().toISOString(),
                topics_searched: activeTopics.length,
                papers_found: papersFound,
                new_papers_added: newPapersAdded,
                duplicate_papers_seen: duplicatePapersSeen,
                run_summary: runSummary,
            })
            .eq("id", radarRunId);

        return NextResponse.json({
            ok: true,
            radar_run_id: radarRunId,
            topics_searched: activeTopics.length,
            papers_found: papersFound,
            new_papers_added: newPapersAdded,
            duplicate_papers_seen: duplicatePapersSeen,
            topic_summaries: topicSummaries,
            run_summary: runSummary,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown Literature Radar run error.";

        console.error("Literature Radar run error:", error);

        if (radarRunId) {
            await supabaseAdmin
                .from("literature_radar_runs")
                .update({
                    status: "failed",
                    finished_at: new Date().toISOString(),
                    error_message: errorMessage,
                })
                .eq("id", radarRunId);
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