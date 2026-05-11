"use client";

import { useEffect, useState } from "react";
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

type TopFundingMatch = {
    id: string;
    opportunity_id: string;
    total_score: number | null;
    fit_reason: string | null;
    recommended_actions: string | null;
    suggested_title: string | null;
    created_at: string | null;
    funding_opportunities: {
        id: string;
        title: string;
        agency: string | null;
        program: string | null;
        deadline: string | null;
        award_amount: string | null;
        status: string | null;
        url: string | null;
        summary: string | null;
    } | null;
};

type UpcomingTask = {
    id: string;
    opportunity_id: string;
    task_title: string;
    task_description: string | null;
    owner: string | null;
    due_date: string | null;
    status: string | null;
    priority: string | null;
    created_at: string | null;
    funding_opportunities: {
        id: string;
        title: string;
        agency: string | null;
        program: string | null;
        deadline: string | null;
    } | null;
};

type FundingPipelineCounts = {
    watch: number;
    concept: number;
    active: number;
    submitted: number;
    ignored: number;
};

type LiteratureCounts = {
    total: number;
    saved: number;
    reading: number;
    cite: number;
    useInProposal: number;
    ignored: number;
};

type AwardCounts = {
    total: number;
    highRelevance: number;
    recent: number;
    nsf: number;
};

function SectionCard({
    title,
    description,
    actionHref,
    actionLabel,
    children,
}: {
    title: string;
    description?: string;
    actionHref?: string;
    actionLabel?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="theme-card p-6 sm:p-7">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--card-foreground)]">
                        {title}
                    </h2>

                    {description && (
                        <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                            {description}
                        </p>
                    )}
                </div>

                {actionHref && actionLabel && (
                    <a href={actionHref} className="theme-button-secondary shrink-0 text-base">
                        {actionLabel}
                    </a>
                )}
            </div>

            {children}
        </section>
    );
}

function MetricCard({
    href,
    label,
    value,
    helper,
}: {
    href: string;
    label: string;
    value: string | number;
    helper: string;
}) {
    return (
        <a
            href={href}
            className="theme-card p-6 transition hover:-translate-y-1 hover:shadow-lg"
        >
            <p className="text-base font-semibold text-[var(--muted-foreground)]">
                {label}
            </p>

            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
                {value}
            </h2>

            <p className="mt-3 text-base leading-6 text-[var(--muted-foreground)]">
                {helper}
            </p>
        </a>
    );
}

function MiniStatCard({
    href,
    label,
    value,
    helper,
}: {
    href: string;
    label: string;
    value: string | number;
    helper: string;
}) {
    return (
        <a
            href={href}
            className="theme-card-soft block p-5 transition hover:-translate-y-1 hover:shadow-md"
        >
            <p className="text-base font-semibold text-[var(--muted-foreground)]">
                {label}
            </p>

            <p className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
                {value}
            </p>

            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {helper}
            </p>
        </a>
    );
}

function ErrorMessage({
    label,
    message,
}: {
    label: string;
    message: string;
}) {
    return (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-base text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {label}: {message}
        </div>
    );
}

function DetailLine({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <p className="text-base leading-7 text-[var(--foreground)]">
            <span className="font-semibold text-[var(--muted-foreground)]">
                {label}:
            </span>{" "}
            {value}
        </p>
    );
}

