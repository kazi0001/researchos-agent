import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

type Paper = {
    id: string;
    title: string;
    authors: string | null;
    year: number | null;
    venue: string | null;
    doi: string | null;
    url: string | null;
    abstract: string | null;
    tldr: string | null;
    citation_count: number | null;
    ai_relevance_score: number | null;
    novelty_score: number | null;
    citation_context_score: number | null;
    proposal_usefulness_score: number | null;
    manual_rating: number | null;
    paper_status: string | null;
    discovery_status: string | null;
    discovered_for_topic: string | null;
    added_by_agent: boolean | null;
    first_seen_at: string | null;
    created_at: string | null;
};

function getDaysAgoDate(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function paperLine(paper: Paper) {
    const score = paper.ai_relevance_score ?? "not scored";
    const proposal = paper.proposal_usefulness_score ?? "not scored";
    const topic = paper.discovered_for_topic || "unknown topic";

    return `${paper.title} (${paper.year || "year unknown"}) | Topic: ${topic} | AI relevance: ${score} | Proposal usefulness: ${proposal}`;
}

function sortByScore(papers: Paper[], key: keyof Paper) {
    return [...papers].sort((a, b) => {
        const aValue = Number(a[key] || 0);
        const bValue = Number(b[key] || 0);
        return bValue - aValue;
    });
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const days = Math.max(1, Math.min(30, Number(url.searchParams.get("days") || 1)));
        const since = getDaysAgoDate(days);

        const { data: papersData, error: papersError } = await supabaseAdmin
            .from("papers")
            .select(
                `
        id,
        title,
        authors,
        year,
        venue,
        doi,
        url,
        abstract,
        tldr,
        citation_count,
        ai_relevance_score,
        novelty_score,
        citation_context_score,
        proposal_usefulness_score,
        manual_rating,
        paper_status,
        discovery_status,
        discovered_for_topic,
        added_by_agent,
        first_seen_at,
        created_at
      `
            )
            .or(`created_at.gte.${since},first_seen_at.gte.${since}`)
            .order("created_at", { ascending: false });

        if (papersError) {
            throw papersError;
        }

        const { data: latestRun, error: runError } = await supabaseAdmin
            .from("literature_radar_runs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (runError) {
            throw runError;
        }

        const papers = (papersData || []) as Paper[];

        const newRadarPapers = papers.filter(
            (paper) => paper.added_by_agent && paper.discovery_status === "new"
        );

        const topByRelevance = sortByScore(papers, "ai_relevance_score").slice(0, 5);
        const topByProposal = sortByScore(papers, "proposal_usefulness_score").slice(0, 5);
        const topByManualRating = sortByScore(papers, "manual_rating").slice(0, 5);
        const topByCitations = sortByScore(papers, "citation_count").slice(0, 5);

        const memoSections = {
            headline: `Literature Radar Memo, last ${days} day${days === 1 ? "" : "s"}`,
            counts: {
                papers_found_in_window: papers.length,
                new_radar_papers: newRadarPapers.length,
                top_relevance_available: topByRelevance.length,
                top_proposal_available: topByProposal.length,
            },
            latest_run: latestRun || null,
            new_papers: newRadarPapers.map(paperLine),
            top_by_relevance: topByRelevance.map(paperLine),
            top_by_proposal_usefulness: topByProposal.map(paperLine),
            top_by_manual_rating: topByManualRating.map(paperLine),
            top_by_citations: topByCitations.map(paperLine),
            recommended_action:
                newRadarPapers.length > 0
                    ? "Review the new radar-added papers first. Start with the highest proposal usefulness score, then manually rate papers that look important."
                    : "No new radar-added papers were found in this window. Run Literature Radar or broaden the topic keywords.",
        };

        return NextResponse.json({
            ok: true,
            days,
            generated_at: new Date().toISOString(),
            memo: memoSections,
            papers,
        });
    } catch (error) {
        console.error("Literature Radar memo error:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown Literature Radar memo error.",
            },
            { status: 500 }
        );
    }
}