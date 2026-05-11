import { NextResponse } from "next/server";

type ResearchProfile = {
    full_name?: string | null;
    institution?: string | null;
    department?: string | null;
    career_stage?: string | null;
    research_themes?: string | null;
    core_methods?: string | null;
    target_agencies?: string | null;
    proposal_priorities?: string | null;
};

type FundingOpportunity = {
    id?: string;
    source?: string | null;
    source_id?: string | null;
    title?: string | null;
    agency?: string | null;
    program?: string | null;
    url?: string | null;
    deadline?: string | null;
    award_amount?: string | null;
    eligibility?: string | null;
    summary?: string | null;
    full_text?: string | null;
    status?: string | null;
};

type ScoreRequestBody = {
    profile?: ResearchProfile;
    opportunity?: FundingOpportunity;
    scoringMode?: "auto" | "rule_based" | "llm";
};

type FitScore = {
    total_score: number;
    pi_alignment: number;
    agency_fit: number;
    novelty: number;
    preliminary_data_readiness: number;
    team_readiness: number;
    budget_scope_feasibility: number;
    deadline_feasibility: number;
    tenure_strategy_value: number;
    fit_reason: string;
    risks: string;
    recommended_actions: string;
    suggested_title: string;
    likely_framing: string;
    required_collaborators: string;
    scoring_method: string;
};

function containsAny(text: string, keywords: string[]) {
    const lowerText = text.toLowerCase();
    return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}

function estimateDeadlineScore(deadline: string | null | undefined) {
    if (!deadline) return 3;

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (Number.isNaN(deadlineDate.getTime())) return 3;
    if (diffDays < 0) return 0;
    if (diffDays < 14) return 2;
    if (diffDays < 45) return 4;
    return 5;
}

function getScoreBand(totalScore: number) {
    if (totalScore >= 85) return "Pursue now";
    if (totalScore >= 70) return "Develop concept note";
    if (totalScore >= 55) return "Watch or collaborate";
    return "Low priority";
}

function clampScore(value: unknown, min: number, max: number) {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
        return min;
    }

    return Math.max(min, Math.min(max, Math.round(numberValue)));
}

function normalizeScore(score: Partial<FitScore>, method: string): FitScore {
    const piAlignment = clampScore(score.pi_alignment, 0, 20);
    const agencyFit = clampScore(score.agency_fit, 0, 20);
    const novelty = clampScore(score.novelty, 0, 15);
    const preliminaryDataReadiness = clampScore(
        score.preliminary_data_readiness,
        0,
        15
    );
    const teamReadiness = clampScore(score.team_readiness, 0, 10);
    const budgetScopeFeasibility = clampScore(
        score.budget_scope_feasibility,
        0,
        10
    );
    const deadlineFeasibility = clampScore(score.deadline_feasibility, 0, 5);
    const tenureStrategyValue = clampScore(score.tenure_strategy_value, 0, 5);

    const totalScore =
        piAlignment +
        agencyFit +
        novelty +
        preliminaryDataReadiness +
        teamReadiness +
        budgetScopeFeasibility +
        deadlineFeasibility +
        tenureStrategyValue;

    return {
        total_score: totalScore,
        pi_alignment: piAlignment,
        agency_fit: agencyFit,
        novelty,
        preliminary_data_readiness: preliminaryDataReadiness,
        team_readiness: teamReadiness,
        budget_scope_feasibility: budgetScopeFeasibility,
        deadline_feasibility: deadlineFeasibility,
        tenure_strategy_value: tenureStrategyValue,
        fit_reason:
            score.fit_reason ||
            `This opportunity was scored using ${method}. Current recommendation: ${getScoreBand(
                totalScore
            )}.`,
        risks:
            score.risks ||
            "The opportunity may require additional collaborators, solicitation details may change the final fit, and internal routing timing should be checked.",
        recommended_actions:
            score.recommended_actions ||
            "Draft a short concept note, verify eligibility, identify collaborators, and collect related papers and funded award examples.",
        suggested_title:
            score.suggested_title || "ResearchOS concept for selected opportunity",
        likely_framing:
            score.likely_framing ||
            "Frame the proposal around a technically credible research gap, clear validation plan, and strong agency fit.",
        required_collaborators:
            score.required_collaborators ||
            "Potential collaborators should be selected based on the final technical scope.",
        scoring_method: method,
    };
}