export default function DashboardPage() {
    const [profile, setProfile] = useState<ResearchProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState("");

    const [fundingCount, setFundingCount] = useState(0);
    const [loadingFundingCount, setLoadingFundingCount] = useState(true);
    const [fundingError, setFundingError] = useState("");

    const [pipelineCounts, setPipelineCounts] = useState<FundingPipelineCounts>({
        watch: 0,
        concept: 0,
        active: 0,
        submitted: 0,
        ignored: 0,
    });
    const [loadingPipelineCounts, setLoadingPipelineCounts] = useState(true);
    const [pipelineError, setPipelineError] = useState("");

    const [fitScoreCount, setFitScoreCount] = useState(0);
    const [loadingFitScoreCount, setLoadingFitScoreCount] = useState(true);
    const [fitScoreError, setFitScoreError] = useState("");

    const [topMatch, setTopMatch] = useState<TopFundingMatch | null>(null);
    const [loadingTopMatch, setLoadingTopMatch] = useState(true);
    const [topMatchError, setTopMatchError] = useState("");

    const [openTaskCount, setOpenTaskCount] = useState(0);
    const [loadingOpenTaskCount, setLoadingOpenTaskCount] = useState(true);
    const [taskCountError, setTaskCountError] = useState("");

    const [upcomingTask, setUpcomingTask] = useState<UpcomingTask | null>(null);
    const [loadingUpcomingTask, setLoadingUpcomingTask] = useState(true);
    const [upcomingTaskError, setUpcomingTaskError] = useState("");

    const [literatureCounts, setLiteratureCounts] = useState<LiteratureCounts>({
        total: 0,
        saved: 0,
        reading: 0,
        cite: 0,
        useInProposal: 0,
        ignored: 0,
    });
    const [loadingLiteratureCounts, setLoadingLiteratureCounts] = useState(true);
    const [literatureError, setLiteratureError] = useState("");

    const [awardCounts, setAwardCounts] = useState<AwardCounts>({
        total: 0,
        highRelevance: 0,
        recent: 0,
        nsf: 0,
    });
    const [loadingAwardCounts, setLoadingAwardCounts] = useState(true);
    const [awardError, setAwardError] = useState("");

    useEffect(() => {
        loadProfile();
        loadFundingCount();
        loadPipelineCounts();
        loadFitScoreCount();
        loadTopMatch();
        loadOpenTaskCount();
        loadUpcomingTask();
        loadLiteratureCounts();
        loadAwardCounts();
    }, []);

    async function loadProfile() {
        setLoadingProfile(true);
        setProfileError("");

        const { data, error } = await supabase
            .from("research_profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error("Error loading profile:", error);

            if (error.code === "PGRST116") {
                setProfile(null);
            } else {
                setProfileError(error.message);
            }

            setLoadingProfile(false);
            return;
        }

        setProfile(data);
        setLoadingProfile(false);
    }

    async function loadFundingCount() {
        setLoadingFundingCount(true);
        setFundingError("");

        const { count, error } = await supabase
            .from("funding_opportunities")
            .select("*", { count: "exact", head: true });

        if (error) {
            console.error("Error loading funding count:", error);
            setFundingError(error.message);
            setLoadingFundingCount(false);
            return;
        }

        setFundingCount(count || 0);
        setLoadingFundingCount(false);
    }

    async function loadPipelineCounts() {
        setLoadingPipelineCounts(true);
        setPipelineError("");

        const { data, error } = await supabase
            .from("funding_opportunities")
            .select("status");

        if (error) {
            console.error("Error loading funding pipeline counts:", error);
            setPipelineError(error.message);
            setLoadingPipelineCounts(false);
            return;
        }

        const counts: FundingPipelineCounts = {
            watch: 0,
            concept: 0,
            active: 0,
            submitted: 0,
            ignored: 0,
        };

        (data || []).forEach((item) => {
            const status = item.status || "watch";

            if (status === "concept") {
                counts.concept += 1;
            } else if (status === "active") {
                counts.active += 1;
            } else if (status === "submitted") {
                counts.submitted += 1;
            } else if (status === "ignored") {
                counts.ignored += 1;
            } else {
                counts.watch += 1;
            }
        });

        setPipelineCounts(counts);
        setLoadingPipelineCounts(false);
    }

    async function loadFitScoreCount() {
        setLoadingFitScoreCount(true);
        setFitScoreError("");

        const { count, error } = await supabase
            .from("funding_matches")
            .select("*", { count: "exact", head: true });

        if (error) {
            console.error("Error loading fit score count:", error);
            setFitScoreError(error.message);
            setLoadingFitScoreCount(false);
            return;
        }

        setFitScoreCount(count || 0);
        setLoadingFitScoreCount(false);
    }

    async function loadTopMatch() {
        setLoadingTopMatch(true);
        setTopMatchError("");

        const { data, error } = await supabase
            .from("funding_matches")
            .select(
                `
        id,
        opportunity_id,
        total_score,
        fit_reason,
        recommended_actions,
        suggested_title,
        created_at,
        funding_opportunities (
          id,
          title,
          agency,
          program,
          deadline,
          award_amount,
          status,
          url,
          summary
        )
      `
            )
            .order("total_score", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Error loading top match:", error);

            if (error.code === "PGRST116") {
                setTopMatch(null);
            } else {
                setTopMatchError(error.message);
            }

            setLoadingTopMatch(false);
            return;
        }

        setTopMatch(data as TopFundingMatch | null);
        setLoadingTopMatch(false);
    }

    async function loadOpenTaskCount() {
        setLoadingOpenTaskCount(true);
        setTaskCountError("");

        const { count, error } = await supabase
            .from("proposal_tasks")
            .select("*", { count: "exact", head: true })
            .neq("status", "done");

        if (error) {
            console.error("Error loading open task count:", error);
            setTaskCountError(error.message);
            setLoadingOpenTaskCount(false);
            return;
        }

        setOpenTaskCount(count || 0);
        setLoadingOpenTaskCount(false);
    }

    async function loadUpcomingTask() {
        setLoadingUpcomingTask(true);
        setUpcomingTaskError("");

        const today = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
            .from("proposal_tasks")
            .select(
                `
        id,
        opportunity_id,
        task_title,
        task_description,
        owner,
        due_date,
        status,
        priority,
        created_at,
        funding_opportunities (
          id,
          title,
          agency,
          program,
          deadline
        )
      `
            )
            .neq("status", "done")
            .not("due_date", "is", null)
            .gte("due_date", today)
            .order("due_date", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Error loading upcoming task:", error);

            if (error.code === "PGRST116") {
                setUpcomingTask(null);
            } else {
                setUpcomingTaskError(error.message);
            }

            setLoadingUpcomingTask(false);
            return;
        }

        setUpcomingTask(data as UpcomingTask | null);
        setLoadingUpcomingTask(false);
    }

    async function loadLiteratureCounts() {
        setLoadingLiteratureCounts(true);
        setLiteratureError("");

        const { data, error } = await supabase.from("papers").select("paper_status");

        if (error) {
            console.error("Error loading literature counts:", error);
            setLiteratureError(error.message);
            setLoadingLiteratureCounts(false);
            return;
        }

        const counts: LiteratureCounts = {
            total: 0,
            saved: 0,
            reading: 0,
            cite: 0,
            useInProposal: 0,
            ignored: 0,
        };

        (data || []).forEach((paper) => {
            counts.total += 1;

            const status = paper.paper_status || "saved";

            if (status === "reading") {
                counts.reading += 1;
            } else if (status === "cite") {
                counts.cite += 1;
            } else if (status === "use_in_proposal") {
                counts.useInProposal += 1;
            } else if (status === "ignored") {
                counts.ignored += 1;
            } else {
                counts.saved += 1;
            }
        });

        setLiteratureCounts(counts);
        setLoadingLiteratureCounts(false);
    }

    async function loadAwardCounts() {
        setLoadingAwardCounts(true);
        setAwardError("");

        const { data, error } = await supabase
            .from("funded_awards")
            .select("source, relevance_score, award_year");

        if (error) {
            console.error("Error loading award counts:", error);
            setAwardError(error.message);
            setLoadingAwardCounts(false);
            return;
        }

        const currentYear = new Date().getFullYear();

        const counts: AwardCounts = {
            total: 0,
            highRelevance: 0,
            recent: 0,
            nsf: 0,
        };

        (data || []).forEach((award) => {
            counts.total += 1;

            if ((award.relevance_score || 0) >= 80) {
                counts.highRelevance += 1;
            }

            if ((award.award_year || 0) >= currentYear - 5) {
                counts.recent += 1;
            }

            if (award.source === "nsf") {
                counts.nsf += 1;
            }
        });

        setAwardCounts(counts);
        setLoadingAwardCounts(false);
    }

    function getScoreLabel(score: number | null) {
        if (!score) return "Not scored";
        if (score >= 85) return "Pursue now";
        if (score >= 70) return "Develop concept note";
        if (score >= 55) return "Watch or collaborate";
        return "Low priority";
    }

    function getDaysUntil(dateString: string | null) {
        if (!dateString) return null;

        const today = new Date();
        const targetDate = new Date(dateString);

        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        const diffMs = targetDate.getTime() - today.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    function getTaskUrgencyLabel(dateString: string | null) {
        const days = getDaysUntil(dateString);

        if (days === null) return "No due date";
        if (days < 0) return "Overdue";
        if (days === 0) return "Due today";
        if (days === 1) return "Due tomorrow";
        return `Due in ${days} days`;
    }

    const hasAnyError =
        fundingError ||
        pipelineError ||
        fitScoreError ||
        topMatchError ||
        taskCountError ||
        upcomingTaskError ||
        literatureError ||
        awardError;

    return (
        <main className="theme-page px-5 py-8 sm:px-8">
            <section className="mx-auto max-w-7xl space-y-8 pt-16">
                <AppHeader
                    title="Dashboard"
                    description="Your research command center for funding calls, award intelligence, literature signals, proposal tasks, and weekly strategic planning."
                    activePage="dashboard"
                />

                {hasAnyError && (
                    <div className="space-y-3">
                        {fundingError && (
                            <ErrorMessage
                                label="Error loading funding count"
                                message={fundingError}
                            />
                        )}

                        {pipelineError && (
                            <ErrorMessage
                                label="Error loading pipeline counts"
                                message={pipelineError}
                            />
                        )}

                        {fitScoreError && (
                            <ErrorMessage
                                label="Error loading fit score count"
                                message={fitScoreError}
                            />
                        )}

                        {topMatchError && (
                            <ErrorMessage label="Error loading top match" message={topMatchError} />
                        )}

                        {taskCountError && (
                            <ErrorMessage
                                label="Error loading task count"
                                message={taskCountError}
                            />
                        )}

                        {upcomingTaskError && (
                            <ErrorMessage
                                label="Error loading upcoming task"
                                message={upcomingTaskError}
                            />
                        )}

                        {literatureError && (
                            <ErrorMessage
                                label="Error loading literature counts"
                                message={literatureError}
                            />
                        )}

                        {awardError && (
                            <ErrorMessage label="Error loading award counts" message={awardError} />
                        )}
                    </div>
                )}

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        href="/funding"
                        label="Funding Calls"
                        value={loadingFundingCount ? "..." : fundingCount}
                        helper="Opportunities tracked so far"
                    />

                    <MetricCard
                        href="/awards"
                        label="Saved Awards"
                        value={loadingAwardCounts ? "..." : awardCounts.total}
                        helper="Award intelligence records"
                    />

                    <MetricCard
                        href={upcomingTask ? `/funding/${upcomingTask.opportunity_id}` : "/tasks"}
                        label="Proposal Tasks"
                        value={loadingOpenTaskCount ? "..." : openTaskCount}
                        helper="Open tasks in the pipeline"
                    />

                    <MetricCard
                        href="/literature"
                        label="Saved Papers"
                        value={loadingLiteratureCounts ? "..." : literatureCounts.total}
                        helper="Papers in Literature Scout"
                    />
                </div>

                <SectionCard
                    title="Award Intelligence"
                    description="Prior funded awards saved from NSF and future award sources."
                    actionHref="/awards"
                    actionLabel="Open Award Intelligence"
                >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MiniStatCard
                            href="/awards"
                            label="Saved Awards"
                            value={loadingAwardCounts ? "..." : awardCounts.total}
                            helper="Total library"
                        />

                        <MiniStatCard
                            href="/awards"
                            label="High Relevance"
                            value={loadingAwardCounts ? "..." : awardCounts.highRelevance}
                            helper="Score 80+"
                        />

                        <MiniStatCard
                            href="/awards"
                            label="Recent Awards"
                            value={loadingAwardCounts ? "..." : awardCounts.recent}
                            helper="Last 5 years"
                        />

                        <MiniStatCard
                            href="/awards"
                            label="NSF Awards"
                            value={loadingAwardCounts ? "..." : awardCounts.nsf}
                            helper="NSF source"
                        />
                    </div>
                </SectionCard>

                <SectionCard
                    title="Literature Scout"
                    description="Paper review status across your saved literature library."
                    actionHref="/literature"
                    actionLabel="Open Literature Scout"
                >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MiniStatCard
                            href="/literature"
                            label="Saved Papers"
                            value={loadingLiteratureCounts ? "..." : literatureCounts.total}
                            helper="Total library"
                        />

                        <MiniStatCard
                            href="/literature"
                            label="Reading"
                            value={loadingLiteratureCounts ? "..." : literatureCounts.reading}
                            helper="Under review"
                        />

                        <MiniStatCard
                            href="/literature"
                            label="Cite"
                            value={loadingLiteratureCounts ? "..." : literatureCounts.cite}
                            helper="For manuscripts"
                        />

                        <MiniStatCard
                            href="/literature"
                            label="Use in Proposal"
                            value={
                                loadingLiteratureCounts ? "..." : literatureCounts.useInProposal
                            }
                            helper="For grants"
                        />
                    </div>
                </SectionCard>

                <SectionCard
                    title="Funding Pipeline"
                    description="Status counts across your saved funding opportunities."
                    actionHref="/funding"
                    actionLabel="Open Funding Radar"
                >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <MiniStatCard
                            href="/funding?status=watch"
                            label="Watch"
                            value={loadingPipelineCounts ? "..." : pipelineCounts.watch}
                            helper="Monitor later"
                        />

                        <MiniStatCard
                            href="/funding?status=concept"
                            label="Concept"
                            value={loadingPipelineCounts ? "..." : pipelineCounts.concept}
                            helper="Idea stage"
                        />

                        <MiniStatCard
                            href="/funding?status=active"
                            label="Active"
                            value={loadingPipelineCounts ? "..." : pipelineCounts.active}
                            helper="In progress"
                        />

                        <MiniStatCard
                            href="/funding?status=submitted"
                            label="Submitted"
                            value={loadingPipelineCounts ? "..." : pipelineCounts.submitted}
                            helper="Completed"
                        />

                        <MiniStatCard
                            href="/funding?status=ignored"
                            label="Ignored"
                            value={loadingPipelineCounts ? "..." : pipelineCounts.ignored}
                            helper="Not pursuing"
                        />
                    </div>
                </SectionCard>

                <div className="grid gap-6 xl:grid-cols-2">
                    <SectionCard
                        title="Top Recommended Funding Call"
                        description="Highest-scoring opportunity based on your current fit score records."
                        actionHref="/funding"
                        actionLabel="View Funding Radar"
                    >
                        {loadingTopMatch && (
                            <p className="text-base text-[var(--muted-foreground)]">
                                Loading top match...
                            </p>
                        )}

                        {!loadingTopMatch && !topMatchError && !topMatch && (
                            <div className="theme-card-soft px-5 py-5 text-base leading-7">
                                No scored opportunities yet. Go to Funding Radar and click{" "}
                                <span className="font-semibold text-[var(--foreground)]">
                                    Score Fit
                                </span>{" "}
                                for one funding opportunity.
                            </div>
                        )}

                        {!loadingTopMatch && !topMatchError && topMatch && (
                            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
                                            Highest fit score
                                        </p>

                                        <h3 className="mt-2 text-2xl font-bold leading-snug">
                                            {topMatch.funding_opportunities?.title ||
                                                "Untitled opportunity"}
                                        </h3>

                                        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                                            {topMatch.funding_opportunities?.agency ||
                                                "Agency not provided"}
                                            {topMatch.funding_opportunities?.program
                                                ? ` • ${topMatch.funding_opportunities.program}`
                                                : ""}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-emerald-300 bg-white px-6 py-5 text-center dark:border-emerald-800 dark:bg-slate-950">
                                        <p className="text-base font-semibold text-[var(--muted-foreground)]">
                                            Fit Score
                                        </p>

                                        <p className="mt-1 text-5xl font-extrabold text-[var(--foreground)]">
                                            {topMatch.total_score ?? 0}
                                        </p>

                                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                            out of 100
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 md:grid-cols-3">
                                    <DetailLine
                                        label="Recommendation"
                                        value={getScoreLabel(topMatch.total_score)}
                                    />

                                    <DetailLine
                                        label="Deadline"
                                        value={
                                            topMatch.funding_opportunities?.deadline || "Not provided"
                                        }
                                    />

                                    <DetailLine
                                        label="Award"
                                        value={
                                            topMatch.funding_opportunities?.award_amount ||
                                            "Not provided"
                                        }
                                    />
                                </div>

                                {topMatch.recommended_actions && (
                                    <p className="mt-5 text-base leading-7 text-[var(--foreground)]">
                                        <span className="font-semibold">Recommended actions:</span>{" "}
                                        {topMatch.recommended_actions}
                                    </p>
                                )}

                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                    <a
                                        href={`/funding/${topMatch.opportunity_id}`}
                                        className="theme-button-primary text-base"
                                    >
                                        Open Details
                                    </a>

                                    {topMatch.funding_opportunities?.url && (
                                        <a
                                            href={topMatch.funding_opportunities.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="theme-button-secondary text-base"
                                        >
                                            Open funding page
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Nearest Proposal Task"
                        description="Earliest upcoming open task across all funding opportunities."
                        actionHref={
                            upcomingTask ? `/funding/${upcomingTask.opportunity_id}` : "/tasks"
                        }
                        actionLabel="View Tasks"
                    >
                        {loadingUpcomingTask && (
                            <p className="text-base text-[var(--muted-foreground)]">
                                Loading upcoming task...
                            </p>
                        )}

                        {!loadingUpcomingTask && !upcomingTaskError && !upcomingTask && (
                            <div className="theme-card-soft px-5 py-5 text-base leading-7">
                                No upcoming open task found. Generate proposal tasks from a funding
                                opportunity detail page.
                            </div>
                        )}

                        {!loadingUpcomingTask && !upcomingTaskError && upcomingTask && (
                            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-amber-700 dark:text-amber-300">
                                            {getTaskUrgencyLabel(upcomingTask.due_date)}
                                        </p>

                                        <h3 className="mt-2 text-2xl font-bold leading-snug">
                                            {upcomingTask.task_title}
                                        </h3>

                                        <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                                            {upcomingTask.funding_opportunities?.title ||
                                                "Funding opportunity not linked"}
                                        </p>
                                    </div>

                                    <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold capitalize text-[var(--foreground)]">
                                        {upcomingTask.status || "todo"}
                                    </span>
                                </div>

                                <div className="mt-6 grid gap-3 md:grid-cols-3">
                                    <DetailLine
                                        label="Due date"
                                        value={upcomingTask.due_date || "Not set"}
                                    />

                                    <DetailLine
                                        label="Owner"
                                        value={upcomingTask.owner || "Not assigned"}
                                    />

                                    <DetailLine
                                        label="Priority"
                                        value={upcomingTask.priority || "medium"}
                                    />
                                </div>

                                {upcomingTask.task_description && (
                                    <p className="mt-5 text-base leading-7 text-[var(--foreground)]">
                                        {upcomingTask.task_description}
                                    </p>
                                )}

                                <div className="mt-6">
                                    <a
                                        href={`/funding/${upcomingTask.opportunity_id}`}
                                        className="theme-button-primary text-base"
                                    >
                                        Open Task Page
                                    </a>
                                </div>
                            </div>
                        )}
                    </SectionCard>
                </div>

                <SectionCard
                    title="Research Profile"
                    description="This profile is used for funding fit scoring, literature scouting, award intelligence, and proposal strategy."
                    actionHref="/profile"
                    actionLabel="Edit Profile"
                >
                    {loadingProfile && (
                        <p className="text-base text-[var(--muted-foreground)]">
                            Loading profile...
                        </p>
                    )}

                    {profileError && (
                        <ErrorMessage label="Error loading profile" message={profileError} />
                    )}

                    {!loadingProfile && !profileError && !profile && (
                        <div className="theme-card-soft px-5 py-5 text-base leading-7">
                            No research profile found yet. Please create your profile first.
                        </div>
                    )}

                    {!loadingProfile && !profileError && profile && (
                        <div className="grid gap-5 lg:grid-cols-2">
                            <div className="theme-card-soft p-5">
                                <p className="theme-label">Full name</p>
                                <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">
                                    {profile.full_name || "Not provided"}
                                </h3>

                                <p className="mt-5 theme-label">Institution</p>
                                <p className="mt-2 text-base leading-7 text-[var(--foreground)]">
                                    {profile.institution || "Not provided"}
                                </p>

                                <p className="mt-5 theme-label">Department</p>
                                <p className="mt-2 text-base leading-7 text-[var(--foreground)]">
                                    {profile.department || "Not provided"}
                                </p>

                                <p className="mt-5 theme-label">Career stage</p>
                                <p className="mt-2 text-base leading-7 text-[var(--foreground)]">
                                    {profile.career_stage || "Not provided"}
                                </p>
                            </div>

                            <div className="theme-card-soft p-5">
                                <p className="theme-label">Target agencies</p>
                                <p className="mt-2 whitespace-pre-line text-base leading-7 text-[var(--foreground)]">
                                    {profile.target_agencies || "Not provided"}
                                </p>
                            </div>

                            <div className="theme-card-soft p-5 lg:col-span-2">
                                <p className="theme-label">Research themes</p>
                                <p className="mt-2 whitespace-pre-line text-base leading-7 text-[var(--foreground)]">
                                    {profile.research_themes || "Not provided"}
                                </p>
                            </div>

                            <div className="theme-card-soft p-5 lg:col-span-2">
                                <p className="theme-label">Core methods</p>
                                <p className="mt-2 whitespace-pre-line text-base leading-7 text-[var(--foreground)]">
                                    {profile.core_methods || "Not provided"}
                                </p>
                            </div>
                        </div>
                    )}
                </SectionCard>

                <div className="grid gap-6 xl:grid-cols-2">
                    <SectionCard title="Today’s Research Radar">
                        <div className="space-y-4 text-base leading-7 text-[var(--foreground)]">
                            <p>
                                • {loadingFundingCount ? "Loading" : fundingCount} funding{" "}
                                {fundingCount === 1 ? "call" : "calls"} tracked.
                            </p>

                            <p>
                                • Award intelligence:{" "}
                                {loadingAwardCounts ? "Loading" : awardCounts.total} saved awards,{" "}
                                {loadingAwardCounts ? "Loading" : awardCounts.highRelevance}{" "}
                                high-relevance.
                            </p>

                            <p>
                                • Active pipeline:{" "}
                                {loadingPipelineCounts ? "Loading" : pipelineCounts.active} active,{" "}
                                {loadingPipelineCounts ? "Loading" : pipelineCounts.concept} concept,{" "}
                                {loadingPipelineCounts ? "Loading" : pipelineCounts.watch} watch.
                            </p>

                            <p>
                                • {loadingFitScoreCount ? "Loading" : fitScoreCount} fit score{" "}
                                {fitScoreCount === 1 ? "record" : "records"} saved.
                            </p>

                            <p>
                                • {loadingOpenTaskCount ? "Loading" : openTaskCount} open proposal{" "}
                                {openTaskCount === 1 ? "task" : "tasks"}.
                            </p>

                            <p>
                                • Literature library:{" "}
                                {loadingLiteratureCounts ? "Loading" : literatureCounts.total} saved
                                papers,{" "}
                                {loadingLiteratureCounts
                                    ? "Loading"
                                    : literatureCounts.useInProposal}{" "}
                                marked for proposal use.
                            </p>

                            <p>
                                • Nearest task: {upcomingTask?.task_title || "not available yet"}.
                            </p>
                        </div>
                    </SectionCard>

                    <SectionCard title="Recommended Next Action">
                        <p className="text-base leading-8 text-[var(--foreground)]">
                            {awardCounts.highRelevance > 0
                                ? "You have high-relevance prior awards. Review their abstracts and strategic lessons to strengthen proposal framing."
                                : literatureCounts.useInProposal > 0
                                    ? "You have papers marked for proposal use. The next step is to connect literature evidence to proposal concepts."
                                    : pipelineCounts.active > 0
                                        ? "You have active funding opportunities. The next step is to identify prior awards and papers that support those active proposals."
                                        : pipelineCounts.concept > 0
                                            ? "You have concept-stage opportunities. The next step is to search NSF awards and literature that support each concept."
                                            : "Move one high-fit opportunity from Watch to Concept or Active, then use Award Intelligence and Literature Scout to gather supporting evidence."}
                        </p>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <a href="/awards" className="theme-button-primary text-base">
                                Open Award Intelligence
                            </a>

                            <a href="/funding" className="theme-button-secondary text-base">
                                Open Funding Radar
                            </a>

                            <a href="/literature" className="theme-button-secondary text-base">
                                Open Literature Scout
                            </a>
                        </div>
                    </SectionCard>
                </div>
            </section>
        </main>
    );
}