"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

type TaskStatus = "todo" | "in_progress" | "done" | "blocked" | string;
type TaskPriority = "low" | "medium" | "high" | "urgent" | string;

type FundingOpportunity = {
    id: string;
    title: string;
    agency: string | null;
    program: string | null;
    deadline: string | null;
};

type ProposalTask = {
    id: string;
    opportunity_id: string;
    task_title: string;
    task_description: string | null;
    owner: string | null;
    due_date: string | null;
    status: TaskStatus | null;
    priority: TaskPriority | null;
    created_at: string | null;
    funding_opportunities: FundingOpportunity | null;
};

type RawProposalTask = Omit<ProposalTask, "funding_opportunities"> & {
    funding_opportunities: FundingOpportunity | FundingOpportunity[] | null;
};

const statusOptions = [
    { label: "All", value: "all" },
    { label: "To Do", value: "todo" },
    { label: "In Progress", value: "in_progress" },
    { label: "Blocked", value: "blocked" },
    { label: "Done", value: "done" },
];

const priorityOptions = [
    { label: "All", value: "all" },
    { label: "Urgent", value: "urgent" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
];

function normalizeTask(task: RawProposalTask): ProposalTask {
    return {
        ...task,
        funding_opportunities: Array.isArray(task.funding_opportunities)
            ? task.funding_opportunities[0] || null
            : task.funding_opportunities,
    };
}

function formatStatus(status: string | null) {
    if (!status) return "To Do";

    return status
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPriority(priority: string | null) {
    if (!priority) return "Medium";

    return priority
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function getDueLabel(dateString: string | null) {
    const days = getDaysUntil(dateString);

    if (days === null) return "No due date";
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";

    return `Due in ${days} days`;
}

function getDueBadgeClass(dateString: string | null, status: string | null) {
    if (status === "done") {
        return "border-emerald-300 bg-emerald-50 text-emerald-800";
    }

    const days = getDaysUntil(dateString);

    if (days === null) {
        return "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]";
    }

    if (days < 0) {
        return "border-red-300 bg-red-50 text-red-800";
    }

    if (days <= 3) {
        return "border-amber-300 bg-amber-50 text-amber-800";
    }

    return "border-emerald-300 bg-emerald-50 text-emerald-800";
}

function getPriorityBadgeClass(priority: string | null) {
    if (priority === "urgent") {
        return "border-red-300 bg-red-50 text-red-800";
    }

    if (priority === "high") {
        return "border-amber-300 bg-amber-50 text-amber-800";
    }

    if (priority === "low") {
        return "border-slate-300 bg-slate-50 text-slate-700";
    }

    return "border-blue-300 bg-blue-50 text-blue-800";
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<ProposalTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {
        setLoading(true);
        setError("");

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
            .order("due_date", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading tasks:", error);
            setError(error.message);
            setLoading(false);
            return;
        }

        const normalizedTasks: ProposalTask[] = ((data || []) as RawProposalTask[]).map(
            normalizeTask
        );

        setTasks(normalizedTasks);
        setLoading(false);
    }

    async function updateTaskStatus(taskId: string, nextStatus: string) {
        setSavingTaskId(taskId);
        setError("");

        const { error } = await supabase
            .from("proposal_tasks")
            .update({ status: nextStatus })
            .eq("id", taskId);

        if (error) {
            console.error("Error updating task status:", error);
            setError(error.message);
            setSavingTaskId(null);
            return;
        }

        setTasks((currentTasks) =>
            currentTasks.map((task) =>
                task.id === taskId ? { ...task, status: nextStatus } : task
            )
        );

        setSavingTaskId(null);
    }

    const filteredTasks = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();

        return tasks.filter((task) => {
            const status = task.status || "todo";
            const priority = task.priority || "medium";

            const matchesStatus =
                statusFilter === "all" || status === statusFilter;

            const matchesPriority =
                priorityFilter === "all" || priority === priorityFilter;

            const searchableText = [
                task.task_title,
                task.task_description,
                task.owner,
                task.funding_opportunities?.title,
                task.funding_opportunities?.agency,
                task.funding_opportunities?.program,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                normalizedSearch.length === 0 ||
                searchableText.includes(normalizedSearch);

            return matchesStatus && matchesPriority && matchesSearch;
        });
    }, [tasks, statusFilter, priorityFilter, searchText]);

    const openTasks = tasks.filter((task) => task.status !== "done").length;
    const doneTasks = tasks.filter((task) => task.status === "done").length;
    const overdueTasks = tasks.filter((task) => {
        const days = getDaysUntil(task.due_date);
        return task.status !== "done" && days !== null && days < 0;
    }).length;
    const urgentTasks = tasks.filter(
        (task) => task.priority === "urgent" || task.priority === "high"
    ).length;

    return (
        <main className="theme-page px-5 py-8 sm:px-8">
            <section className="mx-auto max-w-7xl space-y-8 pt-16">
                <AppHeader
                    title="Proposal Tasks"
                    description="Track proposal actions, owners, due dates, priorities, and task status across your funding pipeline."
                    activePage="tasks"
                />

                {error && (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-base leading-7 text-red-800">
                        {error}
                    </div>
                )}

                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="theme-card p-6">
                        <p className="text-base font-semibold text-[var(--muted-foreground)]">
                            Total Tasks
                        </p>
                        <p className="mt-3 text-4xl font-extrabold text-[var(--foreground)]">
                            {loading ? "..." : tasks.length}
                        </p>
                        <p className="mt-2 text-base text-[var(--muted-foreground)]">
                            All proposal tasks
                        </p>
                    </div>

                    <div className="theme-card p-6">
                        <p className="text-base font-semibold text-[var(--muted-foreground)]">
                            Open Tasks
                        </p>
                        <p className="mt-3 text-4xl font-extrabold text-[var(--foreground)]">
                            {loading ? "..." : openTasks}
                        </p>
                        <p className="mt-2 text-base text-[var(--muted-foreground)]">
                            Still need action
                        </p>
                    </div>

                    <div className="theme-card p-6">
                        <p className="text-base font-semibold text-[var(--muted-foreground)]">
                            Overdue
                        </p>
                        <p className="mt-3 text-4xl font-extrabold text-[var(--foreground)]">
                            {loading ? "..." : overdueTasks}
                        </p>
                        <p className="mt-2 text-base text-[var(--muted-foreground)]">
                            Past due date
                        </p>
                    </div>

                    <div className="theme-card p-6">
                        <p className="text-base font-semibold text-[var(--muted-foreground)]">
                            High Priority
                        </p>
                        <p className="mt-3 text-4xl font-extrabold text-[var(--foreground)]">
                            {loading ? "..." : urgentTasks}
                        </p>
                        <p className="mt-2 text-base text-[var(--muted-foreground)]">
                            Urgent or high
                        </p>
                    </div>
                </section>

                <section className="theme-card p-6 sm:p-7">
                    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                                Task Workspace
                            </h2>
                            <p className="mt-2 max-w-4xl text-base leading-7 text-[var(--muted-foreground)]">
                                Use filters to focus on immediate proposal actions. No information
                                is removed; the layout is organized for easier scanning.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadTasks}
                            className="theme-button-secondary text-base"
                        >
                            Refresh Tasks
                        </button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-base font-semibold text-[var(--foreground)]">
                                Search
                            </label>
                            <input
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search task, owner, agency, or opportunity..."
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-base font-semibold text-[var(--foreground)]">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="w-full"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-base font-semibold text-[var(--foreground)]">
                                Priority
                            </label>
                            <select
                                value={priorityFilter}
                                onChange={(event) => setPriorityFilter(event.target.value)}
                                className="w-full"
                            >
                                {priorityOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="space-y-5">
                    {loading && (
                        <div className="theme-card p-6 text-base text-[var(--muted-foreground)]">
                            Loading proposal tasks...
                        </div>
                    )}

                    {!loading && filteredTasks.length === 0 && (
                        <div className="theme-card p-6 text-base leading-7 text-[var(--muted-foreground)]">
                            No tasks match the current filters. Try changing the status,
                            priority, or search text.
                        </div>
                    )}

                    {!loading &&
                        filteredTasks.map((task) => {
                            const dueBadgeClass = getDueBadgeClass(task.due_date, task.status);
                            const priorityBadgeClass = getPriorityBadgeClass(task.priority);

                            return (
                                <article key={task.id} className="theme-card p-6 sm:p-7">
                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="max-w-4xl">
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${dueBadgeClass}`}
                                                >
                                                    {getDueLabel(task.due_date)}
                                                </span>

                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${priorityBadgeClass}`}
                                                >
                                                    {formatPriority(task.priority)}
                                                </span>

                                                <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-sm font-bold text-[var(--foreground)]">
                                                    {formatStatus(task.status)}
                                                </span>
                                            </div>

                                            <h2 className="text-2xl font-bold leading-snug text-[var(--foreground)]">
                                                {task.task_title}
                                            </h2>

                                            {task.task_description && (
                                                <p className="mt-3 text-base leading-8 text-[var(--muted-foreground)]">
                                                    {task.task_description}
                                                </p>
                                            )}

                                            <div className="mt-5 grid gap-3 text-base leading-7 md:grid-cols-2">
                                                <p className="text-[var(--foreground)]">
                                                    <span className="font-semibold text-[var(--muted-foreground)]">
                                                        Owner:
                                                    </span>{" "}
                                                    {task.owner || "Not assigned"}
                                                </p>

                                                <p className="text-[var(--foreground)]">
                                                    <span className="font-semibold text-[var(--muted-foreground)]">
                                                        Due date:
                                                    </span>{" "}
                                                    {task.due_date || "Not set"}
                                                </p>

                                                <p className="text-[var(--foreground)]">
                                                    <span className="font-semibold text-[var(--muted-foreground)]">
                                                        Agency:
                                                    </span>{" "}
                                                    {task.funding_opportunities?.agency || "Not provided"}
                                                </p>

                                                <p className="text-[var(--foreground)]">
                                                    <span className="font-semibold text-[var(--muted-foreground)]">
                                                        Program:
                                                    </span>{" "}
                                                    {task.funding_opportunities?.program || "Not provided"}
                                                </p>
                                            </div>

                                            <div className="mt-5 theme-card-soft p-4">
                                                <p className="text-sm font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                                                    Linked funding opportunity
                                                </p>

                                                <p className="mt-2 text-base font-semibold leading-7 text-[var(--foreground)]">
                                                    {task.funding_opportunities?.title ||
                                                        "Funding opportunity not linked"}
                                                </p>

                                                {task.funding_opportunities?.deadline && (
                                                    <p className="mt-1 text-base text-[var(--muted-foreground)]">
                                                        Opportunity deadline:{" "}
                                                        {task.funding_opportunities.deadline}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex w-full flex-col gap-3 xl:w-64">
                                            <label className="text-base font-semibold text-[var(--foreground)]">
                                                Update status
                                            </label>

                                            <select
                                                value={task.status || "todo"}
                                                onChange={(event) =>
                                                    updateTaskStatus(task.id, event.target.value)
                                                }
                                                disabled={savingTaskId === task.id}
                                                className="w-full"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="blocked">Blocked</option>
                                                <option value="done">Done</option>
                                            </select>

                                            <a
                                                href={`/funding/${task.opportunity_id}`}
                                                className="theme-button-primary text-base"
                                            >
                                                Open Opportunity
                                            </a>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                </section>

                {!loading && tasks.length > 0 && (
                    <section className="theme-card p-6 sm:p-7">
                        <h2 className="text-2xl font-bold text-[var(--foreground)]">
                            Summary
                        </h2>

                        <p className="mt-3 text-base leading-8 text-[var(--muted-foreground)]">
                            You currently have {tasks.length} total proposal tasks, {openTasks}{" "}
                            open tasks, {doneTasks} completed tasks, {overdueTasks} overdue
                            tasks, and {urgentTasks} high-priority tasks.
                        </p>
                    </section>
                )}
            </section>
        </main>
    );
}