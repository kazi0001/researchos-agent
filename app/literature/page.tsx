"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

type LiteratureSource = "auto" | "semantic_scholar" | "crossref";

type PaperFilter =
    | "all"
    | "new_by_radar"
    | "saved"
    | "reading"
    | "cite"
    | "use_in_proposal"
    | "ignored"
    | "must_read";

type PaperSort =
    | "newest"
    | "ai_relevance"
    | "proposal_usefulness"
    | "manual_rating"
    | "citation_count"
    | "year";

type SemanticPaper = {
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

type SavedPaper = {
    id: string;
    source: string | null;
    source_id: string | null;
    title: string;
    authors: string | null;
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
    topic_tags: string | null;
    relevance_reason: string | null;
    status: string | null;
    paper_status: string | null;
    review_notes: string | null;
    manuscript_use_note: string | null;
    proposal_use_note: string | null;
    ai_relevance_score: number | null;
    novelty_score: number | null;
    citation_context_score: number | null;
    proposal_usefulness_score: number | null;
    manual_rating: number | null;
    discovery_status: string | null;
    discovered_for_topic: string | null;
    added_by_agent: boolean | null;
    first_seen_at: string | null;
    last_seen_at: string | null;
    paper_category: string | null;
    citation_key: string | null;
    export_status: string | null;
    exported_to: string | null;
    exported_at: string | null;
    created_at: string | null;
};

export default function LiteraturePage() {
    const [query, setQuery] = useState("agentic AI process systems engineering");
    const [limit, setLimit] = useState("10");
    const [year, setYear] = useState("");
    const [literatureSource, setLiteratureSource] =
        useState<LiteratureSource>("auto");

    const [paperFilter, setPaperFilter] = useState<PaperFilter>("all");
    const [paperSort, setPaperSort] = useState<PaperSort>("newest");

    const [searching, setSearching] = useState(false);
    const [savingPaperId, setSavingPaperId] = useState<string | null>(null);
    const [updatingRatingId, setUpdatingRatingId] = useState<string | null>(null);

    const [results, setResults] = useState<SemanticPaper[]>([]);
    const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        loadSavedPapers();
    }, []);

    const filteredAndSortedPapers = useMemo(() => {
        let filtered = [...savedPapers];

        if (paperFilter === "new_by_radar") {
            filtered = filtered.filter(
                (paper) => paper.added_by_agent && paper.discovery_status === "new"
            );
        } else if (paperFilter === "must_read") {
            filtered = filtered.filter((paper) => paper.manual_rating === 5);
        } else if (paperFilter !== "all") {
            filtered = filtered.filter((paper) => {
                const status = paper.paper_status || "saved";
                return status === paperFilter;
            });
        }

        filtered.sort((a, b) => {
            if (paperSort === "ai_relevance") {
                return (b.ai_relevance_score || 0) - (a.ai_relevance_score || 0);
            }

            if (paperSort === "proposal_usefulness") {
                return (
                    (b.proposal_usefulness_score || 0) -
                    (a.proposal_usefulness_score || 0)
                );
            }

            if (paperSort === "manual_rating") {
                return (b.manual_rating || 0) - (a.manual_rating || 0);
            }

            if (paperSort === "citation_count") {
                return (b.citation_count || 0) - (a.citation_count || 0);
            }

            if (paperSort === "year") {
                return (b.year || 0) - (a.year || 0);
            }

            const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bDate - aDate;
        });

        return filtered;
    }, [savedPapers, paperFilter, paperSort]);

    async function loadSavedPapers() {
        setErrorMessage("");

        const { data, error } = await supabase
            .from("papers")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading saved papers:", error);
            setErrorMessage(error.message);
            return;
        }

        setSavedPapers(data || []);
    }

    async function searchWithSource(source: Exclude<LiteratureSource, "auto">) {
        const endpoint =
            source === "semantic_scholar"
                ? "/api/literature/semantic-scholar/search"
                : "/api/literature/crossref/search";

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: query.trim(),
                limit: Math.min(Number(limit), 50),
                year: year.trim() || undefined,
            }),
        });

        const payload = await response.json();

        if (!response.ok || !payload.ok) {
            throw {
                source,
                payload,
                status: response.status,
            };
        }

        return {
            source,
            payload,
        };
    }

    async function handleSearchPapers() {
        setSearching(true);
        setMessage("");
        setErrorMessage("");
        setResults([]);

        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setErrorMessage("Please enter a paper search query.");
            setSearching(false);
            return;
        }

        const parsedLimit = Number(limit);

        if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
            setErrorMessage("Limit must be a positive number.");
            setSearching(false);
            return;
        }

        try {
            if (literatureSource === "semantic_scholar") {
                const { payload } = await searchWithSource("semantic_scholar");
                setResults(payload.papers || []);
                setMessage(
                    `Found ${payload.count || 0
                    } papers from Semantic Scholar for "${trimmedQuery}".`
                );
            } else if (literatureSource === "crossref") {
                const { payload } = await searchWithSource("crossref");
                setResults(payload.papers || []);
                setMessage(
                    `Found ${payload.count || 0} papers from Crossref for "${trimmedQuery}".`
                );
            } else {
                try {
                    const { payload } = await searchWithSource("semantic_scholar");
                    setResults(payload.papers || []);
                    setMessage(
                        `Found ${payload.count || 0
                        } papers from Semantic Scholar for "${trimmedQuery}".`
                    );
                } catch (semanticError: any) {
                    console.warn("Semantic Scholar failed, trying Crossref:", semanticError);
                    const { payload } = await searchWithSource("crossref");
                    setResults(payload.papers || []);
                    setMessage(
                        `Semantic Scholar was unavailable or rate-limited. Found ${payload.count || 0
                        } papers from Crossref for "${trimmedQuery}".`
                    );
                }
            }
        } catch (error: any) {
            console.error("Paper search error:", error);

            const payload = error?.payload;

            setErrorMessage(
                payload?.error ||
                payload?.message ||
                "Literature search failed. Please try again."
            );
        }

        setSearching(false);
    }

    function isAlreadySaved(paper: SemanticPaper) {
        return savedPapers.some(
            (saved) =>
                saved.source === paper.source && saved.source_id === paper.source_id
        );
    }

    async function handleSavePaper(paper: SemanticPaper) {
        setSavingPaperId(paper.source_id);
        setMessage("");
        setErrorMessage("");

        if (isAlreadySaved(paper)) {
            setErrorMessage("This paper is already saved.");
            setSavingPaperId(null);
            return;
        }

        const relevanceReason = buildSimpleRelevanceReason(paper);

        const { error } = await supabase.from("papers").insert([
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
                topic_tags: query,
                relevance_reason: relevanceReason,
                status: "saved",
                paper_status: "saved",
                review_notes: "",
                manuscript_use_note: "",
                proposal_use_note: "",
                ai_relevance_score: null,
                novelty_score: null,
                citation_context_score: null,
                proposal_usefulness_score: null,
                manual_rating: null,
                discovery_status: "saved",
                discovered_for_topic: query,
                first_seen_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
                added_by_agent: false,
                paper_category: "literature_review",
                citation_key: null,
                export_status: "not_exported",
                exported_to: null,
                exported_at: null,
                raw_json: paper.raw,
            },
        ]);

        if (error) {
            console.error("Error saving paper:", error);
            setErrorMessage(error.message);
            setSavingPaperId(null);
            return;
        }

        setMessage(`Saved paper: ${paper.title}`);
        await loadSavedPapers();
        setSavingPaperId(null);
    }

    async function handleUpdateManualRating(
        paperId: string,
        ratingValue: string
    ) {
        setUpdatingRatingId(paperId);
        setMessage("");
        setErrorMessage("");

        const manualRating =
            ratingValue === "none" ? null : Math.max(1, Math.min(5, Number(ratingValue)));

        const { error } = await supabase
            .from("papers")
            .update({
                manual_rating: manualRating,
                updated_at: new Date().toISOString(),
            })
            .eq("id", paperId);

        if (error) {
            console.error("Error updating manual rating:", error);
            setErrorMessage(error.message);
            setUpdatingRatingId(null);
            return;
        }

        setSavedPapers((currentPapers) =>
            currentPapers.map((paper) =>
                paper.id === paperId ? { ...paper, manual_rating: manualRating } : paper
            )
        );

        setMessage(
            manualRating ? `Manual rating updated to ${manualRating}/5.` : "Rating cleared."
        );
        setUpdatingRatingId(null);
    }

    function buildSimpleRelevanceReason(paper: SemanticPaper) {
        const reasons: string[] = [];

        const title = paper.title.toLowerCase();
        const abstract = paper.abstract?.toLowerCase() || "";

        if (title.includes("agent") || abstract.includes("agent")) {
            reasons.push("relevant to agentic or autonomous systems");
        }

        if (abstract.includes("chemical") || abstract.includes("process")) {
            reasons.push("connects to process or chemical engineering");
        }

        if (abstract.includes("optimization") || abstract.includes("control")) {
            reasons.push("connects to optimization or control");
        }

        if (
            abstract.includes("machine learning") ||
            abstract.includes("artificial intelligence") ||
            abstract.includes(" ai ")
        ) {
            reasons.push("connects to AI or machine learning");
        }

        if (abstract.includes("physics-informed") || abstract.includes("pinn")) {
            reasons.push("connects to physics-informed modeling");
        }

        if (abstract.includes("supply chain") || abstract.includes("resilience")) {
            reasons.push("connects to supply chain resilience");
        }

        if (reasons.length === 0) {
            return "Saved from Literature Scout search. Relevance should be reviewed manually.";
        }

        return reasons.join("; ") + ".";
    }

    function getPaperStatusLabel(status: string | null) {
        if (status === "reading") return "Reading";
        if (status === "cite") return "Cite";
        if (status === "use_in_proposal") return "Use in proposal";
        if (status === "ignored") return "Ignored";
        return "Saved";
    }

    function getSourceLabel(source: string | null) {
        if (source === "semantic_scholar") return "Semantic Scholar";
        if (source === "crossref") return "Crossref";
        return source || "Unknown source";
    }

    function getCategoryLabel(category: string | null) {
        if (category === "methods") return "Methods";
        if (category === "dataset_benchmark") return "Dataset / Benchmark";
        if (category === "proposal_support") return "Proposal Support";
        if (category === "background_reading") return "Background Reading";
        if (category === "threat_paper") return "Threat Paper";
        if (category === "gap_paper") return "Gap Paper";
        if (category === "must_read") return "Must Read";
        if (category === "cite_later") return "Cite Later";
        if (category === "ignore") return "Ignore";
        return "Literature Review";
    }

    function getExportStatusLabel(status: string | null) {
        if (status === "ready_to_export") return "Ready to export";
        if (status === "exported_bibtex") return "Exported BibTeX";
        if (status === "exported_ris") return "Exported RIS";
        if (status === "exported_csv") return "Exported CSV";
        if (status === "exported_to_zotero") return "Exported to Zotero";
        if (status === "exported_to_endnote") return "Exported to EndNote";
        return "Not exported";
    }

    function getSavedPaperStatusCounts() {
        return {
            total: savedPapers.length,
            saved: savedPapers.filter(
                (paper) => !paper.paper_status || paper.paper_status === "saved"
            ).length,
            reading: savedPapers.filter((paper) => paper.paper_status === "reading")
                .length,
            cite: savedPapers.filter((paper) => paper.paper_status === "cite").length,
            proposal: savedPapers.filter(
                (paper) => paper.paper_status === "use_in_proposal"
            ).length,
            ignored: savedPapers.filter((paper) => paper.paper_status === "ignored")
                .length,
            newByRadar: savedPapers.filter(
                (paper) =>
                    paper.added_by_agent === true && paper.discovery_status === "new"
            ).length,
        };
    }

    function getScoreDisplay(score: number | null) {
        if (score === null || score === undefined) {
            return "Not scored";
        }

        return `${score}/100`;
    }

    function getManualRatingDisplay(rating: number | null) {
        if (!rating) {
            return "Not rated";
        }

        return `${rating}/5`;
    }

    function getFilterLabel(filter: PaperFilter) {
        if (filter === "new_by_radar") return "New by Radar";
        if (filter === "saved") return "Saved";
        if (filter === "reading") return "Reading";
        if (filter === "cite") return "Cite";
        if (filter === "use_in_proposal") return "Use in Proposal";
        if (filter === "ignored") return "Ignored";
        if (filter === "must_read") return "Must Read";
        return "All";
    }

    function getSortLabel(sort: PaperSort) {
        if (sort === "ai_relevance") return "AI relevance score";
        if (sort === "proposal_usefulness") return "Proposal usefulness score";
        if (sort === "manual_rating") return "Manual rating";
        if (sort === "citation_count") return "Citation count";
        if (sort === "year") return "Year";
        return "Newest saved";
    }

    const statusCounts = getSavedPaperStatusCounts();

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Literature Scout"
                    description="Search recent and relevant papers, save useful papers, and build the foundation for literature reviews, research gaps, and proposal context."
                    activePage="literature"
                />

                {message && (
                    <div className="mb-6 rounded-xl border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
                        {message}
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                        {errorMessage}
                    </div>
                )}

                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Topic Radar</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Manage recurring research topics for automated paper discovery.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <a
                                href="/literature/topics"
                                className="rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                            >
                                Manage Research Topics
                            </a>

                            <a
                                href="/literature/memo"
                                className="rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                            >
                                Daily Memo
                            </a>

                            <a
                                href="/literature/export"
                                className="rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                            >
                                Export Papers
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-7">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Saved Papers</p>
                        <p className="mt-2 text-3xl font-bold">{statusCounts.total}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">New by Radar</p>
                        <p className="mt-2 text-3xl font-bold">{statusCounts.newByRadar}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Saved</p>
                        <p className="mt-2 text-3xl font-bold">{statusCounts.saved}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Reading</p>
                        <p className="mt-2 text-3xl font-bold">{statusCounts.reading}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Cite</p>
                        <p className="mt-2 text-3xl font-bold">{statusCounts.cite}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Use in Proposal</p>
                        <p className="mt-2 text-3xl font-bold">{statusCounts.proposal}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">Ignored</p>
                        <p className="mt-2 text-3xl font-bold">{statusCounts.ignored}</p>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-xl font-semibold">Search Papers</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Search scholarly metadata using Semantic Scholar, Crossref, or
                        automatic fallback.
                    </p>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_160px_180px_230px] lg:items-end">
                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Search query
                            </label>
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="agentic AI process systems engineering"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Limit
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={limit}
                                onChange={(event) => setLimit(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Year filter
                            </label>
                            <input
                                type="text"
                                value={year}
                                onChange={(event) => setYear(event.target.value)}
                                placeholder="2023-2026"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Source
                            </label>
                            <select
                                value={literatureSource}
                                onChange={(event) =>
                                    setLiteratureSource(event.target.value as LiteratureSource)
                                }
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            >
                                <option value="auto">
                                    Auto, Semantic Scholar then Crossref
                                </option>
                                <option value="semantic_scholar">Semantic Scholar</option>
                                <option value="crossref">Crossref</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSearchPapers}
                        disabled={searching}
                        className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {searching ? "Searching..." : "Search Papers"}
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <h2 className="text-xl font-semibold">Search Results</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Review results and save papers that may support proposals or
                            manuscripts.
                        </p>

                        {results.length === 0 && (
                            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                                No search results yet.
                            </div>
                        )}

                        {results.length > 0 && (
                            <div className="mt-6 space-y-4">
                                {results.map((paper) => {
                                    const alreadySaved = isAlreadySaved(paper);

                                    return (
                                        <div
                                            key={`${paper.source}-${paper.source_id}`}
                                            className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm text-slate-500">
                                                        {getSourceLabel(paper.source)} •{" "}
                                                        {paper.year || "Year unknown"}{" "}
                                                        {paper.venue ? `• ${paper.venue}` : ""}
                                                    </p>

                                                    <h3 className="mt-2 font-semibold">{paper.title}</h3>

                                                    <p className="mt-2 text-sm text-slate-400">
                                                        {paper.authors || "Authors not provided"}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col gap-2 sm:items-end">
                                                    <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                        {paper.citation_count ?? 0} citations
                                                    </span>

                                                    {paper.influential_citation_count !== null && (
                                                        <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                            {paper.influential_citation_count} influential
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {paper.tldr && (
                                                <p className="mt-4 text-sm leading-6 text-slate-300">
                                                    <span className="font-semibold text-slate-100">
                                                        TLDR:
                                                    </span>{" "}
                                                    {paper.tldr}
                                                </p>
                                            )}

                                            {paper.abstract && (
                                                <p className="mt-4 max-h-40 overflow-y-auto text-sm leading-6 text-slate-400">
                                                    {paper.abstract}
                                                </p>
                                            )}

                                            <div className="mt-4 grid gap-3 text-sm text-slate-400 md:grid-cols-2">
                                                <p>
                                                    <span className="text-slate-500">Fields:</span>{" "}
                                                    {paper.fields_of_study || "Not provided"}
                                                </p>

                                                <p>
                                                    <span className="text-slate-500">DOI:</span>{" "}
                                                    {paper.doi || "Not provided"}
                                                </p>
                                            </div>

                                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSavePaper(paper)}
                                                    disabled={
                                                        savingPaperId === paper.source_id || alreadySaved
                                                    }
                                                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {alreadySaved
                                                        ? "Already Saved"
                                                        : savingPaperId === paper.source_id
                                                            ? "Saving..."
                                                            : "Save Paper"}
                                                </button>

                                                {paper.url && (
                                                    <a
                                                        href={paper.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-xl border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                                    >
                                                        Open Paper
                                                    </a>
                                                )}

                                                {paper.doi && (
                                                    <a
                                                        href={`https://doi.org/${paper.doi}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-xl border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                                    >
                                                        Open DOI
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Saved Papers</h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    Papers stored in Supabase for future review and proposal
                                    support.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={loadSavedPapers}
                                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="mb-5 grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-medium text-slate-400">
                                    Filter
                                </label>
                                <select
                                    value={paperFilter}
                                    onChange={(event) =>
                                        setPaperFilter(event.target.value as PaperFilter)
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition focus:border-slate-400"
                                >
                                    <option value="all">All</option>
                                    <option value="new_by_radar">New by Radar</option>
                                    <option value="saved">Saved</option>
                                    <option value="reading">Reading</option>
                                    <option value="cite">Cite</option>
                                    <option value="use_in_proposal">Use in Proposal</option>
                                    <option value="ignored">Ignored</option>
                                    <option value="must_read">Must Read, rating 5</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-400">
                                    Sort by
                                </label>
                                <select
                                    value={paperSort}
                                    onChange={(event) =>
                                        setPaperSort(event.target.value as PaperSort)
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition focus:border-slate-400"
                                >
                                    <option value="newest">Newest saved</option>
                                    <option value="ai_relevance">AI relevance score</option>
                                    <option value="proposal_usefulness">
                                        Proposal usefulness score
                                    </option>
                                    <option value="manual_rating">Manual rating</option>
                                    <option value="citation_count">Citation count</option>
                                    <option value="year">Year</option>
                                </select>
                            </div>
                        </div>

                        <p className="mb-4 text-xs text-slate-500">
                            Showing {filteredAndSortedPapers.length} of {savedPapers.length}{" "}
                            saved papers. Filter: {getFilterLabel(paperFilter)}. Sort:{" "}
                            {getSortLabel(paperSort)}.
                        </p>

                        {savedPapers.length === 0 && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                                No saved papers yet.
                            </div>
                        )}

                        {savedPapers.length > 0 && filteredAndSortedPapers.length === 0 && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                                No papers match this filter.
                            </div>
                        )}

                        {filteredAndSortedPapers.length > 0 && (
                            <div className="space-y-4">
                                {filteredAndSortedPapers.map((paper) => (
                                    <div
                                        key={paper.id}
                                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    {getSourceLabel(paper.source)} •{" "}
                                                    {paper.year || "Year unknown"}{" "}
                                                    {paper.venue ? `• ${paper.venue}` : ""}
                                                </p>

                                                <h3 className="mt-2 text-sm font-semibold">
                                                    {paper.title}
                                                </h3>
                                            </div>

                                            <div className="flex flex-col gap-2 sm:items-end">
                                                <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                    {getPaperStatusLabel(paper.paper_status)}
                                                </span>

                                                <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                    {getCategoryLabel(paper.paper_category)}
                                                </span>

                                                <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                    {getExportStatusLabel(paper.export_status)}
                                                </span>

                                                {paper.added_by_agent && (
                                                    <span className="w-fit rounded-full border border-emerald-900 px-3 py-1 text-xs text-emerald-200">
                                                        Added by radar
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="mt-2 text-xs text-slate-400">
                                            {paper.authors || "Authors not provided"}
                                        </p>

                                        {paper.relevance_reason && (
                                            <p className="mt-3 text-xs leading-5 text-slate-300">
                                                {paper.relevance_reason}
                                            </p>
                                        )}

                                        <div className="mt-4 grid gap-3 text-xs text-slate-400 md:grid-cols-2">
                                            <p>
                                                <span className="text-slate-500">AI relevance:</span>{" "}
                                                {getScoreDisplay(paper.ai_relevance_score)}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Novelty:</span>{" "}
                                                {getScoreDisplay(paper.novelty_score)}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">
                                                    Proposal usefulness:
                                                </span>{" "}
                                                {getScoreDisplay(paper.proposal_usefulness_score)}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">
                                                    Citation context:
                                                </span>{" "}
                                                {getScoreDisplay(paper.citation_context_score)}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Citations:</span>{" "}
                                                {paper.citation_count ?? 0}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Discovery:</span>{" "}
                                                {paper.discovery_status || "saved"}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Topic:</span>{" "}
                                                {paper.discovered_for_topic ||
                                                    paper.topic_tags ||
                                                    "Not tagged"}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Your rating:</span>{" "}
                                                {getManualRatingDisplay(paper.manual_rating)}
                                            </p>

                                            {paper.citation_key && (
                                                <p>
                                                    <span className="text-slate-500">Citation key:</span>{" "}
                                                    {paper.citation_key}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-4">
                                            <label className="text-xs font-medium text-slate-400">
                                                Manual rating
                                            </label>
                                            <select
                                                value={paper.manual_rating || "none"}
                                                onChange={(event) =>
                                                    handleUpdateManualRating(paper.id, event.target.value)
                                                }
                                                disabled={updatingRatingId === paper.id}
                                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <option value="none">Not rated</option>
                                                <option value="1">1, low relevance</option>
                                                <option value="2">2, weak</option>
                                                <option value="3">3, useful</option>
                                                <option value="4">4, strong</option>
                                                <option value="5">5, must read</option>
                                            </select>
                                        </div>

                                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                            <a
                                                href={`/literature/${paper.id}`}
                                                className="rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
                                            >
                                                Open Detail
                                            </a>

                                            {paper.url && (
                                                <a
                                                    href={paper.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg border border-slate-700 px-3 py-2 text-center text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                                                >
                                                    Open
                                                </a>
                                            )}

                                            {paper.doi && (
                                                <a
                                                    href={`https://doi.org/${paper.doi}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg border border-slate-700 px-3 py-2 text-center text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                                                >
                                                    DOI
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}