function generateRuleBasedFitScore(
    profile: ResearchProfile,
    opportunity: FundingOpportunity
): FitScore {
    const opportunityText = [
        opportunity.title,
        opportunity.agency,
        opportunity.program,
        opportunity.summary,
        opportunity.eligibility,
        opportunity.award_amount,
        opportunity.full_text,
    ]
        .filter(Boolean)
        .join(" ");

    const profileText = [
        profile.research_themes,
        profile.core_methods,
        profile.target_agencies,
        profile.proposal_priorities,
    ]
        .filter(Boolean)
        .join(" ");

    const combinedText = `${opportunityText} ${profileText}`;

    let piAlignment = 10;
    if (
        containsAny(opportunityText, [
            "process",
            "chemical",
            "manufacturing",
            "cyber-physical",
            "cyber physical",
            "ai",
            "artificial intelligence",
            "machine learning",
            "autonomous",
            "optimization",
            "control",
            "hydrogen",
            "carbon capture",
            "critical minerals",
            "supply chain",
            "cold chain",
            "energy",
            "resilience",
            "data center",
            "materials",
            "digital twin",
        ])
    ) {
        piAlignment = 18;
    }

    if (
        containsAny(opportunityText, [
            "process systems",
            "physics-informed",
            "agentic",
            "large language model",
            "llm",
            "blockchain",
            "game theory",
            "ccus",
        ])
    ) {
        piAlignment = 20;
    }

    let agencyFit = 10;
    if (
        containsAny(opportunity.agency || "", [
            "NSF",
            "DOE",
            "ARPA-E",
            "DARPA",
            "DoD",
            "USDA",
            "EPA",
            "NASA",
        ])
    ) {
        agencyFit = 18;
    }

    if (
        containsAny(combinedText, [
            "CMMI",
            "CPS",
            "FECM",
            "BES",
            "ASCR",
            "EERE",
            "SAI",
            "SaTC",
            "AFRI",
            "NIFA",
            "AIE",
        ])
    ) {
        agencyFit = 20;
    }

    let novelty = 10;
    if (
        containsAny(combinedText, [
            "agentic",
            "large language model",
            "llm",
            "physics-informed",
            "digital twin",
            "blockchain",
            "game theory",
            "autonomous",
            "resilience",
            "critical minerals",
            "data center",
            "cyber-physical",
            "trustworthy ai",
            "safe ai",
        ])
    ) {
        novelty = 14;
    }

    if (
        containsAny(combinedText, [
            "physics-regulated",
            "audited governance",
            "autonomous safety certificate",
            "inverse physics-informed",
            "blockchain-secured",
        ])
    ) {
        novelty = 15;
    }

    let preliminaryData = 8;
    if (
        containsAny(combinedText, [
            "process systems",
            "optimization",
            "control",
            "aspen",
            "python",
            "pyomo",
            "hydrogen",
            "ccus",
            "manufacturing",
            "supply chain",
            "safety",
            "digital twin",
            "simulation",
            "modeling",
        ])
    ) {
        preliminaryData = 13;
    }

    if (
        containsAny(combinedText, [
            "published",
            "prior work",
            "prototype",
            "preliminary data",
            "experimental",
            "simulation results",
        ])
    ) {
        preliminaryData = 15;
    }

    let teamReadiness = 6;
    if (
        containsAny(combinedText, [
            "collaboration",
            "multi-institution",
            "national lab",
            "industry",
            "interdisciplinary",
            "center",
            "partnership",
        ])
    ) {
        teamReadiness = 8;
    }

    if (
        containsAny(combinedText, [
            "power systems",
            "cybersecurity",
            "materials",
            "agriculture",
            "cloud",
            "data center",
            "national laboratory",
        ])
    ) {
        teamReadiness = 9;
    }

    let budgetScope = 7;
    if (
        containsAny(opportunity.award_amount || "", [
            "500",
            "750",
            "1,000",
            "1000000",
            "varies",
            "standard",
            "award ceiling",
            "estimated total program funding",
        ])
    ) {
        budgetScope = 8;
    }

    if (
        containsAny(combinedText, [
            "seed",
            "planning",
            "phase i",
            "exploratory",
            "concept",
            "workforce",
        ])
    ) {
        budgetScope = 9;
    }

    const deadlineFeasibility = estimateDeadlineScore(opportunity.deadline);

    let tenureValue = 3;
    if (
        containsAny(combinedText, [
            "NSF",
            "DOE",
            "PI",
            "CAREER",
            "CMMI",
            "CPS",
            "FECM",
            "BES",
            "ARPA-E",
            "DARPA",
            "USDA",
            "NIFA",
        ])
    ) {
        tenureValue = 5;
    }

    const totalScore =
        piAlignment +
        agencyFit +
        novelty +
        preliminaryData +
        teamReadiness +
        budgetScope +
        deadlineFeasibility +
        tenureValue;

    const action = getScoreBand(totalScore);

    return {
        total_score: totalScore,
        pi_alignment: piAlignment,
        agency_fit: agencyFit,
        novelty,
        preliminary_data_readiness: preliminaryData,
        team_readiness: teamReadiness,
        budget_scope_feasibility: budgetScope,
        deadline_feasibility: deadlineFeasibility,
        tenure_strategy_value: tenureValue,
        fit_reason: `This opportunity was scored against the current research profile using a transparent rule-based rubric. The score reflects alignment with process systems engineering, hybrid mechanistic/data-driven modeling, physics-informed AI, agentic AI, blockchain-governed systems, energy transition, smart manufacturing, supply-chain resilience, and proposal-readiness considerations. Current recommendation: ${action}.`,
        risks:
            "The call may require collaborators outside the current team; the deadline may be tight depending on internal routing; detailed solicitation requirements may change the final decision; this score is still rule-based and should later be refined with an LLM-based evaluator.",
        recommended_actions:
            totalScore >= 85
                ? "Draft a one-page concept note immediately; identify required collaborators; collect related papers and funded award examples; check eligibility, cost share, and internal routing requirements."
                : totalScore >= 70
                    ? "Develop a short concept note; verify solicitation requirements; identify one strategic collaborator; monitor deadline feasibility."
                    : totalScore >= 55
                        ? "Keep this opportunity on watch; consider joining as a collaborator; collect more evidence before committing PI effort."
                        : "Do not prioritize as a PI-led proposal unless there is a specific strategic reason or a stronger collaborator-led opportunity emerges.",
        suggested_title: `ResearchOS concept for ${opportunity.title || "selected funding opportunity"
            }`,
        likely_framing:
            "Frame the proposal around physics-informed, trustworthy, and operationally useful AI for engineering systems, with clear validation, feasibility checks, uncertainty handling, and research portfolio alignment.",
        required_collaborators:
            "Potential collaborators may include power systems, cybersecurity, materials science, national lab partners, data science, domain experimentalists, agricultural systems, cloud architecture, or industry stakeholders depending on the final topic.",
        scoring_method: "rule_based_v1",
    };
}

