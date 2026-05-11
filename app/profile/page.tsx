"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
    const [fullName, setFullName] = useState("");
    const [institution, setInstitution] = useState("");
    const [department, setDepartment] = useState("");
    const [careerStage, setCareerStage] = useState("");
    const [researchThemes, setResearchThemes] = useState("");
    const [coreMethods, setCoreMethods] = useState("");
    const [targetAgencies, setTargetAgencies] = useState("");
    const [proposalPriorities, setProposalPriorities] = useState("");

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSaveProfile() {
        setSaving(true);
        setMessage("");

        const { error } = await supabase.from("research_profiles").insert([
            {
                full_name: fullName,
                institution: institution,
                department: department,
                career_stage: careerStage,
                research_themes: researchThemes,
                core_methods: coreMethods,
                target_agencies: targetAgencies,
                proposal_priorities: proposalPriorities,
            },
        ]);

        if (error) {
            console.error("Error saving profile:", error);
            setMessage(`Error: ${error.message}`);
            setSaving(false);
            return;
        }

        setMessage("Profile saved successfully.");
        setSaving(false);
    }

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Research Profile"
                    description="Define your research identity so the agent can match funding calls, papers, awards, collaborators, and proposal priorities to your actual goals."
                    activePage="profile"
                />

                <form
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSaveProfile();
                    }}
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Full name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                placeholder="Kazi Monzure Khoda"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Institution
                            </label>
                            <input
                                type="text"
                                value={institution}
                                onChange={(event) => setInstitution(event.target.value)}
                                placeholder="South Dakota School of Mines and Technology"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Department
                            </label>
                            <input
                                type="text"
                                value={department}
                                onChange={(event) => setDepartment(event.target.value)}
                                placeholder="Chemical and Biological Engineering"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Career stage
                            </label>
                            <input
                                type="text"
                                value={careerStage}
                                onChange={(event) => setCareerStage(event.target.value)}
                                placeholder="Tenure-track assistant professor"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>
                    </div>

                    <div className="mt-6 grid gap-5">
                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Research themes
                            </label>
                            <textarea
                                rows={5}
                                value={researchThemes}
                                onChange={(event) => setResearchThemes(event.target.value)}
                                placeholder="Sustainable process design, hybrid mechanistic/data-driven modeling, agentic AI for industrial systems, blockchain-governed supply chains, critical minerals, CCUS, hydrogen, cold-chain resilience"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Separate items with commas or semicolons.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Core methods
                            </label>
                            <textarea
                                rows={4}
                                value={coreMethods}
                                onChange={(event) => setCoreMethods(event.target.value)}
                                placeholder="Process systems engineering, optimization, control, PINNs, LLM agents, RAG, blockchain, game theory, Aspen Plus, Pyomo"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Target agencies
                            </label>
                            <textarea
                                rows={4}
                                value={targetAgencies}
                                onChange={(event) => setTargetAgencies(event.target.value)}
                                placeholder="NSF, DOE, ARPA-E, USDA NIFA, DARPA, DoD, EPA, NASA, foundations, university seed grants"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">
                                Proposal priorities
                            </label>
                            <textarea
                                rows={5}
                                value={proposalPriorities}
                                onChange={(event) => setProposalPriorities(event.target.value)}
                                placeholder="Develop PI-led proposals, build preliminary data, identify collaborators, strengthen tenure portfolio, convert papers into proposals, track deadlines"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                            {message}
                        </div>
                    )}

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "Save Profile"}
                        </button>

                        <a
                            href="/dashboard"
                            className="rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                        >
                            Back to Dashboard
                        </a>
                    </div>
                </form>
            </section>
        </main>
    );
}