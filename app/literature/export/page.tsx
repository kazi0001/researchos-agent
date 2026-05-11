"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

type ExportFormat = "bibtex" | "ris";

type ExportFilter =
    | "all"
    | "ready_to_export"
    | "cite"
    | "use_in_proposal"
    | "must_read"
    | "not_exported";

type Paper = {
    id: string;
    title: string;
    authors: string | null;
    year: number | null;
    venue: string | null;
    doi: string | null;
    url: string | null;
    paper_status: string | null;
    paper_category: string | null;
    citation_key: string | null;
    export_status: string | null;
    manual_rating: number | null;
    created_at: string | null;
};

export default function LiteratureExportPage() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);

    const [format, setFormat] = useState<ExportFormat>("bibtex");
    const [filter, setFilter] = useState<ExportFilter>("ready_to_export");

    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const [exportText, setExportText] = useState("");
    const [fileName, setFileName] = useState("researchos_literature_export.bib");

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        loadPapers();
    }, []);

    const filteredPapers = useMemo(() => {
        let result = [...papers];

        if (filter === "ready_to_export") {
            result = result.filter((paper) => paper.export_status === "ready_to_export");
        } else if (filter === "cite") {
            result = result.filter((paper) => paper.paper_status === "cite");
        } else if (filter === "use_in_proposal") {
            result = result.filter((paper) => paper.paper_status === "use_in_proposal");
        } else if (filter === "must_read") {
            result = result.filter(
                (paper) => paper.paper_category === "must_read" || paper.manual_rating === 5
            );
        } else if (filter === "not_exported") {
            result = result.filter(
                (paper) => !paper.export_status || paper.export_status === "not_exported"
            );
        }

        return result;
    }, [papers, filter]);

    async function loadPapers() {
        setLoading(true);
        setMessage("");
        setErrorMessage("");

        const { data, error } = await supabase
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
        paper_status,
        paper_category,
        citation_key,
        export_status,
        manual_rating,
        created_at
      `
            )
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading papers for export:", error);
            setErrorMessage(error.message);
            setLoading(false);
            return;
        }

        setPapers(data || []);
        setLoading(false);
    }

    function togglePaperSelection(paperId: string) {
        setSelectedPaperIds((current) =>
            current.includes(paperId)
                ? current.filter((id) => id !== paperId)
                : [...current, paperId]
        );
    }

    function selectAllFiltered() {
        setSelectedPaperIds(filteredPapers.map((paper) => paper.id));
    }

    function clearSelection() {
        setSelectedPaperIds([]);
    }

    async function handleGenerateExport() {
        setExporting(true);
        setMessage("");
        setErrorMessage("");
        setExportText("");

        if (selectedPaperIds.length === 0) {
            setErrorMessage("Please select at least one paper to export.");
            setExporting(false);
            return;
        }

        try {
            const response = await fetch("/api/literature/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    format,
                    paperIds: selectedPaperIds,
                }),
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                setErrorMessage(payload.error || "Export generation failed.");
                setExporting(false);
                return;
            }

            setExportText(payload.export_text || "");
            setFileName(payload.file_name || "researchos_literature_export.bib");
            setMessage(`Generated ${payload.format} export for ${payload.count} papers.`);
        } catch (error) {
            console.error("Export generation error:", error);
            setErrorMessage(
                error instanceof Error ? error.message : "Unknown export generation error."
            );
        }

        setExporting(false);
    }

    async function copyToClipboard() {
        if (!exportText) {
            setErrorMessage("No export text available to copy.");
            return;
        }

        await navigator.clipboard.writeText(exportText);
        setMessage("Export text copied to clipboard.");
    }

    function downloadExportFile() {
        if (!exportText) {
            setErrorMessage("No export text available to download.");
            return;
        }

        const blob = new Blob([exportText], {
            type: "text/plain;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;
        link.click();

        URL.revokeObjectURL(url);
    }

    async function markSelectedAsExported() {
        setMessage("");
        setErrorMessage("");

        if (selectedPaperIds.length === 0) {
            setErrorMessage("Please select at least one paper first.");
            return;
        }

        const exportStatus =
            format === "ris" ? "exported_ris" : "exported_bibtex";

        const exportedTo = format === "ris" ? "RIS / EndNote" : "BibTeX / Zotero";

        const { error } = await supabase
            .from("papers")
            .update({
                export_status: exportStatus,
                exported_to: exportedTo,
                exported_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .in("id", selectedPaperIds);

        if (error) {
            console.error("Error marking papers as exported:", error);
            setErrorMessage(error.message);
            return;
        }

        setMessage("Selected papers marked as exported.");
        await loadPapers();
    }

    function getStatusLabel(status: string | null) {
        if (status === "reading") return "Reading";
        if (status === "cite") return "Cite";
        if (status === "use_in_proposal") return "Use in proposal";
        if (status === "ignored") return "Ignored";
        return "Saved";
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

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Literature Export"
                    description="Select saved papers and generate BibTeX or RIS exports for Zotero, EndNote, Mendeley, Overleaf, or manuscript preparation."
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
                    <div className="grid gap-4 lg:grid-cols-[1fr_180px_240px] lg:items-end">
                        <div>
                            <h2 className="text-xl font-semibold">Export Settings</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Select papers, choose a citation format, then copy or download the export.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Format
                            </label>
                            <select
                                value={format}
                                onChange={(event) => setFormat(event.target.value as ExportFormat)}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            >
                                <option value="bibtex">BibTeX</option>
                                <option value="ris">RIS, EndNote</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Filter
                            </label>
                            <select
                                value={filter}
                                onChange={(event) => setFilter(event.target.value as ExportFilter)}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            >
                                <option value="all">All papers</option>
                                <option value="ready_to_export">Ready to export</option>
                                <option value="cite">Status: Cite</option>
                                <option value="use_in_proposal">Status: Use in proposal</option>
                                <option value="must_read">Must read</option>
                                <option value="not_exported">Not exported</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={selectAllFiltered}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                        >
                            Select All Filtered
                        </button>

                        <button
                            type="button"
                            onClick={clearSelection}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                        >
                            Clear Selection
                        </button>

                        <button
                            type="button"
                            onClick={handleGenerateExport}
                            disabled={exporting}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {exporting ? "Generating..." : "Generate Export"}
                        </button>

                        <button
                            type="button"
                            onClick={markSelectedAsExported}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                        >
                            Mark as Exported
                        </button>

                        <a
                            href="/literature"
                            className="rounded-xl border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                        >
                            Back to Literature Scout
                        </a>
                    </div>

                    <p className="mt-4 text-sm text-slate-400">
                        Selected {selectedPaperIds.length} paper
                        {selectedPaperIds.length === 1 ? "" : "s"}. Showing{" "}
                        {filteredPapers.length} of {papers.length} papers.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <h2 className="text-xl font-semibold">Select Papers</h2>

                        {loading && (
                            <p className="mt-6 text-sm text-slate-400">Loading papers...</p>
                        )}

                        {!loading && filteredPapers.length === 0 && (
                            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                                No papers found for this filter.
                            </div>
                        )}

                        {!loading && filteredPapers.length > 0 && (
                            <div className="mt-6 space-y-4">
                                {filteredPapers.map((paper) => {
                                    const selected = selectedPaperIds.includes(paper.id);

                                    return (
                                        <div
                                            key={paper.id}
                                            className={`rounded-xl border p-4 ${selected
                                                    ? "border-white bg-slate-950"
                                                    : "border-slate-800 bg-slate-950"
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => togglePaperSelection(paper.id)}
                                                    className="mt-1 h-4 w-4"
                                                />

                                                <div className="flex-1">
                                                    <p className="text-xs text-slate-500">
                                                        {paper.year || "Year unknown"}{" "}
                                                        {paper.venue ? `• ${paper.venue}` : ""}
                                                    </p>

                                                    <h3 className="mt-2 text-sm font-semibold">
                                                        {paper.title}
                                                    </h3>

                                                    <p className="mt-2 text-xs text-slate-400">
                                                        {paper.authors || "Authors not provided"}
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                            {getStatusLabel(paper.paper_status)}
                                                        </span>

                                                        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                            {getCategoryLabel(paper.paper_category)}
                                                        </span>

                                                        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                            {getExportStatusLabel(paper.export_status)}
                                                        </span>

                                                        {paper.citation_key && (
                                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                                {paper.citation_key}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                                        <a
                                                            href={`/literature/${paper.id}`}
                                                            className="rounded-lg border border-slate-700 px-3 py-2 text-center text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
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
                                                                Open Paper
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Export Output</h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    Copy this text or download it as a file.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={copyToClipboard}
                                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                >
                                    Copy
                                </button>

                                <button
                                    type="button"
                                    onClick={downloadExportFile}
                                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                                >
                                    Download
                                </button>
                            </div>
                        </div>

                        {!exportText && (
                            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                                No export generated yet.
                            </div>
                        )}

                        {exportText && (
                            <textarea
                                value={exportText}
                                onChange={(event) => setExportText(event.target.value)}
                                rows={24}
                                className="mt-6 w-full rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-200 outline-none"
                            />
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}