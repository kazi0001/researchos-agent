import Link from "next/link";
import AppHeader from "@/components/AppHeader";

const adminLinks = [
    {
        title: "Dashboard",
        description:
            "Review the full ResearchOS command center, including funding, awards, literature, tasks, and profile status.",
        href: "/dashboard",
    },
    {
        title: "Funding Radar",
        description:
            "Search, save, score, and manage research funding opportunities.",
        href: "/funding",
    },
    {
        title: "Award Intelligence",
        description:
            "Review prior funded awards and use them to strengthen proposal strategy.",
        href: "/awards",
    },
    {
        title: "Proposal Calendar",
        description:
            "Track deadlines, internal milestones, and proposal planning timelines.",
        href: "/calendar",
    },
    {
        title: "Literature Scout",
        description:
            "Manage papers, proposal-relevant literature, and review priorities.",
        href: "/literature",
    },
    {
        title: "Proposal Tasks",
        description:
            "Track proposal tasks, owners, due dates, priorities, and status.",
        href: "/tasks",
    },
    {
        title: "Research Profile",
        description:
            "Update your research themes, methods, agencies, and proposal priorities.",
        href: "/profile",
    },
];

export default function AdminPage() {
    return (
        <main className="theme-page px-5 py-8 sm:px-8">
            <section className="mx-auto max-w-7xl space-y-8 pt-16">
                <AppHeader
                    title="Admin"
                    description="Manage and navigate the main ResearchOS Agent modules from one place."
                    activePage="dashboard"
                />

                <section className="theme-card p-6 sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                            ResearchOS Modules
                        </h2>

                        <p className="mt-2 max-w-4xl text-base leading-7 text-[var(--muted-foreground)]">
                            Use this page as a simple control panel while the full app is being
                            refined. Each card opens one major workflow.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {adminLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="theme-card-soft block p-5 transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <h3 className="text-xl font-bold text-[var(--foreground)]">
                                    {item.title}
                                </h3>

                                <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                                    {item.description}
                                </p>

                                <div className="mt-5 inline-flex rounded-lg bg-[var(--primary)] px-4 py-2 text-base font-bold text-[var(--primary-foreground)]">
                                    Open
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </section>
        </main>
    );
}