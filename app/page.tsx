import Link from "next/link";

const coreModules = [
  {
    title: "Funding Radar",
    description:
      "Search, save, organize, and track research funding opportunities by agency, deadline, topic, status, and strategic fit.",
    href: "/funding",
  },
  {
    title: "Opportunity Analysis",
    description:
      "Convert a funding call into a structured proposal-readiness summary, including fit rationale, risks, alignment, and next actions.",
    href: "/funding",
  },
  {
    title: "Award Intelligence",
    description:
      "Review prior funded awards to understand what agencies have supported, how projects were framed, and where your proposal can align.",
    href: "/awards",
  },
  {
    title: "Literature Scout",
    description:
      "Track papers, identify proposal-relevant literature, and connect recent publications to active funding ideas.",
    href: "/literature",
  },
  {
    title: "Proposal Calendar",
    description:
      "Convert deadlines into planning timelines, internal milestones, and proposal preparation windows.",
    href: "/calendar",
  },
  {
    title: "Proposal Tasks",
    description:
      "Break proposal development into clear tasks with owners, due dates, priorities, and status tracking.",
    href: "/tasks",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Define research profile",
    description:
      "Capture your research themes, methods, target agencies, proposal priorities, and strategic direction.",
  },
  {
    step: "02",
    title: "Track opportunities",
    description:
      "Save funding calls and classify them as watch, concept, active, submitted, or ignored.",
  },
  {
    step: "03",
    title: "Analyze fit",
    description:
      "Score opportunities against your profile and identify the strongest proposal directions.",
  },
  {
    step: "04",
    title: "Connect evidence",
    description:
      "Use prior awards and literature signals to support proposal framing, novelty, and positioning.",
  },
  {
    step: "05",
    title: "Execute tasks",
    description:
      "Turn high-priority opportunities into concrete writing, budget, collaboration, and submission tasks.",
  },
];

export default function HomePage() {
  return (
    <main className="theme-page px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl space-y-10 pt-16">
        <section className="theme-card p-7 sm:p-10">
          <div className="max-w-5xl">
            <p className="mb-5 inline-flex rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-base font-bold text-[var(--foreground)]">
              ResearchOS Agent
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              An agentic AI workspace for research funding, proposal strategy,
              and academic productivity.
            </h1>

            <p className="mt-6 max-w-4xl text-lg leading-8 text-[var(--muted-foreground)]">
              ResearchOS Agent helps faculty members move from scattered funding
              searches, proposal notes, award records, literature signals, and
              task lists toward one structured research planning workflow.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/dashboard" className="theme-button-primary text-base">
                Open Dashboard
              </Link>

              <Link href="/funding" className="theme-button-secondary text-base">
                Open Funding Radar
              </Link>

              <Link href="/profile" className="theme-button-secondary text-base">
                Edit Research Profile
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="theme-card p-6">
            <p className="text-base font-semibold text-[var(--muted-foreground)]">
              Core Purpose
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-[var(--foreground)]">
              PI Support
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
              Built for research planning, proposal prioritization, and funding
              opportunity management.
            </p>
          </div>

          <div className="theme-card p-6">
            <p className="text-base font-semibold text-[var(--muted-foreground)]">
              Main Workflow
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-[var(--foreground)]">
              Funding to Tasks
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
              Move from funding discovery to proposal analysis, planning, and
              task execution.
            </p>
          </div>

          <div className="theme-card p-6">
            <p className="text-base font-semibold text-[var(--muted-foreground)]">
              Intelligence Layer
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-[var(--foreground)]">
              Awards + Papers
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
              Connect prior awards and literature signals to strengthen proposal
              strategy.
            </p>
          </div>

          <div className="theme-card p-6">
            <p className="text-base font-semibold text-[var(--muted-foreground)]">
              Design Goal
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-[var(--foreground)]">
              Traceable Decisions
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
              Organize research decisions with clearer rationale, evidence, and
              next actions.
            </p>
          </div>
        </section>

        <section className="theme-card p-7 sm:p-8">
          <div className="mb-7">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              Core Modules
            </h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--muted-foreground)]">
              Each module supports a different part of the faculty research
              workflow. Together, they create a practical research operating
              system for funding strategy and proposal execution.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {coreModules.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="theme-card-soft block p-5 transition hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="text-2xl font-bold text-[var(--foreground)]">
                  {module.title}
                </h3>

                <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                  {module.description}
                </p>

                <div className="mt-5 inline-flex rounded-lg bg-[var(--primary)] px-4 py-2 text-base font-bold text-[var(--primary-foreground)]">
                  Open
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="theme-card p-7 sm:p-8">
          <div className="mb-7">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              How the Workflow Works
            </h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--muted-foreground)]">
              The app is intended to be used as a weekly research command
              center. The workflow starts with your research profile and ends
              with proposal-ready tasks and planning decisions.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            {workflowSteps.map((item) => (
              <div key={item.step} className="theme-card-soft p-5">
                <p className="text-base font-extrabold text-[var(--primary)]">
                  {item.step}
                </p>

                <h3 className="mt-3 text-xl font-bold leading-snug text-[var(--foreground)]">
                  {item.title}
                </h3>

                <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="theme-card p-7 sm:p-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              Why this app matters
            </h2>

            <p className="mt-4 text-base leading-8 text-[var(--muted-foreground)]">
              Faculty research planning often happens across funding portals,
              spreadsheets, notes, PDFs, calendars, and scattered literature
              searches. ResearchOS Agent is built to reduce that fragmentation
              by connecting opportunity discovery, strategic fit, prior-award
              evidence, literature signals, deadlines, and task execution.
            </p>
          </div>

          <div className="theme-card p-7 sm:p-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              Current MVP scope
            </h2>

            <p className="mt-4 text-base leading-8 text-[var(--muted-foreground)]">
              This version is an evolving prototype. It focuses on practical
              faculty workflows: tracking opportunities, scoring proposal fit,
              reviewing prior awards, saving useful papers, organizing
              deadlines, and managing proposal tasks. The next stage is to
              refine the interface, improve automation, and make the workflow
              more seamless.
            </p>
          </div>
        </section>

        <section className="theme-card p-7 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                Start from the dashboard
              </h2>

              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                Use the dashboard as the main entry point for reviewing funding
                calls, prior awards, literature status, proposal tasks, and next
                actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard" className="theme-button-primary text-base">
                Open Dashboard
              </Link>

              <Link href="/admin" className="theme-button-secondary text-base">
                Open Admin
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}