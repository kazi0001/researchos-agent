"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

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
    raw_json: any;
    created_at: string | null;
    updated_at: string | null;
};

type PaperStatus = "saved" | "reading" | "cite" | "use_in_proposal" | "ignored";

type PaperCategory =
    | "literature_review"
    | "methods"
    | "dataset_benchmark"
    | "proposal_support"
    | "background_reading"
    | "threat_paper"
    | "gap_paper"
    | "must_read"
    | "cite_later"
    | "ignore";

type ExportStatus =
    | "not_exported"
    | "ready_to_export"
    | "exported_bibtex"
    | "exported_ris"
    | "exported_csv"
    | "exported_to_zotero"
    | "exported_to_endnote";

export default function PaperDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [paper, setPaper] = useState<SavedPaper | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [paperStatus, setPaperStatus] = useState<PaperStatus>("saved");
    const [manualRating, setManualRating] = useState<string>("none");
    const [paperCategory, setPaperCategory] =
        useState<PaperCategory>("literature_review");
    const [citationKey, setCitationKey] = useState("");
    const [exportStatus, setExportStatus] =
        useState<ExportStatus>("not_exported");
    const [exportedTo, setExportedTo] = useState("");
    const [reviewNotes, setReviewNotes] = useState("");
    const [manuscriptUseNote, setManuscriptUseNote] = useState("");
    const [proposalUseNote, setProposalUseNote] = useState("");

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (id) {
            loadPaper();
        }
    }, [id]);

    async function loadPaper() {
        setLoading(true);
        setMessage("");
        setErrorMessage("");

        const { data, error } = await supabase
            .from("papers")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Error loading paper:", error);
            setErrorMessage(error.message);
            setLoading(false);
            return;
        }

        setPaper(data);
        setPaperStatus((data.paper_status || "saved") as PaperStatus);
        setManualRating(data.manual_rating ? String(data.manual_rating) : "none");
        setPaperCategory(
            (data.paper_category || "literature_review") as PaperCategory
        );
        setCitationKey(data.citation_key || buildSuggestedCitationKey(data));
        setExportStatus((data.export_status || "not_exported") as ExportStatus);
        setExportedTo(data.exported_to || "");
        setReviewNotes(data.review_notes || "");
        setManuscriptUseNote(data.manuscript_use_note || "");
        setProposalUseNote(data.proposal_use_note || "");

        setLoading(false);
    }

    async function handleSaveReview() {
        if (!paper) {
            return;
        }

        setSaving(true);
        setMessage("");
        setErrorMessage("");

        const parsedManualRating =
            manualRating === "none"
                ? null
                : Math.max(1, Math.min(5, Number(manualRating)));

        const shouldStampExportedAt =
            exportStatus !== "not_exported" && exportStatus !== "ready_to_export";

        const { error } = await supabase
            .from("papers")
            .update({
                paper_status: paperStatus,
                manual_rating: parsedManualRating,
                paper_category: paperCategory,
                citation_key: citationKey.trim() || null,
                export_status: exportStatus,
                exported_to: exportedTo.trim() || null,
                exported_at: shouldStampExportedAt
                    ? paper.exported_at || new Date().toISOString()
                    : null,
                review_notes: reviewNotes,
                manuscript_use_note: manuscriptUseNote,
                proposal_use_note: proposalUseNote,
                updated_at: new Date().toISOString(),
            })
            .eq("id", paper.id);

        if (error) {
            console.error("Error saving paper review:", error);
            setErrorMessage(error.message);
            setSaving(false);
            return;
        }

        setMessage("Paper review, category, and export fields saved successfully.");
        await loadPaper();
        setSaving(false);
    }

    function handleGenerateCitationKey() {
        if (!paper) return;
        setCitationKey(buildSuggestedCitationKey(paper));
    }

    function buildSuggestedCitationKey(inputPaper: Partial<SavedPaper>) {
        const firstAuthor = extractFirstAuthorLastName(inputPaper.authors);
        const year = inputPaper.year || "year";
        const titleWord = extractFirstMeaningfulTitleWord(inputPaper.title || "");

        return `${firstAuthor}${year}${titleWord}`.replace(/[^a-zA-Z0-9_]/g, "");
    }

    function extractFirstAuthorLastName(authors: string | null | undefined) {
        if (!authors) return "author";

        const firstAuthor = authors.split(",")[0]?.trim();

        if (!firstAuthor) return "author";

        const parts = firstAuthor.split(/\s+/);
        const last = parts[parts.length - 1];

        return capitalizeSafe(last || "author");
    }

    function extractFirstMeaningfulTitleWord(title: string) {
        const stopWords = new Set([
            "a",
            "an",
            "the",
            "and",
            "or",
            "for",
            "of",
            "in",
            "on",
            "to",
            "with",
            "using",
            "from",
            "by",
            "via",
            "toward",
            "towards",
        ]);

        const word =
            title
                .toLowerCase()
                .split(/[^a-zA-Z0-9]+/)
                .find((item) => item.length > 3 && !stopWords.has(item)) || "paper";

        return capitalizeSafe(word);
    }

    function capitalizeSafe(value: string) {
        if (!value) return value;
        return value.charAt(0).toUpperCase() + value.slice(1);
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
        if (status === "ready_to_export") return "Ready to Export";
        if (status === "exported_bibtex") return "Exported, BibTeX";
        if (status === "exported_ris") return "Exported, RIS";
        if (status === "exported_csv") return "Exported, CSV";
        if (status === "exported_to_zotero") return "Exported to Zotero";
        if (status === "exported_to_endnote") return "Exported to EndNote";
        return "Not Exported";
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return "Not available";

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString();
    }

    function formatDateTime(dateString: string | null) {
        if (!dateString) return "Not available";

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleString();
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

    function getScoreTone(score: number | null) {
        if (score === null || score === undefined) {
            return "border-slate-700 text-slate-300";
        }

        if (score >= 80) {
            return "border-emerald-900 text-emerald-200";
        }

        if (score >= 60) {
            return "border-yellow-900 text-yellow-200";
        }

        return "border-red-900 text-red-200";
    }

    function getRatingMeaning(rating: string) {
        if (rating === "5") return "Must read";
        if (rating === "4") return "Strong";
        if (rating === "3") return "Useful";
        if (rating === "2") return "Weak";
        if (rating === "1") return "Low relevance";
        return "Not rated";
    }

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Paper Detail"
                    description="Review a saved paper, inspect radar scores, add notes, assign category, prepare citation export, and decide how it may support a manuscript or proposal."
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

                {loading && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
                        Loading paper...
                    </div>
                )}

                {!loading && !paper && !errorMessage && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
                        No paper found.
                    </div>
                )}

                {!loading && paper && (
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm text-slate-400">
                                            {getSourceLabel(paper.source)} •{" "}
                                            {paper.year || "Year unknown"}
                                            {paper.venue ? ` • ${paper.venue}` : ""}
                                        </p>

                                        <h2 className="mt-2 text-2xl font-bold">{paper.title}</h2>

                                        <p className="mt-3 text-sm leading-6 text-slate-300">
                                            {paper.authors || "Authors not provided"}
                                        </p>
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

                                        <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                            Rating: {getManualRatingDisplay(paper.manual_rating)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
                                    <p>
                                        <span className="text-slate-500">Source ID:</span>{" "}
                                        {paper.source_id || "Not provided"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Publication date:</span>{" "}
                                        {formatDate(paper.publication_date)}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">DOI:</span>{" "}
                                        {paper.doi || "Not provided"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Citation key:</span>{" "}
                                        {paper.citation_key || citationKey || "Not provided"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Fields:</span>{" "}
                                        {paper.fields_of_study || "Not provided"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Citations:</span>{" "}
                                        {paper.citation_count ?? 0}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Influential citations:</span>{" "}
                                        {paper.influential_citation_count ?? 0}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">References:</span>{" "}
                                        {paper.reference_count ?? 0}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Discovered for:</span>{" "}
                                        {paper.discovered_for_topic ||
                                            paper.topic_tags ||
                                            "Not recorded"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Discovery status:</span>{" "}
                                        {paper.discovery_status || "saved"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Exported to:</span>{" "}
                                        {paper.exported_to || "Not exported"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Exported at:</span>{" "}
                                        {formatDateTime(paper.exported_at)}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">First seen:</span>{" "}
                                        {formatDateTime(paper.first_seen_at)}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Last seen:</span>{" "}
                                        {formatDateTime(paper.last_seen_at)}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Saved:</span>{" "}
                                        {formatDateTime(paper.created_at)}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Updated:</span>{" "}
                                        {formatDateTime(paper.updated_at)}
                                    </p>
                                </div>

                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                    {paper.url && (
                                        <a
                                            href={paper.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
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

                                    <a
                                        href="/literature"
                                        className="rounded-xl border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                    >
                                        Back to Literature Scout
                                    </a>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Radar Scores</h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Automated scores generated by the Literature Radar. These are
                                    first-pass signals and should be combined with your manual
                                    review.
                                </p>

                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                        <p className="text-sm text-slate-400">AI relevance</p>
                                        <p className="mt-2 text-3xl font-bold">
                                            {getScoreDisplay(paper.ai_relevance_score)}
                                        </p>
                                        <span
                                            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${getScoreTone(
                                                paper.ai_relevance_score
                                            )}`}
                                        >
                                            Topic match
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                        <p className="text-sm text-slate-400">Novelty</p>
                                        <p className="mt-2 text-3xl font-bold">
                                            {getScoreDisplay(paper.novelty_score)}
                                        </p>
                                        <span
                                            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${getScoreTone(
                                                paper.novelty_score
                                            )}`}
                                        >
                                            Recency signal
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                        <p className="text-sm text-slate-400">Citation context</p>
                                        <p className="mt-2 text-3xl font-bold">
                                            {getScoreDisplay(paper.citation_context_score)}
                                        </p>
                                        <span
                                            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${getScoreTone(
                                                paper.citation_context_score
                                            )}`}
                                        >
                                            Citation signal
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                        <p className="text-sm text-slate-400">
                                            Proposal usefulness
                                        </p>
                                        <p className="mt-2 text-3xl font-bold">
                                            {getScoreDisplay(paper.proposal_usefulness_score)}
                                        </p>
                                        <span
                                            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${getScoreTone(
                                                paper.proposal_usefulness_score
                                            )}`}
                                        >
                                            Grant support
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">TLDR</h3>
                                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                    {paper.tldr || "No TLDR available."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Abstract</h3>
                                <p className="mt-4 max-h-[500px] overflow-y-auto whitespace-pre-line rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
                                    {paper.abstract || "No abstract available."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Relevance Reason</h3>
                                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                    {paper.relevance_reason ||
                                        "No relevance reason recorded yet."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Raw Metadata</h3>
                                <pre className="mt-4 max-h-[500px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-300">
                                    {JSON.stringify(paper.raw_json || {}, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Review Workspace</h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Add your own reading notes and decide how this paper should be
                                    used.
                                </p>

                                <div className="mt-6">
                                    <label className="text-sm font-medium text-slate-300">
                                        Paper status
                                    </label>
                                    <select
                                        value={paperStatus}
                                        onChange={(event) =>
                                            setPaperStatus(event.target.value as PaperStatus)
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                    >
                                        <option value="saved">Saved</option>
                                        <option value="reading">Reading</option>
                                        <option value="cite">Cite</option>
                                        <option value="use_in_proposal">Use in proposal</option>
                                        <option value="ignored">Ignored</option>
                                    </select>
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Manual rating
                                    </label>
                                    <select
                                        value={manualRating}
                                        onChange={(event) => setManualRating(event.target.value)}
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                    >
                                        <option value="none">Not rated</option>
                                        <option value="1">1, low relevance</option>
                                        <option value="2">2, weak</option>
                                        <option value="3">3, useful</option>
                                        <option value="4">4, strong</option>
                                        <option value="5">5, must read</option>
                                    </select>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Current meaning: {getRatingMeaning(manualRating)}
                                    </p>
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Paper category
                                    </label>
                                    <select
                                        value={paperCategory}
                                        onChange={(event) =>
                                            setPaperCategory(event.target.value as PaperCategory)
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                    >
                                        <option value="literature_review">Literature Review</option>
                                        <option value="methods">Methods</option>
                                        <option value="dataset_benchmark">
                                            Dataset / Benchmark
                                        </option>
                                        <option value="proposal_support">Proposal Support</option>
                                        <option value="background_reading">
                                            Background Reading
                                        </option>
                                        <option value="threat_paper">Threat Paper</option>
                                        <option value="gap_paper">Gap Paper</option>
                                        <option value="must_read">Must Read</option>
                                        <option value="cite_later">Cite Later</option>
                                        <option value="ignore">Ignore</option>
                                    </select>
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Manual review notes
                                    </label>
                                    <textarea
                                        rows={8}
                                        value={reviewNotes}
                                        onChange={(event) => setReviewNotes(event.target.value)}
                                        placeholder="Summarize the key contribution, methods, assumptions, limitations, and how this paper connects to your research."
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Manuscript use note
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={manuscriptUseNote}
                                        onChange={(event) =>
                                            setManuscriptUseNote(event.target.value)
                                        }
                                        placeholder="How might this paper support a manuscript introduction, related work, methods comparison, or gap statement?"
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Proposal use note
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={proposalUseNote}
                                        onChange={(event) =>
                                            setProposalUseNote(event.target.value)
                                        }
                                        placeholder="How might this paper support a proposal motivation, novelty claim, preliminary data argument, or agency fit?"
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveReview}
                                    disabled={saving}
                                    className="mt-6 w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : "Save Review Notes"}
                                </button>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Citation Export</h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Prepare this paper for BibTeX, RIS, EndNote, Zotero, or CSV
                                    export.
                                </p>

                                <div className="mt-6">
                                    <label className="text-sm font-medium text-slate-300">
                                        Citation key
                                    </label>
                                    <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                                        <input
                                            type="text"
                                            value={citationKey}
                                            onChange={(event) => setCitationKey(event.target.value)}
                                            placeholder="AuthorYearKeyword"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />

                                        <button
                                            type="button"
                                            onClick={handleGenerateCitationKey}
                                            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Export status
                                    </label>
                                    <select
                                        value={exportStatus}
                                        onChange={(event) =>
                                            setExportStatus(event.target.value as ExportStatus)
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                    >
                                        <option value="not_exported">Not Exported</option>
                                        <option value="ready_to_export">Ready to Export</option>
                                        <option value="exported_bibtex">Exported, BibTeX</option>
                                        <option value="exported_ris">Exported, RIS</option>
                                        <option value="exported_csv">Exported, CSV</option>
                                        <option value="exported_to_zotero">
                                            Exported to Zotero
                                        </option>
                                        <option value="exported_to_endnote">
                                            Exported to EndNote
                                        </option>
                                    </select>
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Exported to
                                    </label>
                                    <input
                                        type="text"
                                        value={exportedTo}
                                        onChange={(event) => setExportedTo(event.target.value)}
                                        placeholder="EndNote, Zotero, Overleaf, manuscript library..."
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <p className="mt-5 text-xs leading-5 text-slate-500">
                                    When export status is set to an exported state, ResearchOS
                                    will automatically stamp the exported date when you save.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">
                                    Automated vs Manual Rating
                                </h3>
                                <div className="mt-4 space-y-3 text-sm text-slate-300">
                                    <p>
                                        <span className="font-semibold text-slate-100">
                                            Automated scores:
                                        </span>{" "}
                                        generated by Literature Radar from topic matching, recency,
                                        citations, and proposal usefulness.
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-100">
                                            Manual rating:
                                        </span>{" "}
                                        your final judgment after reading or skimming the paper.
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-100">
                                            Recommended use:
                                        </span>{" "}
                                        use automated scores for triage and manual rating for final
                                        decisions.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Topic Tags</h3>
                                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                    {paper.topic_tags || "No topic tags saved."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Suggested Use</h3>
                                <div className="mt-4 space-y-3 text-sm text-slate-300">
                                    <p>
                                        <span className="font-semibold text-slate-100">
                                            If category is Threat Paper:
                                        </span>{" "}
                                        monitor it because it may overlap with your active research
                                        direction.
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-100">
                                            If category is Gap Paper:
                                        </span>{" "}
                                        use it to motivate a new proposal or manuscript angle.
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-100">
                                            If export status is Ready to Export:
                                        </span>{" "}
                                        include it in the next BibTeX/RIS export batch.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}