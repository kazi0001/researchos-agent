"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

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
    created_at: string | null;
    updated_at: string | null;
};

type RadarRun = {
    id: string;
    run_type: string | null;
    status: string | null;
    started_at: string | null;
    finished_at: string | null;
    topics_searched: number | null;
    papers_found: number | null;
    new_papers_added: number | null;
    duplicate_papers_seen: number | null;
    error_message: string | null;
    run_summary: string | null;
    created_at: string | null;
};

type PreferredSource = "auto" | "semantic_scholar" | "crossref";
type SearchFrequency = "daily" | "weekly" | "manual";

export default function LiteratureTopicsPage() {
    const [topics, setTopics] = useState<ResearchTopic[]>([]);
    const [latestRun, setLatestRun] = useState<RadarRun | null>(null);

    const [loading, setLoading] = useState(true);
    const [runningRadar, setRunningRadar] = useState(false);

    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [savingTopicId, setSavingTopicId] = useState<string | null>(null);
    const [updatingActiveId, setUpdatingActiveId] = useState<string | null>(null);

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [topicName, setTopicName] = useState("");
    const [keywords, setKeywords] = useState("");
    const [description, setDescription] = useState("");
    const [preferredSource, setPreferredSource] =
        useState<PreferredSource>("auto");
    const [searchFrequency, setSearchFrequency] =
        useState<SearchFrequency>("daily");

    const [editTopicName, setEditTopicName] = useState("");
    const [editKeywords, setEditKeywords] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editPreferredSource, setEditPreferredSource] =
        useState<PreferredSource>("auto");
    const [editSearchFrequency, setEditSearchFrequency] =
        useState<SearchFrequency>("daily");

    const [limitPerTopic, setLimitPerTopic] = useState("2");

    useEffect(() => {
        loadPageData();
    }, []);

    async function loadPageData() {
        setLoading(true);
        setMessage("");
        setErrorMessage("");

        await Promise.all([loadTopics(), loadLatestRun()]);

        setLoading(false);
    }

    async function loadTopics() {
        const { data, error } = await supabase
            .from("research_topics")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error loading research topics:", error);
            setErrorMessage(error.message);
            return;
        }

        setTopics(data || []);
    }

    async function loadLatestRun() {
        const { data, error } = await supabase
            .from("literature_radar_runs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Error loading latest radar run:", error);
            setErrorMessage(error.message);
            return;
        }

        setLatestRun(data || null);
    }

    async function handleRunLiteratureRadar() {
        setRunningRadar(true);
        setMessage("");
        setErrorMessage("");

        const parsedLimit = Number(limitPerTopic);

        if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
            setErrorMessage("Limit per topic must be a positive number.");
            setRunningRadar(false);
            return;
        }

        try {
            const response = await fetch("/api/literature/radar/run", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    runType: "manual",
                    limitPerTopic: Math.min(parsedLimit, 10),
                }),
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                console.error("Literature Radar run failed:", payload);
                setErrorMessage(
                    payload.error || "Literature Radar run failed. Please try again."
                );
                setRunningRadar(false);
                return;
            }

            setMessage(
                `Literature Radar completed. Topics searched: ${payload.topics_searched || 0
                }, papers found: ${payload.papers_found || 0}, new papers added: ${payload.new_papers_added || 0
                }, duplicates: ${payload.duplicate_papers_seen || 0}.`
            );

            await loadPageData();
        } catch (error) {
            console.error("Literature Radar UI run error:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unknown Literature Radar run error."
            );
        }

        setRunningRadar(false);
    }

    async function handleAddTopic() {
        setMessage("");
        setErrorMessage("");

        if (!topicName.trim()) {
            setErrorMessage("Topic name is required.");
            return;
        }

        if (!keywords.trim()) {
            setErrorMessage("Keywords are required.");
            return;
        }

        const { error } = await supabase.from("research_topics").insert([
            {
                topic_name: topicName.trim(),
                keywords: keywords.trim(),
                description: description.trim() || null,
                preferred_source: preferredSource,
                search_frequency: searchFrequency,
                is_active: true,
            },
        ]);

        if (error) {
            console.error("Error adding research topic:", error);
            setErrorMessage(error.message);
            return;
        }

        setMessage("Research topic added successfully.");
        setTopicName("");
        setKeywords("");
        setDescription("");
        setPreferredSource("auto");
        setSearchFrequency("daily");

        await loadTopics();
    }

    function startEditing(topic: ResearchTopic) {
        setEditingTopicId(topic.id);
        setEditTopicName(topic.topic_name || "");
        setEditKeywords(topic.keywords || "");
        setEditDescription(topic.description || "");
        setEditPreferredSource(
            (topic.preferred_source || "auto") as PreferredSource
        );
        setEditSearchFrequency(
            (topic.search_frequency || "daily") as SearchFrequency
        );
    }

    function cancelEditing() {
        setEditingTopicId(null);
        setEditTopicName("");
        setEditKeywords("");
        setEditDescription("");
        setEditPreferredSource("auto");
        setEditSearchFrequency("daily");
    }

    async function handleSaveEdit(topicId: string) {
        setSavingTopicId(topicId);
        setMessage("");
        setErrorMessage("");

        if (!editTopicName.trim()) {
            setErrorMessage("Topic name is required.");
            setSavingTopicId(null);
            return;
        }

        if (!editKeywords.trim()) {
            setErrorMessage("Keywords are required.");
            setSavingTopicId(null);
            return;
        }

        const { error } = await supabase
            .from("research_topics")
            .update({
                topic_name: editTopicName.trim(),
                keywords: editKeywords.trim(),
                description: editDescription.trim() || null,
                preferred_source: editPreferredSource,
                search_frequency: editSearchFrequency,
                updated_at: new Date().toISOString(),
            })
            .eq("id", topicId);

        if (error) {
            console.error("Error updating research topic:", error);
            setErrorMessage(error.message);
            setSavingTopicId(null);
            return;
        }

        setMessage("Research topic updated successfully.");
        setSavingTopicId(null);
        cancelEditing();
        await loadTopics();
    }

    async function handleToggleActive(topic: ResearchTopic) {
        setUpdatingActiveId(topic.id);
        setMessage("");
        setErrorMessage("");

        const newActiveStatus = !topic.is_active;

        const { error } = await supabase
            .from("research_topics")
            .update({
                is_active: newActiveStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", topic.id);

        if (error) {
            console.error("Error updating topic active status:", error);
            setErrorMessage(error.message);
            setUpdatingActiveId(null);
            return;
        }

        setTopics((currentTopics) =>
            currentTopics.map((item) =>
                item.id === topic.id ? { ...item, is_active: newActiveStatus } : item
            )
        );

        setMessage(
            newActiveStatus
                ? "Research topic activated."
                : "Research topic deactivated."
        );
        setUpdatingActiveId(null);
    }

    function formatDateTime(dateString: string | null) {
        if (!dateString) {
            return "Not available";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleString();
    }

    function getSourceLabel(source: string | null) {
        if (source === "semantic_scholar") return "Semantic Scholar";
        if (source === "crossref") return "Crossref";
        return "Auto";
    }

    function getFrequencyLabel(frequency: string | null) {
        if (frequency === "weekly") return "Weekly";
        if (frequency === "manual") return "Manual";
        return "Daily";
    }

    const activeCount = topics.filter((topic) => topic.is_active).length;
    const inactiveCount = topics.length - activeCount;

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Literature Radar Topics"
                    description="Define key research topics for automated paper discovery, daily literature radar, and topic-based paper scoring."
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

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Total Topics</p>
                        <p className="mt-2 text-3xl font-bold">{topics.length}</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Research radar topics
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Active</p>
                        <p className="mt-2 text-3xl font-bold">{activeCount}</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Included in radar runs
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Inactive</p>
                        <p className="mt-2 text-3xl font-bold">{inactiveCount}</p>
                        <p className="mt-2 text-sm text-slate-500">Paused topics</p>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Run Literature Radar</h2>
                            <p className="mt-2 max-w-3xl text-sm text-slate-400">
                                Manually run the Literature Radar across active topics. It will
                                search papers, avoid duplicates, save new papers, score them,
                                connect them to topics, and log the run.
                            </p>

                            <div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-end">
                                <div>
                                    <label className="text-sm font-medium text-slate-300">
                                        Limit per topic
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={limitPerTopic}
                                        onChange={(event) => setLimitPerTopic(event.target.value)}
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRunLiteratureRadar}
                                    disabled={runningRadar || activeCount === 0}
                                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {runningRadar ? "Running Radar..." : "Run Literature Radar"}
                                </button>
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                For testing, use 1 or 2 papers per topic to stay within API rate
                                limits.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 lg:min-w-[280px]">
                            <p className="text-sm font-semibold text-slate-300">
                                Latest Radar Run
                            </p>

                            {!latestRun && (
                                <p className="mt-3 text-sm text-slate-500">
                                    No radar run recorded yet.
                                </p>
                            )}

                            {latestRun && (
                                <div className="mt-3 space-y-2 text-sm text-slate-400">
                                    <p>
                                        <span className="text-slate-500">Status:</span>{" "}
                                        {latestRun.status || "unknown"}
                                    </p>
                                    <p>
                                        <span className="text-slate-500">Started:</span>{" "}
                                        {formatDateTime(latestRun.started_at)}
                                    </p>
                                    <p>
                                        <span className="text-slate-500">Topics:</span>{" "}
                                        {latestRun.topics_searched ?? 0}
                                    </p>
                                    <p>
                                        <span className="text-slate-500">Found:</span>{" "}
                                        {latestRun.papers_found ?? 0}
                                    </p>
                                    <p>
                                        <span className="text-slate-500">Added:</span>{" "}
                                        {latestRun.new_papers_added ?? 0}
                                    </p>
                                    <p>
                                        <span className="text-slate-500">Duplicates:</span>{" "}
                                        {latestRun.duplicate_papers_seen ?? 0}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {latestRun?.run_summary && (
                        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <p className="text-sm font-semibold text-slate-300">
                                Latest Run Summary
                            </p>
                            <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-400">
                                {latestRun.run_summary}
                            </pre>
                        </div>
                    )}

                    {latestRun?.error_message && (
                        <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4">
                            <p className="text-sm font-semibold text-red-200">
                                Latest Run Error
                            </p>
                            <p className="mt-3 text-sm text-red-200">
                                {latestRun.error_message}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-xl font-semibold">Add Research Topic</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Add a recurring paper search topic. These topics will later be used
                        by the automated Literature Radar agent.
                    </p>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Topic name
                            </label>
                            <input
                                type="text"
                                value={topicName}
                                onChange={(event) => setTopicName(event.target.value)}
                                placeholder="Agentic AI for process systems engineering"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-slate-300">
                                    Preferred source
                                </label>
                                <select
                                    value={preferredSource}
                                    onChange={(event) =>
                                        setPreferredSource(event.target.value as PreferredSource)
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="semantic_scholar">Semantic Scholar</option>
                                    <option value="crossref">Crossref</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300">
                                    Search frequency
                                </label>
                                <select
                                    value={searchFrequency}
                                    onChange={(event) =>
                                        setSearchFrequency(event.target.value as SearchFrequency)
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <label className="text-sm font-medium text-slate-300">
                            Keywords
                        </label>
                        <textarea
                            rows={3}
                            value={keywords}
                            onChange={(event) => setKeywords(event.target.value)}
                            placeholder="agentic AI process systems engineering chemical engineering autonomous agents LLM decision support"
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                        />
                    </div>

                    <div className="mt-5">
                        <label className="text-sm font-medium text-slate-300">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Briefly describe why this topic matters to your research portfolio."
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleAddTopic}
                        className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    >
                        Add Topic
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Research Topics</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Manage active and inactive radar topics.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <a
                                href="/literature"
                                className="rounded-xl border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                            >
                                Back to Literature Scout
                            </a>

                            <button
                                type="button"
                                onClick={loadPageData}
                                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <p className="text-sm text-slate-400">Loading topics...</p>
                    )}

                    {!loading && topics.length === 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                            No research topics found yet.
                        </div>
                    )}

                    {!loading && topics.length > 0 && (
                        <div className="space-y-4">
                            {topics.map((topic) => {
                                const isEditing = editingTopicId === topic.id;

                                return (
                                    <div
                                        key={topic.id}
                                        className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                                    >
                                        {!isEditing && (
                                            <>
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <span
                                                                className={`w-fit rounded-full border px-3 py-1 text-xs ${topic.is_active
                                                                        ? "border-emerald-900 text-emerald-200"
                                                                        : "border-slate-700 text-slate-400"
                                                                    }`}
                                                            >
                                                                {topic.is_active ? "Active" : "Inactive"}
                                                            </span>

                                                            <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                                {getSourceLabel(topic.preferred_source)}
                                                            </span>

                                                            <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                                {getFrequencyLabel(topic.search_frequency)}
                                                            </span>
                                                        </div>

                                                        <h3 className="mt-3 text-lg font-semibold">
                                                            {topic.topic_name}
                                                        </h3>

                                                        <p className="mt-3 text-sm leading-6 text-slate-300">
                                                            {topic.description ||
                                                                "No description provided."}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col gap-2 sm:items-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleActive(topic)}
                                                            disabled={updatingActiveId === topic.id}
                                                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {updatingActiveId === topic.id
                                                                ? "Updating..."
                                                                : topic.is_active
                                                                    ? "Deactivate"
                                                                    : "Activate"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => startEditing(topic)}
                                                            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
                                                    <p className="text-sm font-semibold text-slate-300">
                                                        Keywords
                                                    </p>
                                                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-400">
                                                        {topic.keywords}
                                                    </p>
                                                </div>

                                                <div className="mt-5 grid gap-3 text-sm text-slate-400 md:grid-cols-3">
                                                    <p>
                                                        <span className="text-slate-500">
                                                            Last searched:
                                                        </span>{" "}
                                                        {formatDateTime(topic.last_searched_at)}
                                                    </p>

                                                    <p>
                                                        <span className="text-slate-500">
                                                            Next search:
                                                        </span>{" "}
                                                        {formatDateTime(topic.next_search_at)}
                                                    </p>

                                                    <p>
                                                        <span className="text-slate-500">Created:</span>{" "}
                                                        {formatDateTime(topic.created_at)}
                                                    </p>
                                                </div>
                                            </>
                                        )}

                                        {isEditing && (
                                            <div>
                                                <h3 className="text-lg font-semibold">Edit Topic</h3>

                                                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-300">
                                                            Topic name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={editTopicName}
                                                            onChange={(event) =>
                                                                setEditTopicName(event.target.value)
                                                            }
                                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                                        />
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div>
                                                            <label className="text-sm font-medium text-slate-300">
                                                                Preferred source
                                                            </label>
                                                            <select
                                                                value={editPreferredSource}
                                                                onChange={(event) =>
                                                                    setEditPreferredSource(
                                                                        event.target.value as PreferredSource
                                                                    )
                                                                }
                                                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                                            >
                                                                <option value="auto">Auto</option>
                                                                <option value="semantic_scholar">
                                                                    Semantic Scholar
                                                                </option>
                                                                <option value="crossref">Crossref</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="text-sm font-medium text-slate-300">
                                                                Search frequency
                                                            </label>
                                                            <select
                                                                value={editSearchFrequency}
                                                                onChange={(event) =>
                                                                    setEditSearchFrequency(
                                                                        event.target.value as SearchFrequency
                                                                    )
                                                                }
                                                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                                            >
                                                                <option value="daily">Daily</option>
                                                                <option value="weekly">Weekly</option>
                                                                <option value="manual">Manual</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-5">
                                                    <label className="text-sm font-medium text-slate-300">
                                                        Keywords
                                                    </label>
                                                    <textarea
                                                        rows={4}
                                                        value={editKeywords}
                                                        onChange={(event) =>
                                                            setEditKeywords(event.target.value)
                                                        }
                                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                                    />
                                                </div>

                                                <div className="mt-5">
                                                    <label className="text-sm font-medium text-slate-300">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        rows={4}
                                                        value={editDescription}
                                                        onChange={(event) =>
                                                            setEditDescription(event.target.value)
                                                        }
                                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                                    />
                                                </div>

                                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEdit(topic.id)}
                                                        disabled={savingTopicId === topic.id}
                                                        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {savingTopicId === topic.id
                                                            ? "Saving..."
                                                            : "Save Changes"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={cancelEditing}
                                                        className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}