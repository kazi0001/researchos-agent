"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

type ProposalTask = {
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

type TaskFilter = "all" | "todo" | "in_progress" | "done" | "blocked";

export default function TasksPage() {
    const [tasks, setTasks] = useState<ProposalTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<TaskFilter>("all");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {
        setLoading(true);
        setMessage("");
        setErrorMessage("");

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
            .order("due_date", { ascending: true });

        if (error) {
            console.error("Error loading proposal tasks:", error);
            setErrorMessage(error.message);
            setLoading(false);
            return;
        }

        setTasks((data || []) as ProposalTask[]);
        setLoading(false);
    }

    async function handleUpdateTaskStatus(taskId: string, newStatus: string) {
        setMessage("");
        setErrorMessage("");

        const { error } = await supabase
            .from("proposal_tasks")
            .update({ status: newStatus })
            .eq("id", taskId);

        if (error) {
            console.error("Error updating task status:", error);
            setErrorMessage(error.message);
            return;
        }

        setTasks((currentTasks) =>
            currentTasks.map((task) =>
                task.id === taskId ? { ...task, status: newStatus } : task
            )
        );

        setMessage("Task status updated.");
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
        if (days < 0) {
            return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"
                }`;
        }
        if (days === 0) return "Due today";
        if (days === 1) return "Due tomorrow";
        return `Due in ${days} days`;
    }

    function getStatusLabel(status: string | null) {
        if (status === "in_progress") return "In progress";
        if (status === "done") return "Done";
        if (status === "blocked") return "Blocked";
        return "Todo";
    }

    const filteredTasks = useMemo(() => {
        if (filter === "all") return tasks;
        return tasks.filter((task) => (task.status || "todo") === filter);
    }, [tasks, filter]);

    const counts = useMemo(() => {
        return {
            all: tasks.length,
            todo: tasks.filter((task) => (task.status || "todo") === "todo").length,
            in_progress: tasks.filter((task) => task.status === "in_progress").length,
            done: tasks.filter((task) => task.status === "done").length,
            blocked: tasks.filter((task) => task.status === "blocked").length,
        };
    }, [tasks]);

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Proposal Tasks"
                    description="Track proposal preparation tasks across all funding opportunities, including concept notes, collaborators, literature review, budget, compliance, and final review."
                    activePage="tasks"
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
                    <button
                        type="button"
                        onClick={() => setFilter("all")}
                        className={`rounded-2xl border p-4 text-left transition ${filter === "all"
                                ? "border-white bg-white text-slate-950"
                                : "border-slate-800 bg-slate-900 text-white hover:border-slate-600"
                            }`}
                    >
                        <p className="text-sm opacity-80">All</p>
                        <p className="mt-2 text-3xl font-bold">{counts.all}</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setFilter("todo")}
                        className={`rounded-2xl border p-4 text-left transition ${filter === "todo"
                                ? "border-white bg-white text-slate-950"
                                : "border-slate-800 bg-slate-900 text-white hover:border-slate-600"
                            }`}
                    >
                        <p className="text-sm opacity-80">Todo</p>
                        <p className="mt-2 text-3xl font-bold">{counts.todo}</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setFilter("in_progress")}
                        className={`rounded-2xl border p-4 text-left transition ${filter === "in_progress"
                                ? "border-white bg-white text-slate-950"
                                : "border-slate-800 bg-slate-900 text-white hover:border-slate-600"
                            }`}
                    >
                        <p className="text-sm opacity-80">In progress</p>
                        <p className="mt-2 text-3xl font-bold">{counts.in_progress}</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setFilter("done")}
                        className={`rounded-2xl border p-4 text-left transition ${filter === "done"
                                ? "border-white bg-white text-slate-950"
                                : "border-slate-800 bg-slate-900 text-white hover:border-slate-600"
                            }`}
                    >
                        <p className="text-sm opacity-80">Done</p>
                        <p className="mt-2 text-3xl font-bold">{counts.done}</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setFilter("blocked")}
                        className={`rounded-2xl border p-4 text-left transition ${filter === "blocked"
                                ? "border-white bg-white text-slate-950"
                                : "border-slate-800 bg-slate-900 text-white hover:border-slate-600"
                            }`}
                    >
                        <p className="text-sm opacity-80">Blocked</p>
                        <p className="mt-2 text-3xl font-bold">{counts.blocked}</p>
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">
                                {filter === "all"
                                    ? "All Proposal Tasks"
                                    : `${getStatusLabel(filter)} Tasks`}
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Showing {filteredTasks.length} task
                                {filteredTasks.length === 1 ? "" : "s"}.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadTasks}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                        >
                            Refresh
                        </button>
                    </div>

                    {loading && (
                        <p className="text-sm text-slate-400">Loading proposal tasks...</p>
                    )}

                    {!loading && tasks.length === 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                            No proposal tasks found yet. Open a funding opportunity detail page
                            and click Generate Proposal Tasks.
                        </div>
                    )}

                    {!loading && tasks.length > 0 && filteredTasks.length === 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                            No tasks found for this filter.
                        </div>
                    )}

                    {!loading && filteredTasks.length > 0 && (
                        <div className="space-y-4">
                            {filteredTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500">
                                                {task.funding_opportunities?.agency ||
                                                    "Agency not provided"}
                                                {task.funding_opportunities?.program
                                                    ? ` • ${task.funding_opportunities.program}`
                                                    : ""}
                                            </p>

                                            <h3 className="mt-2 text-lg font-semibold">
                                                {task.task_title}
                                            </h3>

                                            <p className="mt-2 text-sm text-slate-400">
                                                {task.funding_opportunities?.title ||
                                                    "Funding opportunity not linked"}
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                                            <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300">
                                                {task.priority || "medium"} priority
                                            </span>

                                            <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                {getDueLabel(task.due_date)}
                                            </span>
                                        </div>
                                    </div>

                                    {task.task_description && (
                                        <p className="mt-4 text-sm leading-6 text-slate-300">
                                            {task.task_description}
                                        </p>
                                    )}

                                    <div className="mt-5 grid gap-4 text-sm text-slate-300 md:grid-cols-4">
                                        <p>
                                            <span className="text-slate-500">Owner:</span>{" "}
                                            {task.owner || "Not assigned"}
                                        </p>

                                        <p>
                                            <span className="text-slate-500">Due:</span>{" "}
                                            {task.due_date || "Not set"}
                                        </p>

                                        <p>
                                            <span className="text-slate-500">Proposal deadline:</span>{" "}
                                            {task.funding_opportunities?.deadline || "Not provided"}
                                        </p>

                                        <div>
                                            <label className="text-slate-500">Status:</label>
                                            <select
                                                value={task.status || "todo"}
                                                onChange={(event) =>
                                                    handleUpdateTaskStatus(task.id, event.target.value)
                                                }
                                                className="ml-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white outline-none"
                                            >
                                                <option value="todo">Todo</option>
                                                <option value="in_progress">In progress</option>
                                                <option value="done">Done</option>
                                                <option value="blocked">Blocked</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                        <a
                                            href={`/funding/${task.opportunity_id}`}
                                            className="rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                                        >
                                            Open Funding Detail
                                        </a>

                                        <a
                                            href="/funding"
                                            className="rounded-xl border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                        >
                                            Funding Radar
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}