function buildScoreSchema() {
    return {
        type: "object",
        additionalProperties: false,
        properties: {
            pi_alignment: { type: "integer", minimum: 0, maximum: 20 },
            agency_fit: { type: "integer", minimum: 0, maximum: 20 },
            novelty: { type: "integer", minimum: 0, maximum: 15 },
            preliminary_data_readiness: { type: "integer", minimum: 0, maximum: 15 },
            team_readiness: { type: "integer", minimum: 0, maximum: 10 },
            budget_scope_feasibility: { type: "integer", minimum: 0, maximum: 10 },
            deadline_feasibility: { type: "integer", minimum: 0, maximum: 5 },
            tenure_strategy_value: { type: "integer", minimum: 0, maximum: 5 },
            fit_reason: { type: "string" },
            risks: { type: "string" },
            recommended_actions: { type: "string" },
            suggested_title: { type: "string" },
            likely_framing: { type: "string" },
            required_collaborators: { type: "string" },
        },
        required: [
            "pi_alignment",
            "agency_fit",
            "novelty",
            "preliminary_data_readiness",
            "team_readiness",
            "budget_scope_feasibility",
            "deadline_feasibility",
            "tenure_strategy_value",
            "fit_reason",
            "risks",
            "recommended_actions",
            "suggested_title",
            "likely_framing",
            "required_collaborators",
        ],
    };
}

function extractResponsesText(payload: any) {
    if (typeof payload?.output_text === "string") {
        return payload.output_text;
    }

    const output = payload?.output;

    if (!Array.isArray(output)) {
        return "";
    }

    const textParts: string[] = [];

    for (const item of output) {
        if (Array.isArray(item?.content)) {
            for (const content of item.content) {
                if (typeof content?.text === "string") {
                    textParts.push(content.text);
                }

                if (typeof content?.output_text === "string") {
                    textParts.push(content.output_text);
                }
            }
        }
    }

    return textParts.join("\n").trim();
}

