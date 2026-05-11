"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

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
    status: string | null;
    created_at: string | null;
    updated_at: string | null;

    eligibility_status: string | null;
    fit_institution_eligible: string | null;
    national_lab_only: boolean | null;
    university_allowed: boolean | null;
    budget_min: number | null;
    budget_max: number | null;
    budget_text: string | null;
    project_duration_months: number | null;
    project_duration_text: string | null;

    loi_deadline: string | null;
    preproposal_deadline: string | null;
    concept_paper_deadline: string | null;
    full_proposal_deadline: string | null;
    internal_routing_deadline: string | null;

    proposal_priority: string | null;
    urgency_level: string | null;
    decision_status: string | null;
    call_intelligence_status: string | null;
};

type FundingMatch = {
    id: string;
    opportunity_id: string;
    total_score: number | null;
    scoring_method: string | null;
    created_at: string | null;
};

type CalendarItem = FundingOpportunity & {
    main_deadline: string | null;
    main_deadline_label: string;
    days_until: number | null;
    urgency_group:
    | "overdue"
    | "urgent"
    | "soon"
    | "medium"
    | "later"
    | "no_deadline";
    latest_score: FundingMatch | null;
};

type CalendarFilter =
    | "all"
    | "watch"
    | "concept"
    | "active"
    | "submitted"
    | "ignored"
    | "go"
    | "eligible"
    | "unknown_eligibility";

