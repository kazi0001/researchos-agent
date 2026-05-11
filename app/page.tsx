import Link from "next/link";

const features = [
  {
    title: "Funding Search",
    description:
      "Search and organize research funding opportunities by agency, topic, deadline, and strategic fit.",
    href: "/funding",
  },
  {
    title: "Opportunity Analysis",
    description:
      "Analyze a funding call and generate fit scores, research alignment, risks, and proposal direction.",
    href: "/funding",
  },
  {
    title: "Research Profile",
    description:
      "Maintain your research identity, keywords, collaborators, agencies, and proposal themes.",
    href: "/profile",
  },
  {
    title: "Research Planning",
    description:
      "Develop proposal ideas, project roadmaps, publication directions, and deadline-aware action plans.",
    href: "/research",
  },
];

export default function HomePage() {
  return (
    <main className="theme-page">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-20">
        <div className="mb-12 max-w-4xl">
          <p className="mb-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)]">
            ResearchOS Agent
          </p>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Agentic AI workspace for research funding, proposal strategy, and
            academic productivity.
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">
            ResearchOS Agent helps you identify funding opportunities, analyze
            proposal fit, organize research directions, and convert complex
            calls into actionable plans.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/funding"
              className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition hover:opacity-90"
            >
              Open Funding Dashboard
            </Link>

            <Link
              href="/profile"
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)]"
            >
              Edit Research Profile
            </Link>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="theme-card rounded-2xl p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="mb-3 text-lg font-semibold text-[var(--card-foreground)]">
                {feature.title}
              </h2>

              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <div className="theme-card rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-3 text-xl font-semibold text-[var(--card-foreground)]">
              What this MVP does now
            </h2>

            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              The current version is designed to support research funding
              discovery, opportunity review, profile-based matching, and
              proposal direction generation. The interface is now theme-aware,
              so you can switch between light mode and dark mode from the
              top-right button.
            </p>
          </div>

          <div className="theme-card rounded-2xl p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-[var(--card-foreground)]">
              Theme Test
            </h2>

            <p className="mb-4 text-sm leading-7 text-[var(--muted-foreground)]">
              Click the light/dark mode button. This card, background, text, and
              borders should visibly change.
            </p>

            <div className="theme-muted rounded-xl p-4 text-sm">
              Current colors come from CSS variables, not hard-coded black or
              white classes.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}