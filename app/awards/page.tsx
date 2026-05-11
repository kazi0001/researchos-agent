"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

type AwardSort = "relevance" | "year" | "amount" | "newest";
type AwardFilter = "all" | "high_relevance" | "recent" | "nsf";

type FundedAward = {
    id: string;
    source: string;
    source_award_id: string | null;
    award_number: string | null;
    title: string;
    agency: string | null;
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
    doi: string | null;
    relevance_score: number | null;
    relevance_reason: string | null;
    strategic_lesson: string | null;
    raw_json: any;
    created_at: string | null;
    updated_at: string | null;
};

type AwardSearchResult = {
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
    relevance_score: number | null;
    relevance_reason: string | null;
    strategic_lesson: string | null;
};

export default function AwardsPage() {
    const [query, setQuery] = useState(
        "physics-informed machine learning chemical engineering"
    );
    const [rows, setRows] = useState("10");
    const [offset, setOffset] = useState("0");
    const [saveToDatabase, setSaveToDatabase] = useState(true);

    const [searching, setSearching] = useState(false);
    const [loadingSavedAwards, setLoadingSavedAwards] = useState(true);

    const [searchResults, setSearchResults] = useState<AwardSearchResult[]>([]);
    const [savedAwards, setSavedAwards] = useState<FundedAward[]>([]);

    const [awardSort, setAwardSort] = useState<AwardSort>("relevance");
    const [awardFilter, setAwardFilter] = useState<AwardFilter>("all");

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        loadSavedAwards();
    }, []);

    const filteredAndSortedAwards = useMemo(() => {
        let filtered = [...savedAwards];

        if (awardFilter === "high_relevance") {
            filtered = filtered.filter((award) => (award.relevance_score || 0) >= 80);
        } else if (awardFilter === "recent") {
            const currentYear = new Date().getFullYear();
            filtered = filtered.filter(
                (award) => (award.award_year || 0) >= currentYear - 5
            );
        } else if (awardFilter === "nsf") {
            filtered = filtered.filter((award) => award.source === "nsf");
        }

        filtered.sort((a, b) => {
            if (awardSort === "year") {
                return (b.award_year || 0) - (a.award_year || 0);
            }

            if (awardSort === "amount") {
                return (b.amount || 0) - (a.amount || 0);
            }

            if (awardSort === "newest") {
                const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
                const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
                return bDate - aDate;
            }

            return (b.relevance_score || 0) - (a.relevance_score || 0);
        });

        return filtered;
    }, [savedAwards, awardSort, awardFilter]);

    async function loadSavedAwards() {
        setLoadingSavedAwards(true);
        setErrorMessage("");

        const { data, error } = await supabase
            .from("funded_awards")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading saved awards:", error);
            setErrorMessage(error.message);
            setLoadingSavedAwards(false);
            return;
        }

        setSavedAwards(data || []);
        setLoadingSavedAwards(false);
    }

    async function handleSearchNsfAwards() {
        setSearching(true);
        setMessage("");
        setErrorMessage("");
        setSearchResults([]);

        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setErrorMessage("Please enter an NSF award search query.");
            setSearching(false);
            return;
        }

        const parsedRows = Number(rows);
        const parsedOffset = Number(offset);

        if (Number.isNaN(parsedRows) || parsedRows < 1) {
            setErrorMessage("Rows must be a positive number.");
            setSearching(false);
            return;
        }

        try {
            const response = await fetch("/api/awards/nsf/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: trimmedQuery,
                    rows: Math.min(parsedRows, 50),
                    offset: Number.isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0),
                    saveToDatabase,
                }),
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                console.error("NSF award search error:", payload);
                setErrorMessage(
                    payload.error || "NSF award search failed. Please try again."
                );
                setSearching(false);
                return;
            }

            setSearchResults(payload.awards || []);
            setMessage(
                `NSF search completed. Found ${payload.awards_found || 0} awards, added ${payload.new_awards_added || 0
                } new awards, duplicates ${payload.duplicate_awards_seen || 0}.`
            );

            if (saveToDatabase) {
                await loadSavedAwards();
            }
        } catch (error) {
            console.error("NSF award search UI error:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unknown NSF award search error."
            );
        }

        setSearching(false);
    }

    function formatAmount(award: FundedAward | AwardSearchResult) {
        if (award.amount_text) return award.amount_text;

        if (award.amount) {
            return `$${Number(award.amount).toLocaleString()}`;
        }

        return "Amount not provided";
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return "Not provided";

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString();
    }

    function getRelevanceLabel(score: number | null) {
        if (!score) return "Not scored";
        if (score >= 80) return "High relevance";
        if (score >= 60) return "Medium relevance";
        return "Low relevance";
    }

    function getRelevanceTone(score: number | null) {
        if (!score) return "border-slate-700 text-slate-300";
        if (score >= 80) return "border-emerald-900 text-emerald-200";
        if (score >= 60) return "border-yellow-900 text-yellow-200";
        return "border-red-900 text-red-200";
    }

    function getAwardCounts() {
        const highRelevance = savedAwards.filter(
            (award) => (award.relevance_score || 0) >= 80
        ).length;

        const currentYear = new Date().getFullYear();

        const recent = savedAwards.filter(
            (award) => (award.award_year || 0) >= currentYear - 5
        ).length;

        const nsf = savedAwards.filter((award) => award.source === "nsf").length;

        return {
            total: savedAwards.length,
            highRelevance,
            recent,
            nsf,
        };
    }

    const awardCounts = getAwardCounts();

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Award Intelligence"
                    description="Search prior funded awards, review successful project language, identify funded PIs and institutions, and extract strategic lessons for proposal development."
                    activePage="awards"
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

                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Saved Awards</p>
                        <p className="mt-2 text-3xl font-bold">{awardCounts.total}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">High Relevance</p>
                        <p className="mt-2 text-3xl font-bold">
                            {awardCounts.highRelevance}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Recent Awards</p>
                        <p className="mt-2 text-3xl font-bold">{awardCounts.recent}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">NSF Awards</p>
                        <p className="mt-2 text-3xl font-bold">{awardCounts.nsf}</p>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-xl font-semibold">Search NSF Awards</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Search prior NSF-funded projects by topic, PI, institution, program,
                        or keyword. Results can be saved to your award intelligence library.
                    </p>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_120px_120px_180px] lg:items-end">
                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Search query
                            </label>
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="physics-informed machine learning chemical engineering"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Rows
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={rows}
                                onChange={(event) => setRows(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Offset
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={offset}
                                onChange={(event) => setOffset(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Save results
                            </label>
                            <select
                                value={saveToDatabase ? "yes" : "no"}
                                onChange={(event) =>
                                    setSaveToDatabase(event.target.value === "yes")
                                }
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            >
                                <option value="yes">Yes, save</option>
                                <option value="no">No, preview only</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSearchNsfAwards}
                        disabled={searching}
                        className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {searching ? "Searching NSF..." : "Search NSF Awards"}
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <h2 className="text-xl font-semibold">Latest Search Results</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Preview awards returned from the most recent NSF search.
                        </p>

                        {searchResults.length === 0 && (
                            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                                No search results yet.
                            </div>
                        )}

                        {searchResults.length > 0 && (
                            <div className="mt-6 space-y-4">
                                {searchResults.map((award) => (
                                    <div
                                        key={`${award.source}-${award.source_award_id}`}
                                        className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-sm text-slate-500">
                                                    NSF Award {award.award_number || "unknown"}
                                                </p>

                                                <h3 className="mt-2 font-semibold">{award.title}</h3>

                                                <p className="mt-2 text-sm text-slate-400">
                                                    {award.pi_name || "PI not provided"}
                                                    {award.institution ? ` • ${award.institution}` : ""}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-2 sm:items-end">
                                                <span
                                                    className={`w-fit rounded-full border px-3 py-1 text-xs ${getRelevanceTone(
                                                        award.relevance_score
                                                    )}`}
                                                >
                                                    {award.relevance_score ?? 0}/100
                                                </span>

                                                <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                    {award.award_year || "Year unknown"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                                            <p>
                                                <span className="text-slate-500">Program:</span>{" "}
                                                {award.program || "Not provided"}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Amount:</span>{" "}
                                                {formatAmount(award)}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Start:</span>{" "}
                                                {formatDate(award.start_date)}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">End:</span>{" "}
                                                {formatDate(award.end_date)}
                                            </p>
                                        </div>

                                        {award.relevance_reason && (
                                            <p className="mt-4 text-sm leading-6 text-slate-300">
                                                <span className="font-semibold text-slate-100">
                                                    Relevance:
                                                </span>{" "}
                                                {award.relevance_reason}
                                            </p>
                                        )}

                                        {award.strategic_lesson && (
                                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                                <span className="font-semibold text-slate-100">
                                                    Strategic lesson:
                                                </span>{" "}
                                                {award.strategic_lesson}
                                            </p>
                                        )}

                                        {award.url && (
                                            <a
                                                href={award.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-5 inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                            >
                                                Open NSF Award
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Saved Awards</h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    Awards saved in your intelligence library.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={loadSavedAwards}
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
                                    value={awardFilter}
                                    onChange={(event) =>
                                        setAwardFilter(event.target.value as AwardFilter)
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition focus:border-slate-400"
                                >
                                    <option value="all">All</option>
                                    <option value="high_relevance">High relevance</option>
                                    <option value="recent">Recent, last 5 years</option>
                                    <option value="nsf">NSF only</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-400">
                                    Sort by
                                </label>
                                <select
                                    value={awardSort}
                                    onChange={(event) =>
                                        setAwardSort(event.target.value as AwardSort)
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition focus:border-slate-400"
                                >
                                    <option value="relevance">Relevance</option>
                                    <option value="year">Award year</option>
                                    <option value="amount">Amount</option>
                                    <option value="newest">Newest saved</option>
                                </select>
                            </div>
                        </div>

                        <p className="mb-4 text-xs text-slate-500">
                            Showing {filteredAndSortedAwards.length} of {savedAwards.length}{" "}
                            saved awards.
                        </p>

                        {loadingSavedAwards && (
                            <p className="text-sm text-slate-400">Loading saved awards...</p>
                        )}

                        {!loadingSavedAwards && savedAwards.length === 0 && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                                No saved awards yet.
                            </div>
                        )}

                        {!loadingSavedAwards && filteredAndSortedAwards.length > 0 && (
                            <div className="space-y-4">
                                {filteredAndSortedAwards.map((award) => (
                                    <div
                                        key={award.id}
                                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    {award.agency || award.source} •{" "}
                                                    {award.award_year || "Year unknown"}
                                                </p>

                                                <h3 className="mt-2 text-sm font-semibold">
                                                    {award.title}
                                                </h3>
                                            </div>

                                            <span
                                                className={`w-fit rounded-full border px-3 py-1 text-xs ${getRelevanceTone(
                                                    award.relevance_score
                                                )}`}
                                            >
                                                {award.relevance_score ?? 0}/100
                                            </span>
                                        </div>

                                        <p className="mt-2 text-xs text-slate-400">
                                            {award.pi_name || "PI not provided"}
                                            {award.institution ? ` • ${award.institution}` : ""}
                                        </p>

                                        <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
                                            <p>
                                                <span className="text-slate-500">Program:</span>{" "}
                                                {award.program || "Not provided"}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Amount:</span>{" "}
                                                {formatAmount(award)}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Award #:</span>{" "}
                                                {award.award_number || "Not provided"}
                                            </p>

                                            <p>
                                                <span className="text-slate-500">Relevance:</span>{" "}
                                                {getRelevanceLabel(award.relevance_score)}
                                            </p>
                                        </div>

                                        {award.strategic_lesson && (
                                            <p className="mt-3 text-xs leading-5 text-slate-300">
                                                {award.strategic_lesson}
                                            </p>
                                        )}

                                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                            {award.url && (
                                                <a
                                                    href={award.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
                                                >
                                                    Open Award
                                                </a>
                                            )}

                                            {award.abstract && (
                                                <a
                                                    href={`/awards#award-${award.id}`}
                                                    className="rounded-lg border border-slate-700 px-3 py-2 text-center text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                                                >
                                                    Review
                                                </a>
                                            )}
                                        </div>

                                        {award.abstract && (
                                            <details
                                                id={`award-${award.id}`}
                                                className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-3"
                                            >
                                                <summary className="cursor-pointer text-xs font-semibold text-slate-300">
                                                    Abstract
                                                </summary>
                                                <p className="mt-3 max-h-48 overflow-y-auto text-xs leading-5 text-slate-400">
                                                    {award.abstract}
                                                </p>
                                            </details>
                                        )}
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