export default function ProposalCalendarPage() {
    const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
    const [matches, setMatches] = useState<FundingMatch[]>([]);
    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState<CalendarFilter>("all");
    const [timelineDays, setTimelineDays] = useState("180");

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        loadCalendarData();
    }, []);

    async function loadCalendarData() {
        setLoading(true);
        setMessage("");
        setErrorMessage("");

        const [opportunityResponse, matchResponse] = await Promise.all([
            supabase
                .from("funding_opportunities")
                .select(
                    `
          id,
          source,
          source_id,
          title,
          agency,
          program,
          url,
          deadline,
          award_amount,
          eligibility,
          summary,
          status,
          created_at,
          updated_at,
          eligibility_status,
          fit_institution_eligible,
          national_lab_only,
          university_allowed,
          budget_min,
          budget_max,
          budget_text,
          project_duration_months,
          project_duration_text,
          loi_deadline,
          preproposal_deadline,
          concept_paper_deadline,
          full_proposal_deadline,
          internal_routing_deadline,
          proposal_priority,
          urgency_level,
          decision_status,
          call_intelligence_status
        `
                )
                .order("created_at", { ascending: false }),
            supabase
                .from("funding_matches")
                .select("id, opportunity_id, total_score, scoring_method, created_at")
                .order("created_at", { ascending: false }),
        ]);

        if (opportunityResponse.error) {
            console.error("Error loading opportunities:", opportunityResponse.error);
            setErrorMessage(opportunityResponse.error.message);
            setLoading(false);
            return;
        }

        if (matchResponse.error) {
            console.error("Error loading scores:", matchResponse.error);
            setErrorMessage(matchResponse.error.message);
            setLoading(false);
            return;
        }

        setOpportunities(opportunityResponse.data || []);
        setMatches(matchResponse.data || []);
        setLoading(false);
    }

    function getLatestScore(opportunityId: string) {
        return (
            matches.find((match) => match.opportunity_id === opportunityId) || null
        );
    }

    function getMainDeadline(item: FundingOpportunity) {
        if (item.full_proposal_deadline) {
            return {
                date: item.full_proposal_deadline,
                label: "Full proposal",
            };
        }

        if (item.concept_paper_deadline) {
            return {
                date: item.concept_paper_deadline,
                label: "Concept paper",
            };
        }

        if (item.preproposal_deadline) {
            return {
                date: item.preproposal_deadline,
                label: "Preproposal",
            };
        }

        if (item.loi_deadline) {
            return {
                date: item.loi_deadline,
                label: "LOI",
            };
        }

        if (item.deadline) {
            return {
                date: item.deadline,
                label: "Opportunity deadline",
            };
        }

        return {
            date: null,
            label: "No deadline",
        };
    }

    function getDaysUntil(dateString: string | null) {
        if (!dateString) return null;

        const today = new Date();
        const target = new Date(dateString);

        if (Number.isNaN(target.getTime())) return null;

        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);

        return Math.ceil(
            (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
    }

    function getUrgencyGroup(days: number | null): CalendarItem["urgency_group"] {
        if (days === null) return "no_deadline";
        if (days < 0) return "overdue";
        if (days <= 14) return "urgent";
        if (days <= 45) return "soon";
        if (days <= 90) return "medium";
        return "later";
    }

    function getUrgencyLabel(days: number | null) {
        if (days === null) return "No deadline";
        if (days < 0) {
            return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"
                }`;
        }
        if (days === 0) return "Due today";
        if (days === 1) return "Due tomorrow";
        return `Due in ${days} days`;
    }

    function getUrgencyTone(group: CalendarItem["urgency_group"]) {
        if (group === "overdue") return "border-red-900 text-red-200";
        if (group === "urgent") return "border-amber-900 text-amber-200";
        if (group === "soon") return "border-yellow-900 text-yellow-200";
        if (group === "medium") return "border-blue-900 text-blue-200";
        if (group === "later") return "border-emerald-900 text-emerald-200";
        return "border-slate-700 text-slate-300";
    }

    function getTimelineDotColor(group: CalendarItem["urgency_group"]) {
        if (group === "overdue") return "bg-red-500";
        if (group === "urgent") return "bg-amber-400";
        if (group === "soon") return "bg-yellow-400";
        if (group === "medium") return "bg-blue-400";
        if (group === "later") return "bg-emerald-400";
        return "bg-slate-500";
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return "Not provided";

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString();
    }

    function formatMonthLabel(offsetDays: number) {
        const date = new Date();
        date.setDate(date.getDate() + offsetDays);
        return date.toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
        });
    }

    function formatBudget(item: FundingOpportunity) {
        if (item.budget_text) return item.budget_text;
        if (item.award_amount) return item.award_amount;

        if (item.budget_min && item.budget_max) {
            return `$${item.budget_min.toLocaleString()} to $${item.budget_max.toLocaleString()}`;
        }

        if (item.budget_max) {
            return `Up to $${item.budget_max.toLocaleString()}`;
        }

        if (item.budget_min) {
            return `From $${item.budget_min.toLocaleString()}`;
        }

        return "Budget not recorded";
    }

    function getEligibilityLabel(item: FundingOpportunity) {
        if (item.national_lab_only) return "National lab only";
        if (item.fit_institution_eligible === "yes") return "FIT eligible";
        if (item.fit_institution_eligible === "likely")
            return "FIT likely eligible";
        if (item.fit_institution_eligible === "maybe")
            return "Eligibility needs review";
        if (item.fit_institution_eligible === "no") return "FIT not eligible";
        if (item.university_allowed === true) return "University allowed";
        if (item.university_allowed === false) return "University not allowed";
        return "Eligibility unknown";
    }

    function getEligibilityTone(item: FundingOpportunity) {
        if (item.national_lab_only || item.fit_institution_eligible === "no") {
            return "border-red-900 text-red-200";
        }

        if (
            item.fit_institution_eligible === "yes" ||
            item.fit_institution_eligible === "likely" ||
            item.university_allowed === true
        ) {
            return "border-emerald-900 text-emerald-200";
        }

        if (item.fit_institution_eligible === "maybe") {
            return "border-yellow-900 text-yellow-200";
        }

        return "border-slate-700 text-slate-300";
    }

    const calendarItems = useMemo<CalendarItem[]>(() => {
        return opportunities
            .map((item) => {
                const deadline = getMainDeadline(item);
                const days = getDaysUntil(deadline.date);

                return {
                    ...item,
                    main_deadline: deadline.date,
                    main_deadline_label: deadline.label,
                    days_until: days,
                    urgency_group: getUrgencyGroup(days),
                    latest_score: getLatestScore(item.id),
                };
            })
            .sort((a, b) => {
                if (a.days_until === null && b.days_until === null) return 0;
                if (a.days_until === null) return 1;
                if (b.days_until === null) return -1;
                return a.days_until - b.days_until;
            });
    }, [opportunities, matches]);

    const filteredItems = useMemo(() => {
        if (filter === "all") return calendarItems;

        if (
            filter === "watch" ||
            filter === "concept" ||
            filter === "active" ||
            filter === "submitted" ||
            filter === "ignored"
        ) {
            return calendarItems.filter((item) => (item.status || "watch") === filter);
        }

        if (filter === "go") {
            return calendarItems.filter((item) => item.decision_status === "go");
        }

        if (filter === "eligible") {
            return calendarItems.filter(
                (item) =>
                    item.fit_institution_eligible === "yes" ||
                    item.fit_institution_eligible === "likely" ||
                    item.university_allowed === true
            );
        }

        if (filter === "unknown_eligibility") {
            return calendarItems.filter(
                (item) =>
                    !item.fit_institution_eligible ||
                    item.fit_institution_eligible === "unknown"
            );
        }

        return calendarItems;
    }, [calendarItems, filter]);

    const groupedItems = {
        overdue: filteredItems.filter((item) => item.urgency_group === "overdue"),
        urgent: filteredItems.filter((item) => item.urgency_group === "urgent"),
        soon: filteredItems.filter((item) => item.urgency_group === "soon"),
        medium: filteredItems.filter((item) => item.urgency_group === "medium"),
        later: filteredItems.filter((item) => item.urgency_group === "later"),
        no_deadline: filteredItems.filter(
            (item) => item.urgency_group === "no_deadline"
        ),
    };

    const timelineItems = useMemo(() => {
        const maxDays = Number(timelineDays);

        return filteredItems.filter(
            (item) =>
                item.days_until !== null &&
                item.days_until >= 0 &&
                item.days_until <= maxDays
        );
    }, [filteredItems, timelineDays]);

    function getCalendarCounts() {
        return {
            total: calendarItems.length,
            overdue: calendarItems.filter((item) => item.urgency_group === "overdue")
                .length,
            urgent: calendarItems.filter((item) => item.urgency_group === "urgent")
                .length,
            soon: calendarItems.filter((item) => item.urgency_group === "soon").length,
            active: calendarItems.filter((item) => item.status === "active").length,
        };
    }

    const counts = getCalendarCounts();

    function renderCalendarCard(item: CalendarItem) {
        return (
            <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-5"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-sm text-slate-500">
                            {item.agency || "Agency not provided"}
                            {item.program ? ` • ${item.program}` : ""}
                        </p>

                        <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <span
                                className={`rounded-full border px-3 py-1 text-xs ${getUrgencyTone(
                                    item.urgency_group
                                )}`}
                            >
                                {getUrgencyLabel(item.days_until)}
                            </span>

                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                {item.main_deadline_label}: {formatDate(item.main_deadline)}
                            </span>

                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 capitalize">
                                Status: {item.status || "watch"}
                            </span>

                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                Priority: {item.proposal_priority || "unassigned"}
                            </span>

                            <span
                                className={`rounded-full border px-3 py-1 text-xs ${getEligibilityTone(
                                    item
                                )}`}
                            >
                                {getEligibilityLabel(item)}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-center lg:min-w-[120px]">
                        <p className="text-xs text-slate-400">Fit Score</p>
                        <p className="mt-1 text-2xl font-bold">
                            {item.latest_score?.total_score ?? "N/A"}
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                    <p>
                        <span className="text-slate-500">Budget:</span> {formatBudget(item)}
                    </p>

                    <p>
                        <span className="text-slate-500">Duration:</span>{" "}
                        {item.project_duration_text ||
                            (item.project_duration_months
                                ? `${item.project_duration_months} months`
                                : "Not recorded")}
                    </p>

                    <p>
                        <span className="text-slate-500">Internal routing:</span>{" "}
                        {formatDate(item.internal_routing_deadline)}
                    </p>

                    <p>
                        <span className="text-slate-500">Decision:</span>{" "}
                        {item.decision_status || "undecided"}
                    </p>

                    <p>
                        <span className="text-slate-500">LOI:</span>{" "}
                        {formatDate(item.loi_deadline)}
                    </p>

                    <p>
                        <span className="text-slate-500">Concept:</span>{" "}
                        {formatDate(item.concept_paper_deadline)}
                    </p>

                    <p>
                        <span className="text-slate-500">Preproposal:</span>{" "}
                        {formatDate(item.preproposal_deadline)}
                    </p>

                    <p>
                        <span className="text-slate-500">Full proposal:</span>{" "}
                        {formatDate(item.full_proposal_deadline || item.deadline)}
                    </p>
                </div>

                {item.summary && (
                    <p className="mt-4 max-h-28 overflow-y-auto text-sm leading-6 text-slate-400">
                        {item.summary}
                    </p>
                )}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <a
                        href={`/funding/${item.id}`}
                        className="rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    >
                        Open Detail
                    </a>

                    {item.url && (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                        >
                            Open Funding Page
                        </a>
                    )}
                </div>
            </div>
        );
    }

    function renderGroup(
        title: string,
        description: string,
        items: CalendarItem[]
    ) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">{title}</h2>
                        <p className="mt-1 text-sm text-slate-400">{description}</p>
                    </div>

                    <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                        {items.length} item{items.length === 1 ? "" : "s"}
                    </span>
                </div>

                {items.length === 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                        No opportunities in this group.
                    </div>
                )}

                {items.length > 0 && (
                    <div className="space-y-4">{items.map(renderCalendarCard)}</div>
                )}
            </div>
        );
    }

    function renderMiniTimeline() {
        const maxDays = Number(timelineDays);

        return (
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Mini Deadline Timeline</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Visual view of upcoming proposal deadlines across the selected
                            time window.
                        </p>
                    </div>

                    <div className="w-full lg:w-56">
                        <label className="text-sm font-medium text-slate-300">
                            Timeline window
                        </label>
                        <select
                            value={timelineDays}
                            onChange={(event) => setTimelineDays(event.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                        >
                            <option value="90">Next 90 days</option>
                            <option value="180">Next 180 days</option>
                            <option value="365">Next 365 days</option>
                        </select>
                    </div>
                </div>

                <div className="relative mt-8 rounded-xl border border-slate-800 bg-slate-950 p-5">
                    <div className="mb-6 grid grid-cols-4 text-xs text-slate-500">
                        <p>Today</p>
                        <p className="text-center">{formatMonthLabel(maxDays * 0.33)}</p>
                        <p className="text-center">{formatMonthLabel(maxDays * 0.66)}</p>
                        <p className="text-right">{formatMonthLabel(maxDays)}</p>
                    </div>

                    <div className="relative h-3 rounded-full bg-slate-800">
                        <div className="absolute left-0 top-0 h-3 w-1 rounded-full bg-white" />

                        {timelineItems.map((item) => {
                            const leftPercent =
                                item.days_until === null
                                    ? 0
                                    : Math.max(
                                        0,
                                        Math.min(100, (item.days_until / maxDays) * 100)
                                    );

                            return (
                                <a
                                    key={item.id}
                                    href={`/funding/${item.id}`}
                                    title={`${item.title} | ${item.main_deadline_label}: ${formatDate(
                                        item.main_deadline
                                    )}`}
                                    className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-slate-950 ${getTimelineDotColor(
                                        item.urgency_group
                                    )}`}
                                    style={{ left: `calc(${leftPercent}% - 10px)` }}
                                />
                            );
                        })}
                    </div>

                    {timelineItems.length === 0 && (
                        <p className="mt-6 text-sm text-slate-400">
                            No upcoming deadlines in this time window.
                        </p>
                    )}

                    {timelineItems.length > 0 && (
                        <div className="mt-8 space-y-3">
                            {timelineItems.slice(0, 10).map((item) => (
                                <a
                                    key={item.id}
                                    href={`/funding/${item.id}`}
                                    className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-600 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {item.agency || "Agency not provided"} •{" "}
                                            {item.main_deadline_label}:{" "}
                                            {formatDate(item.main_deadline)}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 sm:justify-end">
                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs ${getUrgencyTone(
                                                item.urgency_group
                                            )}`}
                                        >
                                            {getUrgencyLabel(item.days_until)}
                                        </span>

                                        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                            Score: {item.latest_score?.total_score ?? "N/A"}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}

                    {timelineItems.length > 10 && (
                        <p className="mt-4 text-xs text-slate-500">
                            Showing first 10 upcoming deadlines in the timeline list. Full
                            list appears below by urgency group.
                        </p>
                    )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500" />
                        Overdue
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-400" />
                        0–14 days
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-yellow-400" />
                        15–45 days
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-blue-400" />
                        46–90 days
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-400" />
                        Later
                    </span>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Proposal Calendar"
                    description="View all funding calls by deadline urgency, eligibility, priority, fit score, and proposal status."
                    activePage="calendar"
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

                <div className="mb-6 grid gap-4 md:grid-cols-5">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Total Calls</p>
                        <p className="mt-2 text-3xl font-bold">{counts.total}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Overdue</p>
                        <p className="mt-2 text-3xl font-bold">{counts.overdue}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">0–14 Days</p>
                        <p className="mt-2 text-3xl font-bold">{counts.urgent}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">15–45 Days</p>
                        <p className="mt-2 text-3xl font-bold">{counts.soon}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">Active</p>
                        <p className="mt-2 text-3xl font-bold">{counts.active}</p>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="grid gap-4 lg:grid-cols-[1fr_260px_auto] lg:items-end">
                        <div>
                            <h2 className="text-xl font-semibold">Calendar Filter</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Focus on active opportunities, eligibility, or go/no-go decisions.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Filter
                            </label>
                            <select
                                value={filter}
                                onChange={(event) =>
                                    setFilter(event.target.value as CalendarFilter)
                                }
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                            >
                                <option value="all">All opportunities</option>
                                <option value="watch">Watch</option>
                                <option value="concept">Concept</option>
                                <option value="active">Active</option>
                                <option value="submitted">Submitted</option>
                                <option value="ignored">Ignored</option>
                                <option value="go">Go decision</option>
                                <option value="eligible">FIT/university eligible</option>
                                <option value="unknown_eligibility">
                                    Unknown eligibility
                                </option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={loadCalendarData}
                            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {renderMiniTimeline()}

                {loading && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
                        Loading proposal calendar...
                    </div>
                )}

                {!loading && (
                    <div className="space-y-6">
                        {renderGroup(
                            "Overdue",
                            "Deadlines that have already passed.",
                            groupedItems.overdue
                        )}

                        {renderGroup(
                            "Urgent, Due in 0–14 Days",
                            "These need immediate attention or a fast no-go decision.",
                            groupedItems.urgent
                        )}

                        {renderGroup(
                            "Soon, Due in 15–45 Days",
                            "These should be prioritized for concept notes, collaborator outreach, and internal routing.",
                            groupedItems.soon
                        )}

                        {renderGroup(
                            "Medium Term, Due in 46–90 Days",
                            "Good candidates for proposal planning and early team formation.",
                            groupedItems.medium
                        )}

                        {renderGroup(
                            "Later, Due After 90 Days",
                            "Useful for watchlist planning and preliminary data collection.",
                            groupedItems.later
                        )}

                        {renderGroup(
                            "No Deadline Recorded",
                            "These need deadline extraction or manual review.",
                            groupedItems.no_deadline
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}