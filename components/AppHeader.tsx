"use client";

import Link from "next/link";

type ActivePage =
    | "dashboard"
    | "funding"
    | "awards"
    | "calendar"
    | "tasks"
    | "profile"
    | "literature";

type AppHeaderProps = {
    title: string;
    description: string;
    activePage?: ActivePage;
};

const links: {
    label: string;
    href: string;
    key: ActivePage;
}[] = [
        {
            label: "Dashboard",
            href: "/dashboard",
            key: "dashboard",
        },
        {
            label: "Funding Radar",
            href: "/funding",
            key: "funding",
        },
        {
            label: "Award Intelligence",
            href: "/awards",
            key: "awards",
        },
        {
            label: "Proposal Calendar",
            href: "/calendar",
            key: "calendar",
        },
        {
            label: "Literature Scout",
            href: "/literature",
            key: "literature",
        },
        {
            label: "Proposal Tasks",
            href: "/tasks",
            key: "tasks",
        },
        {
            label: "Research Profile",
            href: "/profile",
            key: "profile",
        },
    ];

export default function AppHeader({
    title,
    description,
    activePage = "dashboard",
}: AppHeaderProps) {
    return (
        <header className="mb-10 space-y-6">
            <section className="theme-card p-6 sm:p-8">
                <a
                    href="/"
                    className="mb-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-base font-bold text-[var(--foreground)] transition hover:bg-[var(--card)]"
                >
                    ResearchOS Agent
                </a>

                <h1 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl">
                    {title}
                </h1>

                <p className="mt-4 max-w-5xl text-lg leading-8 text-[var(--muted-foreground)]">
                    {description}
                </p>
            </section>

            <nav aria-label="Main navigation" className="theme-card p-4 sm:p-5">
                <div className="flex flex-wrap gap-3">
                    {links.map((link) => {
                        const isActive = activePage === link.key;

                        return (
                            <Link
                                key={link.key}
                                href={link.href}
                                aria-current={isActive ? "page" : undefined}
                                className={[
                                    "rounded-full border px-6 py-3 text-base font-extrabold leading-none shadow-sm transition",
                                    "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
                                    isActive
                                        ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                                        : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--muted)]",
                                ].join(" ")}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </header>
    );
}