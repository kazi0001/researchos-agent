"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

type ResearchProfile = {
    id: string;
    full_name: string | null;
    institution: string | null;
    department: string | null;
    career_stage: string | null;
    research_themes: string | null;
    core_methods: string | null;
    target_agencies: string | null;
    proposal_priorities: string | null;
    created_at: string | null;
};

type FundingOpportunity = {
    id: string;
    source: string | null;
    source_id: string | null;
    title: string;
    agency: string | null;
    program: string | null;
    url: string | null;
    deadline: string | null;
    award_amount: string | null;
    eligibility: string | null;
    summary: string | null;
    full_text: string | null;
    status: string | null;
    created_at: string | null;
};

type FundingMatch = {
    id: string;
    opportunity_id: string;
    total_score: number | null;
    pi_alignment: number | null;
    agency_fit: number | null;
    novelty: number | null;
    preliminary_data_readiness: number | null;
    team_readiness: number | null;
    budget_scope_feasibility: number | null;
    deadline_feasibility: number | null;
    tenure_strategy_value: number | null;
    fit_reason: string | null;
    risks: string | null;
    recommended_actions: string | null;
    suggested_title: string | null;
    likely_framing: string | null;
    required_collaborators: string | null;
    scoring_method: string | null;
    created_at: string | null;
};

type GrantsGovOpportunity = {
    source: string;
    source_id: string;
    opportunity_number: string | null;
    title: string;
    agency: string | null;
    agency_code: string | null;
    deadline: string | null;
    posted_date: string | null;
    close_date: string | null;
    status: string | null;
    category: string | null;
    url: string | null;
    raw: any;
};

type GrantsGovDetails = {
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
    raw: any;
};

type ScoringMode = "auto" | "rule_based" | "llm";

type OpportunityStatus =
    | "watch"
    | "concept"
    | "active"
    | "submitted"
    | "ignored";

type OpportunityStatusFilter =
    | "all"
    | "watch"
    | "concept"
    | "active"
    | "submitted"
    | "ignored";

