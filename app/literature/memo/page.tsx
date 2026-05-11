"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";

type MemoResponse = {
    ok: boolean;
    days: number;
    generated_at: string;
    memo: {
        headline: string;
        counts: {
            papers_found_in_window: number;
            new_radar_papers: number;
            top_relevance_available: number;
            top_proposal_available: number;
        };
        latest_run: any;
        new_papers: string[];
        top_by_relevance: string[];
        top_by_proposal_usefulness: string[];
        top_by_manual_rating: string[];
        top_by_citations: string[];
        recommended_action: string;
    };
    papers: any[];
};

export default function LiteratureMemoPage() {
    const [days, setDays] = useState("1");
    const [memoData, setMemoData] = useState<MemoResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        loadMemo();
    }, []);

    async function loadMemo() {
        setLoading(true);
        setMessage("");
        setErrorMessage("");

        try {
            const response = await fetch(`/api/literature/radar/memo?days=${days}`, {
                method: "GET",
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                setErrorMessage(payload.error || "Failed to load literature memo.");
                setLoading(false);
                return;
            }

            setMemoData(payload);
            setMessage("Literature memo loaded.");
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Unknown memo loading error."
            );
        }

        setLoading(false);
    }

    function renderList(items: string[], emptyText: string) {
        if (!items || items.length === 0) {
            return <p className="text-sm text-slate-400">{emptyText}</p>;
        }

        return (
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div
                        key={`${item}-${index}`}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300"
                    >
                        {item}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Literature Radar Daily Memo"
                    description="Review newly added papers, top-ranked papers, and recommended reading priorities from Literature Radar."
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
                    <div className="grid gap-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Memo window
                            </label>
                            <select
                                value={days}
                                onChange={(event) => setDays(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            >
                                <option value="1">Last 1 day</option>
                                <option value="3">Last 3 days</option>
                                <option value="7">Last 7 days</option>
                                <option value="14">Last 14 days</option>
                                <option value="30">Last 30 days</option>
                            </select>
                        </div>

                        <p className="text-sm text-slate-400">
                            Generate a memo from papers saved or discovered in the selected
                            window.
                        </p>

                        <button
                            type="button"
                            onClick={loadMemo}
                            disabled={loading}
                            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Loading..." : "Refresh Memo"}
                        </button>
                    </div>
                </div>

                {!memoData && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
                        No memo loaded yet.
                    </div>
                )}

                {memoData && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                            <h2 className="text-2xl font-bold">{memoData.memo.headline}</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Generated at {new Date(memoData.generated_at).toLocaleString()}
                            </p>

                            <div className="mt-6 grid gap-4 md:grid-cols-4">
                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-sm text-slate-400">Papers in window</p>
                                    <p className="mt-2 text-3xl font-bold">
                                        {memoData.memo.counts.papers_found_in_window}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-sm text-slate-400">New by radar</p>
                                    <p className="mt-2 text-3xl font-bold">
                                        {memoData.memo.counts.new_radar_papers}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-sm text-slate-400">Top relevance</p>
                                    <p className="mt-2 text-3xl font-bold">
                                        {memoData.memo.counts.top_relevance_available}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-sm text-slate-400">Top proposal</p>
                                    <p className="mt-2 text-3xl font-bold">
                                        {memoData.memo.counts.top_proposal_available}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                            <h2 className="text-xl font-semibold">Recommended Action</h2>
                            <p className="mt-4 text-sm leading-6 text-slate-300">
                                {memoData.memo.recommended_action}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                            <h2 className="text-xl font-semibold">New Papers Added by Radar</h2>
                            <div className="mt-5">
                                {renderList(
                                    memoData.memo.new_papers,
                                    "No new radar-added papers in this window."
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h2 className="text-xl font-semibold">Top by AI Relevance</h2>
                                <div className="mt-5">
                                    {renderList(
                                        memoData.memo.top_by_relevance,
                                        "No relevance-scored papers available."
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h2 className="text-xl font-semibold">
                                    Top by Proposal Usefulness
                                </h2>
                                <div className="mt-5">
                                    {renderList(
                                        memoData.memo.top_by_proposal_usefulness,
                                        "No proposal-usefulness-scored papers available."
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h2 className="text-xl font-semibold">Top by Manual Rating</h2>
                                <div className="mt-5">
                                    {renderList(
                                        memoData.memo.top_by_manual_rating,
                                        "No manually rated papers available."
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h2 className="text-xl font-semibold">Top by Citations</h2>
                                <div className="mt-5">
                                    {renderList(
                                        memoData.memo.top_by_citations,
                                        "No citation-ranked papers available."
                                    )}
                                </div>
                            </div>
                        </div>

                        {memoData.memo.latest_run && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h2 className="text-xl font-semibold">Latest Radar Run</h2>
                                <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-300">
                                    {memoData.memo.latest_run.run_summary ||
                                        JSON.stringify(memoData.memo.latest_run, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}