async function generateOpenAiFitScore(
    profile: ResearchProfile,
    opportunity: FundingOpportunity
): Promise<FitScore> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured.");
    }

    const model = process.env.OPENAI_SCORING_MODEL || "gpt-5.5";

    const prompt = `
You are a research development strategist for a tenure-track chemical engineering professor.

Evaluate the funding opportunity against the PI profile using this exact 100-point rubric:

1. PI research alignment, 20 points
2. Agency/program fit, 20 points
3. Novelty and differentiation, 15 points
4. Preliminary data readiness, 15 points
5. Team readiness, 10 points
6. Budget/scope feasibility, 10 points
7. Deadline feasibility, 5 points
8. Tenure-strategy value, 5 points

Be rigorous but practical. Do not over-score weak opportunities. Consider whether the opportunity strengthens a coherent tenure-track portfolio.

PI PROFILE:
${JSON.stringify(profile, null, 2)}

FUNDING OPPORTUNITY:
${JSON.stringify(opportunity, null, 2)}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            input: [
                {
                    role: "system",
                    content:
                        "You score funding opportunities for research faculty. Return only valid structured JSON matching the provided schema.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: "funding_fit_score",
                    schema: buildScoreSchema(),
                    strict: true,
                },
            },
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(
            payload?.error?.message ||
            `OpenAI request failed with status ${response.status}`
        );
    }

    const outputText = extractResponsesText(payload);

    if (!outputText) {
        throw new Error("OpenAI response did not contain output text.");
    }

    const parsedScore = JSON.parse(outputText) as Partial<FitScore>;

    return normalizeScore(parsedScore, "llm_structured_v1");
}

async function safelyReadJson(request: Request) {
    const text = await request.text();

    if (!text.trim()) {
        return {
            ok: false,
            error: "Request body is empty. Send JSON with profile and opportunity.",
            body: null,
        };
    }

    try {
        return {
            ok: true,
            error: null,
            body: JSON.parse(text),
        };
    } catch {
        return {
            ok: false,
            error: "Invalid JSON body.",
            body: null,
        };
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message:
            "Funding score route is working. Use POST with JSON body containing profile, opportunity, and optional scoringMode.",
        scoring_modes: ["auto", "rule_based", "llm"],
        fallback:
            "If scoringMode is auto and OpenAI is not configured or fails, the route falls back to rule_based_v1.",
        example: {
            scoringMode: "auto",
            profile: {
                research_themes: "Hybrid mechanistic/data-driven modeling, agentic AI",
                core_methods: "Optimization, control, PINNs, blockchain",
                target_agencies: "NSF, DOE, ARPA-E",
                proposal_priorities: "PI-led proposals and tenure-focused portfolio",
            },
            opportunity: {
                title: "NSF Cyber-Physical Systems",
                agency: "NSF",
                deadline: "2026-07-15",
                summary: "AI-enabled cyber-physical systems",
            },
        },
    });
}

export async function POST(request: Request) {
    try {
        const parsed = await safelyReadJson(request);

        if (!parsed.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    error: parsed.error,
                },
                { status: 400 }
            );
        }

        const body = parsed.body as ScoreRequestBody;

        if (!body.profile) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Profile is required.",
                },
                { status: 400 }
            );
        }

        if (!body.opportunity) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Opportunity is required.",
                },
                { status: 400 }
            );
        }

        if (!body.opportunity.title) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Opportunity title is required.",
                },
                { status: 400 }
            );
        }

        const scoringMode = body.scoringMode || "auto";

        if (scoringMode === "rule_based") {
            const score = generateRuleBasedFitScore(body.profile, body.opportunity);

            return NextResponse.json({
                ok: true,
                score,
                used_fallback: false,
            });
        }

        if (scoringMode === "llm") {
            const score = await generateOpenAiFitScore(
                body.profile,
                body.opportunity
            );

            return NextResponse.json({
                ok: true,
                score,
                used_fallback: false,
            });
        }

        try {
            const score = await generateOpenAiFitScore(
                body.profile,
                body.opportunity
            );

            return NextResponse.json({
                ok: true,
                score,
                used_fallback: false,
            });
        } catch (openAiError) {
            console.error("OpenAI scoring failed, falling back:", openAiError);

            const fallbackScore = generateRuleBasedFitScore(
                body.profile,
                body.opportunity
            );

            return NextResponse.json({
                ok: true,
                score: fallbackScore,
                used_fallback: true,
                fallback_reason:
                    openAiError instanceof Error
                        ? openAiError.message
                        : "Unknown OpenAI scoring error.",
            });
        }
    } catch (error) {
        console.error("Funding score route error:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown funding score route error.",
            },
            { status: 500 }
        );
    }
}