export default function FundingPage() {
    const [profile, setProfile] = useState<ResearchProfile | null>(null);
    const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
    const [matches, setMatches] = useState<FundingMatch[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [scoringId, setScoringId] = useState<string | null>(null);
    const [updatingOpportunityId, setUpdatingOpportunityId] = useState<
        string | null
    >(null);
    const [deletingOpportunityId, setDeletingOpportunityId] = useState<string | null>(null);

    const [scoringMode, setScoringMode] = useState<ScoringMode>("auto");
    const [statusFilter, setStatusFilter] =
        useState<OpportunityStatusFilter>("all");

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [title, setTitle] = useState("");
    const [agency, setAgency] = useState("");
    const [program, setProgram] = useState("");
    const [source, setSource] = useState("");
    const [url, setUrl] = useState("");
    const [deadline, setDeadline] = useState("");
    const [awardAmount, setAwardAmount] = useState("");
    const [eligibility, setEligibility] = useState("");
    const [summary, setSummary] = useState("");
    const [status, setStatus] = useState<OpportunityStatus>("watch");

    const [grantsKeyword, setGrantsKeyword] = useState("critical minerals");
    const [grantsRows, setGrantsRows] = useState("5");
    const [searchingGrants, setSearchingGrants] = useState(false);
    const [grantsResults, setGrantsResults] = useState<GrantsGovOpportunity[]>(
        []
    );
    const [grantsSearchMessage, setGrantsSearchMessage] = useState("");
    const [grantsSearchError, setGrantsSearchError] = useState("");
    const [importingSourceId, setImportingSourceId] = useState<string | null>(
        null
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get("status");

        const allowedStatuses: OpportunityStatusFilter[] = [
            "all",
            "watch",
            "concept",
            "active",
            "submitted",
            "ignored",
        ];

        if (status && allowedStatuses.includes(status as OpportunityStatusFilter)) {
            setStatusFilter(status as OpportunityStatusFilter);
        }
    }, []);

    useEffect(() => {
        loadPageData();
    }, []);

    const opportunityCounts = useMemo(() => {
        return {
            all: opportunities.length,
            watch: opportunities.filter((item) => (item.status || "watch") === "watch")
                .length,
            concept: opportunities.filter((item) => item.status === "concept").length,
            active: opportunities.filter((item) => item.status === "active").length,
            submitted: opportunities.filter((item) => item.status === "submitted")
                .length,
            ignored: opportunities.filter((item) => item.status === "ignored").length,
        };
    }, [opportunities]);

    const filteredOpportunities = useMemo(() => {
        if (statusFilter === "all") {
            return opportunities;
        }

        return opportunities.filter(
            (item) => (item.status || "watch") === statusFilter
        );
    }, [opportunities, statusFilter]);

    async function loadPageData() {
        setLoading(true);
        setErrorMessage("");

        await Promise.all([loadProfile(), loadOpportunities(), loadMatches()]);

        setLoading(false);
    }

    async function loadProfile() {
        const { data, error } = await supabase
            .from("research_profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error("Error loading profile:", error);

            if (error.code !== "PGRST116") {
                setErrorMessage(error.message);
            }

            return;
        }

        setProfile(data);
    }

    async function loadOpportunities() {
        const { data, error } = await supabase
            .from("funding_opportunities")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading funding opportunities:", error);
            setErrorMessage(error.message);
            return;
        }

        setOpportunities(data || []);
    }

    async function loadMatches() {
        const { data, error } = await supabase
            .from("funding_matches")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading funding matches:", error);
            setErrorMessage(error.message);
            return;
        }

        setMatches(data || []);
    }

    async function handleAddOpportunity() {
        setSaving(true);
        setMessage("");
        setErrorMessage("");

        if (!title.trim()) {
            setErrorMessage("Title is required.");
            setSaving(false);
            return;
        }

        const { error } = await supabase.from("funding_opportunities").insert([
            {
                source: source || "manual",
                title,
                agency,
                program,
                url,
                deadline: deadline || null,
                award_amount: awardAmount,
                eligibility,
                summary,
                full_text: summary,
                status,
            },
        ]);

        if (error) {
            console.error("Error saving funding opportunity:", error);
            setErrorMessage(error.message);
            setSaving(false);
            return;
        }

        setMessage("Funding opportunity saved successfully.");

        setTitle("");
        setAgency("");
        setProgram("");
        setSource("");
        setUrl("");
        setDeadline("");
        setAwardAmount("");
        setEligibility("");
        setSummary("");
        setStatus("watch");

        await loadOpportunities();

        setSaving(false);
    }

    async function handleGrantsGovSearch() {
        setSearchingGrants(true);
        setGrantsSearchMessage("");
        setGrantsSearchError("");
        setGrantsResults([]);

        const keyword = grantsKeyword.trim();

        if (!keyword) {
            setGrantsSearchError("Please enter a search keyword.");
            setSearchingGrants(false);
            return;
        }

        const rowsNumber = Number(grantsRows);

        if (Number.isNaN(rowsNumber) || rowsNumber < 1) {
            setGrantsSearchError("Rows must be a positive number.");
            setSearchingGrants(false);
            return;
        }

        try {
            const response = await fetch("/api/funding/grants/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    keyword,
                    rows: Math.min(rowsNumber, 50),
                }),
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                console.error("Grants.gov search error:", payload);
                setGrantsSearchError(
                    payload.error || "Grants.gov search failed. Please try again."
                );
                setSearchingGrants(false);
                return;
            }

            setGrantsResults(payload.opportunities || []);
            setGrantsSearchMessage(
                `Found ${payload.count || 0} Grants.gov opportunities for "${keyword}".`
            );
        } catch (error) {
            console.error("Grants.gov UI search error:", error);
            setGrantsSearchError(
                error instanceof Error
                    ? error.message
                    : "Unknown Grants.gov search error."
            );
        }

        setSearchingGrants(false);
    }

    function clearGrantsSearchResults() {
        setGrantsResults([]);
        setGrantsSearchMessage("");
        setGrantsSearchError("");
    }

    function removeGrantSearchResult(item: GrantsGovOpportunity) {
        setGrantsResults((currentResults) =>
            currentResults.filter(
                (result) =>
                    !(
                        result.source_id === item.source_id &&
                        result.title === item.title &&
                        result.opportunity_number === item.opportunity_number
                    )
            )
        );
    }

    function getFetchOpportunityId(item: GrantsGovOpportunity) {
        return (
            item.source_id ||
            item.raw?.id ||
            item.raw?.opportunityId ||
            item.raw?.oppId ||
            item.raw?.opportunity_id ||
            item.opportunity_number
        );
    }

    function getGrantsGovDetailUrl(item: GrantsGovOpportunity) {
        const detailId = getFetchOpportunityId(item);

        if (!detailId) {
            return item.url || "https://www.grants.gov/search-results";
        }

        return `https://www.grants.gov/search-results-detail/${encodeURIComponent(
            String(detailId)
        )}`;
    }

    function isAlreadyImported(item: GrantsGovOpportunity) {
        const sourceId = getFetchOpportunityId(item);

        return opportunities.some(
            (opportunity) =>
                opportunity.source === "grants.gov" &&
                (opportunity.source_id === sourceId ||
                    opportunity.source_id === item.source_id ||
                    opportunity.program === item.opportunity_number)
        );
    }

    function buildAwardAmount(details: GrantsGovDetails | null) {
        if (!details) return "";

        const parts = [
            details.award_floor ? `Award floor: ${details.award_floor}` : null,
            details.award_ceiling ? `Award ceiling: ${details.award_ceiling}` : null,
            details.estimated_total_program_funding
                ? `Estimated total program funding: ${details.estimated_total_program_funding}`
                : null,
            details.expected_number_of_awards
                ? `Expected number of awards: ${details.expected_number_of_awards}`
                : null,
        ].filter(Boolean);

        return parts.join("\n");
    }

    function buildFullTextFromDetails(
        details: GrantsGovDetails | null,
        fallbackItem: GrantsGovOpportunity
    ) {
        if (!details) {
            return JSON.stringify(fallbackItem.raw, null, 2);
        }

        const structuredText = [
            `Title: ${details.title}`,
            details.opportunity_number
                ? `Opportunity number: ${details.opportunity_number}`
                : null,
            details.opportunity_id ? `Opportunity ID: ${details.opportunity_id}` : null,
            details.agency ? `Agency: ${details.agency}` : null,
            details.agency_code ? `Agency code: ${details.agency_code}` : null,
            details.top_agency ? `Top agency: ${details.top_agency}` : null,
            details.category ? `Category: ${details.category}` : null,
            details.posted_date ? `Posted date: ${details.posted_date}` : null,
            details.close_date ? `Close date: ${details.close_date}` : null,
            details.archive_date ? `Archive date: ${details.archive_date}` : null,
            details.cost_sharing ? `Cost sharing: ${details.cost_sharing}` : null,
            details.cfda_numbers ? `CFDA numbers: ${details.cfda_numbers}` : null,
            details.contact ? `Contact:\n${details.contact}` : null,
            details.summary ? `Summary:\n${details.summary}` : null,
            details.eligibility ? `Eligibility:\n${details.eligibility}` : null,
            `\nRaw Grants.gov details:\n${JSON.stringify(details.raw, null, 2)}`,
        ]
            .filter(Boolean)
            .join("\n\n");

        return structuredText;
    }

    async function fetchGrantDetails(item: GrantsGovOpportunity) {
        const opportunityId = getFetchOpportunityId(item);

        if (!opportunityId) {
            return null;
        }

        const response = await fetch("/api/funding/grants/fetch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                opportunityId,
            }),
        });

        const payload = await response.json();

        if (!response.ok || !payload.ok) {
            console.error("Fetch full Grants.gov details failed:", payload);
            return null;
        }

        return payload.details as GrantsGovDetails;
    }

    async function handleImportGrant(item: GrantsGovOpportunity) {
        const sourceId = getFetchOpportunityId(item);

        setImportingSourceId(item.source_id);
        setMessage("");
        setErrorMessage("");
        setGrantsSearchError("");
        setGrantsSearchMessage("");

        if (isAlreadyImported(item)) {
            setGrantsSearchError("This opportunity is already imported.");
            setImportingSourceId(null);
            return;
        }

        let details: GrantsGovDetails | null = null;

        try {
            details = await fetchGrantDetails(item);
        } catch (error) {
            console.error("Error fetching full Grants.gov details:", error);
            details = null;
        }

        const importedTitle = details?.title || item.title;
        const importedAgency =
            details?.agency ||
            details?.agency_code ||
            item.agency ||
            item.agency_code ||
            "Grants.gov";

        const importedProgram =
            details?.opportunity_number || item.opportunity_number || item.category || "";

        const importedUrl = details?.url || getGrantsGovDetailUrl(item);
        const importedDeadline = details?.deadline || item.deadline || null;
        const importedEligibility = details?.eligibility || "";
        const importedSummary =
            details?.summary ||
            [
                item.category ? `Category: ${item.category}` : null,
                item.status ? `Status: ${item.status}` : null,
                item.posted_date ? `Posted date: ${item.posted_date}` : null,
                item.opportunity_number
                    ? `Opportunity number: ${item.opportunity_number}`
                    : null,
                item.agency_code ? `Agency code: ${item.agency_code}` : null,
            ]
                .filter(Boolean)
                .join("\n") ||
            "Imported from Grants.gov search result. Full solicitation details should be reviewed on the original Grants.gov page.";

        const importedAwardAmount = buildAwardAmount(details);
        const importedFullText = buildFullTextFromDetails(details, item);

        const { error } = await supabase.from("funding_opportunities").insert([
            {
                source: "grants.gov",
                source_id: details?.source_id || sourceId || item.source_id,
                title: importedTitle,
                agency: importedAgency,
                program: importedProgram,
                url: importedUrl,
                deadline: importedDeadline,
                award_amount: importedAwardAmount,
                eligibility: importedEligibility,
                summary: importedSummary,
                full_text: importedFullText,
                status: "watch",
            },
        ]);

        if (error) {
            console.error("Error importing Grants.gov opportunity:", error);
            setGrantsSearchError(error.message);
            setImportingSourceId(null);
            return;
        }

        if (details) {
            setMessage(`Imported full Grants.gov opportunity: ${importedTitle}`);
        } else {
            setMessage(
                `Imported Grants.gov opportunity with search metadata only: ${importedTitle}`
            );
        }

        await loadOpportunities();
        setImportingSourceId(null);
    }

    function getLatestMatch(opportunityId: string) {
        return matches.find((match) => match.opportunity_id === opportunityId);
    }

    function getScoringModeLabel(mode: ScoringMode) {
        if (mode === "auto") return "Auto, OpenAI first with rule-based fallback";
        if (mode === "rule_based") return "Rule-based only";
        return "OpenAI LLM only";
    }

    function getStatusLabel(statusValue: OpportunityStatusFilter) {
        if (statusValue === "all") return "All";
        if (statusValue === "watch") return "Watch";
        if (statusValue === "concept") return "Concept";
        if (statusValue === "active") return "Active";
        if (statusValue === "submitted") return "Submitted";
        return "Ignored";
    }

    function getStatusCount(statusValue: OpportunityStatusFilter) {
        return opportunityCounts[statusValue];
    }

    function handleStatusFilterChange(filter: OpportunityStatusFilter) {
        setStatusFilter(filter);

        const newUrl = filter === "all" ? "/funding" : `/funding?status=${filter}`;
        window.history.replaceState(null, "", newUrl);
    }

    function getDeadlineUrgencyLabel(deadline: string | null) {
        if (!deadline) {
            return "No deadline";
        }

        const today = new Date();
        const deadlineDate = new Date(deadline);

        if (Number.isNaN(deadlineDate.getTime())) {
            return "Deadline format unclear";
        }

        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);

        const diffMs = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `Deadline passed ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"
                } ago`;
        }

        if (diffDays === 0) {
            return "Due today";
        }

        if (diffDays === 1) {
            return "Due tomorrow";
        }

        return `Due in ${diffDays} days`;
    }

    function getDeadlineUrgencyTone(deadline: string | null) {
        if (!deadline) {
            return "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";
        }

        const today = new Date();
        const deadlineDate = new Date(deadline);

        if (Number.isNaN(deadlineDate.getTime())) {
            return "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";
        }

        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);

        const diffMs = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return "border-red-400 bg-red-100 text-red-900 dark:border-red-700 dark:bg-red-950/60 dark:text-red-100";
        }

        if (diffDays <= 14) {
            return "border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100";
        }

        if (diffDays <= 45) {
            return "border-yellow-400 bg-yellow-100 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-100";
        }

        return "border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-100";
    }

    async function handleQuickStatusUpdate(
        opportunityId: string,
        newStatus: OpportunityStatus
    ) {
        setUpdatingOpportunityId(opportunityId);
        setMessage("");
        setErrorMessage("");

        const { error } = await supabase
            .from("funding_opportunities")
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", opportunityId);

        if (error) {
            console.error("Error updating opportunity status:", error);
            setErrorMessage(error.message);
            setUpdatingOpportunityId(null);
            return;
        }

        setOpportunities((currentOpportunities) =>
            currentOpportunities.map((item) =>
                item.id === opportunityId ? { ...item, status: newStatus } : item
            )
        );

        setMessage(`Opportunity status updated to ${newStatus}.`);
        setUpdatingOpportunityId(null);
    }

    async function deleteOpportunity(opportunityId: string) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this opportunity? This will remove the saved opportunity, related fit-score records, and related proposal tasks."
        );

        if (!confirmed) return;

        setDeletingOpportunityId(opportunityId);
        setMessage("");
        setErrorMessage("");

        const { error: taskError } = await supabase
            .from("proposal_tasks")
            .delete()
            .eq("opportunity_id", opportunityId);

        if (taskError) {
            console.error("Error deleting related proposal tasks:", taskError);
            setErrorMessage(taskError.message);
            setDeletingOpportunityId(null);
            return;
        }

        const { error: matchError } = await supabase
            .from("funding_matches")
            .delete()
            .eq("opportunity_id", opportunityId);

        if (matchError) {
            console.error("Error deleting related funding matches:", matchError);
            setErrorMessage(matchError.message);
            setDeletingOpportunityId(null);
            return;
        }

        const { error: opportunityError } = await supabase
            .from("funding_opportunities")
            .delete()
            .eq("id", opportunityId);

        if (opportunityError) {
            console.error("Error deleting opportunity:", opportunityError);
            setErrorMessage(opportunityError.message);
            setDeletingOpportunityId(null);
            return;
        }

        setOpportunities((currentOpportunities) =>
            currentOpportunities.filter((item) => item.id !== opportunityId)
        );

        setMatches((currentMatches) =>
            currentMatches.filter((match) => match.opportunity_id !== opportunityId)
        );

        setMessage("Opportunity deleted successfully.");
        setDeletingOpportunityId(null);
    }

    async function handleScoreOpportunity(opportunity: FundingOpportunity) {
        setScoringId(opportunity.id);
        setMessage("");
        setErrorMessage("");

        if (!profile) {
            setErrorMessage(
                "Please create a research profile before scoring funding opportunities."
            );
            setScoringId(null);
            return;
        }

        try {
            const response = await fetch("/api/funding/score", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    profile,
                    opportunity,
                    scoringMode,
                }),
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                console.error("Funding score API error:", payload);
                setErrorMessage(
                    payload.error || "Funding score API failed. Please try again."
                );
                setScoringId(null);
                return;
            }

            const score = payload.score;

            const { error } = await supabase.from("funding_matches").insert([
                {
                    opportunity_id: opportunity.id,
                    total_score: score.total_score,
                    pi_alignment: score.pi_alignment,
                    agency_fit: score.agency_fit,
                    novelty: score.novelty,
                    preliminary_data_readiness: score.preliminary_data_readiness,
                    team_readiness: score.team_readiness,
                    budget_scope_feasibility: score.budget_scope_feasibility,
                    deadline_feasibility: score.deadline_feasibility,
                    tenure_strategy_value: score.tenure_strategy_value,
                    fit_reason: score.fit_reason,
                    risks: score.risks,
                    recommended_actions: score.recommended_actions,
                    suggested_title: score.suggested_title,
                    likely_framing: score.likely_framing,
                    required_collaborators: score.required_collaborators,
                    scoring_method: score.scoring_method || "rule_based_v1",
                },
            ]);

            if (error) {
                console.error("Error saving fit score:", error);
                setErrorMessage(error.message);
                setScoringId(null);
                return;
            }

            const fallbackNote = payload.used_fallback
                ? " OpenAI failed, so rule-based fallback was used."
                : "";

            setMessage(
                `Fit score saved for: ${opportunity.title}. Method: ${score.scoring_method || "rule_based_v1"
                }.${fallbackNote}`
            );

            await loadMatches();
        } catch (error) {
            console.error("Score workflow error:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unknown score workflow error."
            );
        }

        setScoringId(null);
    }

    const statusFilters: OpportunityStatusFilter[] = [
        "all",
        "watch",
        "concept",
        "active",
        "submitted",
        "ignored",
    ];

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Funding Radar"
                    description="Add funding calls, search Grants.gov, track deadlines, and score each opportunity against your research profile."
                    activePage="funding"
                />

                {!profile && (
                    <div className="mb-6 rounded-xl border border-amber-900 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
                        No research profile found. Please create a profile before scoring
                        opportunities.
                    </div>
                )}

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

                <div className="mb-6 theme-card p-6 sm:p-7">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end">
                        <div className="flex-1">
                            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                                Search Grants.gov
                            </h2>
                            <p className="mt-2 max-w-4xl text-base leading-7 text-[var(--muted-foreground)]">
                                Search real federal funding opportunities by keyword. When you
                                import a result, ResearchOS Agent first fetches richer Grants.gov
                                details and then saves the opportunity.
                            </p>

                            <label className="mt-5 block text-base font-bold text-[var(--foreground)]">
                                Search keyword
                            </label>
                            <input
                                type="text"
                                value={grantsKeyword}
                                onChange={(event) => setGrantsKeyword(event.target.value)}
                                placeholder="critical minerals, artificial intelligence, hydrogen"
                                className="mt-2 w-full"
                            />
                        </div>

                        <div className="w-full xl:w-48">
                            <label className="block text-base font-bold text-[var(--foreground)]">
                                Results
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={grantsRows}
                                onChange={(event) => setGrantsRows(event.target.value)}
                                className="mt-2 w-full"
                            />
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                            <button
                                type="button"
                                onClick={handleGrantsGovSearch}
                                disabled={searchingGrants}
                                className="inline-flex min-h-[56px] items-center justify-center rounded-xl bg-[var(--primary)] px-8 py-4 text-base font-extrabold text-[var(--primary-foreground)] shadow-lg transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {searchingGrants ? "Searching..." : "Search Grants.gov"}
                            </button>

                            <button
                                type="button"
                                onClick={clearGrantsSearchResults}
                                disabled={grantsResults.length === 0 && !grantsSearchMessage && !grantsSearchError}
                                className="inline-flex min-h-[56px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-8 py-4 text-base font-bold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Clear Results
                            </button>
                        </div>
                    </div>

                    {grantsSearchMessage && (
                        <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 px-6 py-5 text-base font-semibold leading-7 text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                            {grantsSearchMessage}
                        </div>
                    )}

                    {grantsSearchError && (
                        <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-6 py-5 text-base font-semibold leading-7 text-red-900 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
                            {grantsSearchError}
                        </div>
                    )}

                    {grantsResults.length > 0 && (
                        <div className="mt-6 space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-base font-semibold text-[var(--muted-foreground)]">
                                    Showing {grantsResults.length} search result{grantsResults.length === 1 ? "" : "s"}. Remove items you do not want to keep on this screen, or import the ones you want to save.
                                </p>
                            </div>

                            {grantsResults.map((item) => {
                                const alreadyImported = isAlreadyImported(item);

                                return (
                                    <div
                                        key={`${item.source_id}-${item.title}`}
                                        className="theme-card-soft p-5 sm:p-6"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="max-w-4xl">
                                                <p className="text-base font-semibold text-[var(--muted-foreground)]">
                                                    Grants.gov result
                                                </p>

                                                <h3 className="mt-2 text-2xl font-bold leading-snug text-[var(--foreground)]">
                                                    {item.title}
                                                </h3>

                                                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                                                    {item.agency || "Agency not provided"}
                                                    {item.agency_code ? ` • ${item.agency_code}` : ""}
                                                </p>
                                            </div>

                                            <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-bold capitalize text-[var(--foreground)]">
                                                {alreadyImported
                                                    ? "imported"
                                                    : item.status || "status unknown"}
                                            </span>
                                        </div>

                                        <div className="mt-5 grid gap-3 text-base leading-7 md:grid-cols-3">
                                            <p className="text-[var(--foreground)]">
                                                <span className="font-semibold text-[var(--muted-foreground)]">Opportunity #:</span>{" "}
                                                {item.opportunity_number || "Not provided"}
                                            </p>

                                            <p className="text-[var(--foreground)]">
                                                <span className="font-semibold text-[var(--muted-foreground)]">Posted:</span>{" "}
                                                {item.posted_date || "Not provided"}
                                            </p>

                                            <p className="text-[var(--foreground)]">
                                                <span className="font-semibold text-[var(--muted-foreground)]">Deadline:</span>{" "}
                                                {item.deadline || "Not provided"}
                                            </p>
                                        </div>

                                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => handleImportGrant(item)}
                                                disabled={
                                                    importingSourceId === item.source_id ||
                                                    alreadyImported
                                                }
                                                className="theme-button-primary text-base disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {alreadyImported
                                                    ? "Already Imported"
                                                    : importingSourceId === item.source_id
                                                        ? "Fetching full details..."
                                                        : "Import Full Details"}
                                            </button>

                                            <a
                                                href={getGrantsGovDetailUrl(item)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="theme-button-secondary text-base"
                                            >
                                                Open Exact Grants.gov Call
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => removeGrantSearchResult(item)}
                                                className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-base font-bold text-red-800 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100 dark:hover:bg-red-900/60"
                                            >
                                                Remove from Results
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-end">
                        <div>
                            <h2 className="text-xl font-semibold">Fit Scoring Settings</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Choose how ResearchOS Agent scores funding opportunities.
                                Current mode:{" "}
                                <span className="font-semibold text-slate-200">
                                    {getScoringModeLabel(scoringMode)}
                                </span>
                                .
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                Scoring mode
                            </label>
                            <select
                                value={scoringMode}
                                onChange={(event) =>
                                    setScoringMode(event.target.value as ScoringMode)
                                }
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            >
                                <option value="auto">Auto, OpenAI first with fallback</option>
                                <option value="rule_based">Rule-based only</option>
                                <option value="llm">OpenAI LLM only</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <h2 className="text-xl font-semibold">Add Funding Opportunity</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Add one call manually to test the funding pipeline.
                        </p>

                        <form
                            className="mt-6 space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleAddOpportunity();
                            }}
                        >
                            <div>
                                <label className="text-sm font-medium text-slate-300">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    placeholder="NSF Cyber-Physical Systems"
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-slate-300">
                                        Agency
                                    </label>
                                    <input
                                        type="text"
                                        value={agency}
                                        onChange={(event) => setAgency(event.target.value)}
                                        placeholder="NSF"
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300">
                                        Program
                                    </label>
                                    <input
                                        type="text"
                                        value={program}
                                        onChange={(event) => setProgram(event.target.value)}
                                        placeholder="CPS"
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-slate-300">
                                        Source
                                    </label>
                                    <input
                                        type="text"
                                        value={source}
                                        onChange={(event) => setSource(event.target.value)}
                                        placeholder="manual, Grants.gov, NSF, DOE"
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300">
                                        Deadline
                                    </label>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(event) => setDeadline(event.target.value)}
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300">
                                    URL
                                </label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(event) => setUrl(event.target.value)}
                                    placeholder="https://..."
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300">
                                    Award amount
                                </label>
                                <input
                                    type="text"
                                    value={awardAmount}
                                    onChange={(event) => setAwardAmount(event.target.value)}
                                    placeholder="$500,000, $1.2M, varies"
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300">
                                    Eligibility
                                </label>
                                <textarea
                                    rows={3}
                                    value={eligibility}
                                    onChange={(event) => setEligibility(event.target.value)}
                                    placeholder="Universities, non-profits, industry partners, national labs..."
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300">
                                    Summary
                                </label>
                                <textarea
                                    rows={5}
                                    value={summary}
                                    onChange={(event) => setSummary(event.target.value)}
                                    placeholder="Briefly describe the funding call, target topics, proposal requirements, and why it may fit your research portfolio."
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300">
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(event.target.value as OpportunityStatus)
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                >
                                    <option value="watch">Watch</option>
                                    <option value="concept">Concept</option>
                                    <option value="active">Active</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="ignored">Ignored</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save Funding Opportunity"}
                            </button>
                        </form>
                    </div>

                    <div className="theme-card p-6 sm:p-7">
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                                    Tracked Opportunities
                                </h2>
                                <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                                    Filter saved opportunities by pipeline status.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={loadPageData}
                                className="theme-button-secondary text-base"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="mb-6 grid gap-3 md:grid-cols-3">
                            {statusFilters.map((filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => handleStatusFilterChange(filter)}
                                    className={[
                                        "rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                                        statusFilter === filter
                                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                            : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--muted)]",
                                    ].join(" ")}
                                >
                                    <p className="text-base font-extrabold text-current">
                                        {getStatusLabel(filter)}
                                    </p>
                                    <p className="mt-4 text-4xl font-extrabold text-current">
                                        {getStatusCount(filter)}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <p className="mb-5 text-base leading-7 text-[var(--muted-foreground)]">
                            Showing {filteredOpportunities.length} of {opportunities.length}{" "}
                            saved opportunities.
                        </p>

                        {loading && (
                            <p className="mt-6 text-base text-[var(--muted-foreground)]">
                                Loading opportunities...
                            </p>
                        )}

                        {!loading && opportunities.length === 0 && (
                            <div className="mt-6 theme-card-soft px-5 py-5 text-base leading-7 text-[var(--muted-foreground)]">
                                No funding opportunities saved yet.
                            </div>
                        )}

                        {!loading &&
                            opportunities.length > 0 &&
                            filteredOpportunities.length === 0 && (
                                <div className="mt-6 theme-card-soft px-5 py-5 text-base leading-7 text-[var(--muted-foreground)]">
                                    No opportunities found for this status filter.
                                </div>
                            )}

                        {!loading && filteredOpportunities.length > 0 && (
                            <div className="mt-6 space-y-4">
                                {filteredOpportunities.map((item) => {
                                    const match = getLatestMatch(item.id);
                                    const urgencyLabel = getDeadlineUrgencyLabel(item.deadline);
                                    const urgencyTone = getDeadlineUrgencyTone(item.deadline);

                                    return (
                                        <div
                                            key={item.id}
                                            className="theme-card-soft p-6 sm:p-7"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <h3 className="text-2xl font-extrabold leading-snug text-[var(--foreground)]">
                                                        {item.title}
                                                    </h3>
                                                    <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                                                        {item.agency || "Agency not provided"}
                                                        {item.program ? ` • ${item.program}` : ""}
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <span
                                                            className={`inline-flex rounded-full border px-4 py-2 text-sm font-extrabold shadow-sm ${urgencyTone}`}
                                                        >
                                                            {urgencyLabel}
                                                        </span>

                                                        <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)] shadow-sm">
                                                            Deadline: {item.deadline || "Not provided"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 sm:items-end">
                                                    <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-extrabold capitalize text-[var(--foreground)]">
                                                        {item.status || "watch"}
                                                    </span>

                                                    <select
                                                        value={item.status || "watch"}
                                                        onChange={(event) =>
                                                            handleQuickStatusUpdate(
                                                                item.id,
                                                                event.target.value as OpportunityStatus
                                                            )
                                                        }
                                                        disabled={updatingOpportunityId === item.id}
                                                        className="min-h-[52px] rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base font-bold text-[var(--foreground)] shadow-sm outline-none transition focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <option value="watch">Watch</option>
                                                        <option value="concept">Concept</option>
                                                        <option value="active">Active</option>
                                                        <option value="submitted">Submitted</option>
                                                        <option value="ignored">Ignored</option>
                                                    </select>

                                                    {updatingOpportunityId === item.id && (
                                                        <p className="text-xs text-slate-500">
                                                            Updating...
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-5 grid gap-3 text-base leading-7 text-[var(--foreground)] md:grid-cols-2">
                                                <p>
                                                    <span className="font-semibold text-[var(--muted-foreground)]">Award:</span>{" "}
                                                    {item.award_amount || "Not provided"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold text-[var(--muted-foreground)]">Source:</span>{" "}
                                                    {item.source || "manual"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold text-[var(--muted-foreground)]">Eligibility:</span>{" "}
                                                    {item.eligibility || "Not provided"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold text-[var(--muted-foreground)]">Created:</span>{" "}
                                                    {item.created_at
                                                        ? new Date(item.created_at).toLocaleDateString()
                                                        : "Not available"}
                                                </p>
                                            </div>

                                            {item.summary && (
                                                <p className="mt-5 text-base leading-8 text-[var(--muted-foreground)]">
                                                    {item.summary}
                                                </p>
                                            )}

                                            {match && (
                                                <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
                                                                Fit Score
                                                            </p>
                                                            <h4 className="mt-1 text-4xl font-extrabold text-[var(--foreground)]">
                                                                {match.total_score}/100
                                                            </h4>
                                                        </div>

                                                        <p className="text-base font-semibold text-[var(--foreground)]">
                                                            {match.total_score && match.total_score >= 85
                                                                ? "Pursue now"
                                                                : match.total_score && match.total_score >= 70
                                                                    ? "Develop concept note"
                                                                    : match.total_score && match.total_score >= 55
                                                                        ? "Watch or collaborate"
                                                                        : "Low priority"}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4">
                                                        <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-bold text-[var(--foreground)]">
                                                            Scoring method:{" "}
                                                            {match.scoring_method || "rule_based_v1"}
                                                        </span>
                                                    </div>

                                                    <p className="mt-5 text-base leading-8 text-[var(--foreground)]">
                                                        {match.fit_reason}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                                <a
                                                    href={`/funding/${item.id}`}
                                                    className="theme-button-primary text-base"
                                                >
                                                    View Details
                                                </a>

                                                <button
                                                    type="button"
                                                    disabled={scoringId === item.id}
                                                    onClick={() => handleScoreOpportunity(item)}
                                                    className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] px-5 py-3 text-base font-bold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--card)] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {scoringId === item.id
                                                        ? "Scoring..."
                                                        : match
                                                            ? "Re-score Fit"
                                                            : "Score Fit"}
                                                </button>

                                                {item.url && (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="theme-button-secondary text-base"
                                                    >
                                                        Open funding page
                                                    </a>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => deleteOpportunity(item.id)}
                                                    disabled={deletingOpportunityId === item.id}
                                                    className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-base font-extrabold text-red-800 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100 dark:hover:bg-red-900/50"
                                                >
                                                    {deletingOpportunityId === item.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}