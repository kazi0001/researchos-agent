import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AnalyzeCallRequest = {
    opportunityId?: string;
    mode?: "auto" | "llm" | "rule_based";
};

type FundingOpportunity = {
    id: string;
    title: string;
    agency: string | null;
    program: string | null;
    source: string | null;
    url: string | null;
    deadline: string | null;
    award_amount: string | null;
    eligibility: string | null;
    summary: string | null;
    full_text: string | null;
};

type CallAnalysis = {
    eligibility_status: string;
    eligible_institution_types: string;
    fit_institution_eligible: string;
    lead_applicant_allowed: string;
    subaward_allowed: string;
    national_lab_only: boolean;
    university_allowed: boolean | null;
    industry_required: boolean;
    eligibility_notes: string;

    budget_min: number | null;
    budget_max: number | null;
    budget_text: string;
    award_floor: number | null;
    award_ceiling: number | null;
    expected_number_of_awards: number | null;
    total_program_funding: number | null;
    cost_share_required: boolean | null;
    cost_share_percent: number | null;
    cost_share_text: string;

    project_duration_months: number | null;
    project_duration_min_months: number | null;
    project_duration_max_months: number | null;
    project_duration_text: string;

    loi_deadline: string | null;
    preproposal_deadline: string | null;
    concept_paper_deadline: string | null;
    full_proposal_deadline: string | null;
    internal_routing_deadline: string | null;
    q_and_a_deadline: string | null;
    registration_deadline: string | null;

    submission_portal: string;
    required_documents: string;
    team_requirements: string;
    review_criteria: string;
    solicitation_number: string;
    nofo_number: string;
    assistance_listing_number: string;

    proposal_priority: string;
    urgency_level: string;
    decision_status: string;
    go_no_go_notes: string;

    call_intelligence_status: string;
    call_intelligence_summary: string;
    call_intelligence_confidence: string;
    extraction_method: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function safelyReadJson(request: Request) {
    const text = await request.text();

    if (!text.trim()) {
        return {
            ok: false,
            body: null,
            error: "Request body is empty. Send JSON with opportunityId.",
        };
    }

    try {
        return {
            ok: true,
            body: JSON.parse(text),
            error: null,
        };
    } catch {
        return {
            ok: false,
            body: null,
            error: "Invalid JSON body.",
        };
    }
}

function buildAnalysisSchema() {
    return {
        type: "object",
        additionalProperties: false,
        properties: {
            eligibility_status: {
                type: "string",
                enum: [
                    "eligible",
                    "likely_eligible",
                    "possibly_eligible",
                    "not_eligible",
                    "national_lab_only",
                    "industry_only",
                    "unknown",
                ],
            },
            eligible_institution_types: { type: "string" },
            fit_institution_eligible: {
                type: "string",
                enum: ["yes", "likely", "maybe", "no", "unknown"],
            },
            lead_applicant_allowed: {
                type: "string",
                enum: ["yes", "likely", "maybe", "no", "unknown"],
            },
            subaward_allowed: {
                type: "string",
                enum: ["yes", "likely", "maybe", "no", "unknown"],
            },
            national_lab_only: { type: "boolean" },
            university_allowed: {
                anyOf: [{ type: "boolean" }, { type: "null" }],
            },
            industry_required: { type: "boolean" },
            eligibility_notes: { type: "string" },

            budget_min: {
                anyOf: [{ type: "number" }, { type: "null" }],
            },
            budget_max: {
                anyOf: [{ type: "number" }, { type: "null" }],
            },
            budget_text: { type: "string" },
            award_floor: {
                anyOf: [{ type: "number" }, { type: "null" }],
            },
            award_ceiling: {
                anyOf: [{ type: "number" }, { type: "null" }],
            },
            expected_number_of_awards: {
                anyOf: [{ type: "integer" }, { type: "null" }],
            },
            total_program_funding: {
                anyOf: [{ type: "number" }, { type: "null" }],
            },
            cost_share_required: {
                anyOf: [{ type: "boolean" }, { type: "null" }],
            },
            cost_share_percent: {
                anyOf: [{ type: "number" }, { type: "null" }],
            },
            cost_share_text: { type: "string" },

            project_duration_months: {
                anyOf: [{ type: "integer" }, { type: "null" }],
            },
            project_duration_min_months: {
                anyOf: [{ type: "integer" }, { type: "null" }],
            },
            project_duration_max_months: {
                anyOf: [{ type: "integer" }, { type: "null" }],
            },
            project_duration_text: { type: "string" },

            loi_deadline: {
                anyOf: [{ type: "string" }, { type: "null" }],
            },
            preproposal_deadline: {
                anyOf: [{ type: "string" }, { type: "null" }],
            },
            concept_paper_deadline: {
                anyOf: [{ type: "string" }, { type: "null" }],
            },
            full_proposal_deadline: {
                anyOf: [{ type: "string" }, { type: "null" }],
            },
            internal_routing_deadline: {
                anyOf: [{ type: "string" }, { type: "null" }],
            },
            q_and_a_deadline: {
                anyOf: [{ type: "string" }, { type: "null" }],
            },
            registration_deadline: {
                anyOf: [{ type: "string" }, { type: "null" }],
            },

            submission_portal: { type: "string" },
            required_documents: { type: "string" },
            team_requirements: { type: "string" },
            review_criteria: { type: "string" },
            solicitation_number: { type: "string" },
            nofo_number: { type: "string" },
            assistance_listing_number: { type: "string" },

            proposal_priority: {
                type: "string",
                enum: ["high", "medium", "low", "unassigned"],
            },
            urgency_level: {
                type: "string",
                enum: [
                    "overdue",
                    "urgent_0_14_days",
                    "soon_15_45_days",
                    "medium_46_90_days",
                    "later_90_plus_days",
                    "no_deadline",
                    "unknown",
                ],
            },
            decision_status: {
                type: "string",
                enum: ["undecided", "go", "no_go", "watch", "collaborate_only"],
            },
            go_no_go_notes: { type: "string" },

            call_intelligence_status: {
                type: "string",
                enum: [
                    "not_analyzed",
                    "manual_review",
                    "ai_analyzed",
                    "needs_pdf_review",
                    "verified",
                ],
            },
            call_intelligence_summary: { type: "string" },
            call_intelligence_confidence: {
                type: "string",
                enum: ["high", "medium", "low", "unknown"],
            },
            extraction_method: { type: "string" },
        },
        required: [
            "eligibility_status",
            "eligible_institution_types",
            "fit_institution_eligible",
            "lead_applicant_allowed",
            "subaward_allowed",
            "national_lab_only",
            "university_allowed",
            "industry_required",
            "eligibility_notes",
            "budget_min",
            "budget_max",
            "budget_text",
            "award_floor",
            "award_ceiling",
            "expected_number_of_awards",
            "total_program_funding",
            "cost_share_required",
            "cost_share_percent",
            "cost_share_text",
            "project_duration_months",
            "project_duration_min_months",
            "project_duration_max_months",
            "project_duration_text",
            "loi_deadline",
            "preproposal_deadline",
            "concept_paper_deadline",
            "full_proposal_deadline",
            "internal_routing_deadline",
            "q_and_a_deadline",
            "registration_deadline",
            "submission_portal",
            "required_documents",
            "team_requirements",
            "review_criteria",
            "solicitation_number",
            "nofo_number",
            "assistance_listing_number",
            "proposal_priority",
            "urgency_level",
            "decision_status",
            "go_no_go_notes",
            "call_intelligence_status",
            "call_intelligence_summary",
            "call_intelligence_confidence",
            "extraction_method",
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

function normalizeDate(value: string | null) {
    if (!value) return null;

    const trimmed = value.trim();

    if (!trimmed || trimmed.toLowerCase() === "unknown") return null;

    const date = new Date(trimmed);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString().split("T")[0];
}

function calculateInternalDeadline(fullProposalDeadline: string | null) {
    if (!fullProposalDeadline) return null;

    const date = new Date(fullProposalDeadline);

    if (Number.isNaN(date.getTime())) return null;

    date.setDate(date.getDate() - 14);

    return date.toISOString().split("T")[0];
}

function getUrgencyLevel(deadline: string | null) {
    if (!deadline) return "no_deadline";

    const today = new Date();
    const target = new Date(deadline);

    if (Number.isNaN(target.getTime())) return "unknown";

    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "overdue";
    if (diffDays <= 14) return "urgent_0_14_days";
    if (diffDays <= 45) return "soon_15_45_days";
    if (diffDays <= 90) return "medium_46_90_days";
    return "later_90_plus_days";
}

function normalizeAnalysis(analysis: Partial<CallAnalysis>): CallAnalysis {
    const fullProposalDeadline = normalizeDate(
        analysis.full_proposal_deadline || null
    );

    const internalRoutingDeadline =
        normalizeDate(analysis.internal_routing_deadline || null) ||
        calculateInternalDeadline(fullProposalDeadline);

    return {
        eligibility_status: analysis.eligibility_status || "unknown",
        eligible_institution_types: analysis.eligible_institution_types || "",
        fit_institution_eligible: analysis.fit_institution_eligible || "unknown",
        lead_applicant_allowed: analysis.lead_applicant_allowed || "unknown",
        subaward_allowed: analysis.subaward_allowed || "unknown",
        national_lab_only: Boolean(analysis.national_lab_only),
        university_allowed:
            typeof analysis.university_allowed === "boolean"
                ? analysis.university_allowed
                : null,
        industry_required: Boolean(analysis.industry_required),
        eligibility_notes: analysis.eligibility_notes || "",

        budget_min:
            typeof analysis.budget_min === "number" ? analysis.budget_min : null,
        budget_max:
            typeof analysis.budget_max === "number" ? analysis.budget_max : null,
        budget_text: analysis.budget_text || "",
        award_floor:
            typeof analysis.award_floor === "number" ? analysis.award_floor : null,
        award_ceiling:
            typeof analysis.award_ceiling === "number" ? analysis.award_ceiling : null,
        expected_number_of_awards:
            typeof analysis.expected_number_of_awards === "number"
                ? analysis.expected_number_of_awards
                : null,
        total_program_funding:
            typeof analysis.total_program_funding === "number"
                ? analysis.total_program_funding
                : null,
        cost_share_required:
            typeof analysis.cost_share_required === "boolean"
                ? analysis.cost_share_required
                : null,
        cost_share_percent:
            typeof analysis.cost_share_percent === "number"
                ? analysis.cost_share_percent
                : null,
        cost_share_text: analysis.cost_share_text || "",

        project_duration_months:
            typeof analysis.project_duration_months === "number"
                ? analysis.project_duration_months
                : null,
        project_duration_min_months:
            typeof analysis.project_duration_min_months === "number"
                ? analysis.project_duration_min_months
                : null,
        project_duration_max_months:
            typeof analysis.project_duration_max_months === "number"
                ? analysis.project_duration_max_months
                : null,
        project_duration_text: analysis.project_duration_text || "",

        loi_deadline: normalizeDate(analysis.loi_deadline || null),
        preproposal_deadline: normalizeDate(analysis.preproposal_deadline || null),
        concept_paper_deadline: normalizeDate(
            analysis.concept_paper_deadline || null
        ),
        full_proposal_deadline: fullProposalDeadline,
        internal_routing_deadline: internalRoutingDeadline,
        q_and_a_deadline: normalizeDate(analysis.q_and_a_deadline || null),
        registration_deadline: normalizeDate(analysis.registration_deadline || null),

        submission_portal: analysis.submission_portal || "",
        required_documents: analysis.required_documents || "",
        team_requirements: analysis.team_requirements || "",
        review_criteria: analysis.review_criteria || "",
        solicitation_number: analysis.solicitation_number || "",
        nofo_number: analysis.nofo_number || "",
        assistance_listing_number: analysis.assistance_listing_number || "",

        proposal_priority: analysis.proposal_priority || "unassigned",
        urgency_level:
            analysis.urgency_level && analysis.urgency_level !== "unknown"
                ? analysis.urgency_level
                : getUrgencyLevel(fullProposalDeadline),
        decision_status: analysis.decision_status || "undecided",
        go_no_go_notes: analysis.go_no_go_notes || "",

        call_intelligence_status:
            analysis.call_intelligence_status || "ai_analyzed",
        call_intelligence_summary: analysis.call_intelligence_summary || "",
        call_intelligence_confidence:
            analysis.call_intelligence_confidence || "unknown",
        extraction_method: analysis.extraction_method || "unknown",
    };
}

function ruleBasedAnalysis(opportunity: FundingOpportunity): CallAnalysis {
    const text = [
        opportunity.title,
        opportunity.agency,
        opportunity.program,
        opportunity.summary,
        opportunity.eligibility,
        opportunity.full_text,
        opportunity.award_amount,
    ]
        .filter(Boolean)
        .join("\n")
        .toLowerCase();

    const nationalLabOnly =
        text.includes("national laboratory only") ||
        text.includes("national laboratories only") ||
        text.includes("only national laboratories") ||
        text.includes("doe national laboratories only");

    const universityAllowed =
        text.includes("institutions of higher education") ||
        text.includes("institution of higher education") ||
        text.includes("universities") ||
        text.includes("university") ||
        text.includes("academic institutions");

    const industryRequired =
        text.includes("industry partner required") ||
        text.includes("requires industry partner") ||
        text.includes("industry cost share") ||
        text.includes("industrial partner");

    const noCostShare =
        text.includes("cost sharing is not required") ||
        text.includes("cost share is not required") ||
        text.includes("no cost share") ||
        text.includes("cost sharing/matching is not required");

    const costShareRequired =
        text.includes("cost share required") ||
        text.includes("cost sharing is required") ||
        text.includes("matching requirement");

    const fullProposalDeadline = opportunity.deadline || null;

    const analysis: CallAnalysis = {
        eligibility_status: nationalLabOnly
            ? "national_lab_only"
            : universityAllowed
                ? "likely_eligible"
                : "unknown",
        eligible_institution_types: universityAllowed
            ? "Institutions of higher education / universities appear to be allowed based on keyword screening."
            : "",
        fit_institution_eligible: nationalLabOnly
            ? "no"
            : universityAllowed
                ? "likely"
                : "unknown",
        lead_applicant_allowed: nationalLabOnly
            ? "no"
            : universityAllowed
                ? "likely"
                : "unknown",
        subaward_allowed: "unknown",
        national_lab_only: nationalLabOnly,
        university_allowed: nationalLabOnly ? false : universityAllowed ? true : null,
        industry_required: industryRequired,
        eligibility_notes:
            "Rule-based first pass. Please verify against the official solicitation or NOFO PDF before making a submission decision.",

        budget_min: null,
        budget_max: null,
        budget_text: opportunity.award_amount || "",
        award_floor: null,
        award_ceiling: null,
        expected_number_of_awards: null,
        total_program_funding: null,
        cost_share_required: costShareRequired ? true : noCostShare ? false : null,
        cost_share_percent: null,
        cost_share_text: noCostShare
            ? "Cost share appears not required based on keyword screening."
            : costShareRequired
                ? "Cost share appears required based on keyword screening."
                : "",

        project_duration_months: null,
        project_duration_min_months: null,
        project_duration_max_months: null,
        project_duration_text: "",

        loi_deadline: null,
        preproposal_deadline: null,
        concept_paper_deadline: null,
        full_proposal_deadline: fullProposalDeadline,
        internal_routing_deadline: calculateInternalDeadline(fullProposalDeadline),
        q_and_a_deadline: null,
        registration_deadline: null,

        submission_portal: opportunity.source === "grants.gov" ? "Grants.gov" : "",
        required_documents: "",
        team_requirements: industryRequired
            ? "Industry partner appears required based on keyword screening."
            : "",
        review_criteria: "",
        solicitation_number: "",
        nofo_number: "",
        assistance_listing_number: "",

        proposal_priority: "unassigned",
        urgency_level: getUrgencyLevel(fullProposalDeadline),
        decision_status: nationalLabOnly ? "no_go" : "undecided",
        go_no_go_notes: nationalLabOnly
            ? "Likely no-go as lead if the call is national-lab-only. Consider collaborator/subaward role only if allowed."
            : "Eligibility needs human verification.",

        call_intelligence_status: "manual_review",
        call_intelligence_summary:
            "Rule-based eligibility and timeline screening completed. This result requires human verification against the official solicitation.",
        call_intelligence_confidence: "low",
        extraction_method: "rule_based_v1",
    };

    return normalizeAnalysis(analysis);
}

async function generateOpenAiAnalysis(
    opportunity: FundingOpportunity
): Promise<CallAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured.");
    }

    const model =
        process.env.OPENAI_CALL_ANALYSIS_MODEL ||
        process.env.OPENAI_SCORING_MODEL ||
        "gpt-4.1-mini";

    const inputText = [
        `TITLE: ${opportunity.title}`,
        `AGENCY: ${opportunity.agency || ""}`,
        `PROGRAM: ${opportunity.program || ""}`,
        `SOURCE: ${opportunity.source || ""}`,
        `URL: ${opportunity.url || ""}`,
        `DEADLINE: ${opportunity.deadline || ""}`,
        `AWARD AMOUNT: ${opportunity.award_amount || ""}`,
        `ELIGIBILITY TEXT:\n${opportunity.eligibility || ""}`,
        `SUMMARY:\n${opportunity.summary || ""}`,
        `FULL TEXT / RAW DETAILS:\n${(opportunity.full_text || "").slice(0, 30000)}`,
    ].join("\n\n");

    const prompt = `
You are an expert research development officer helping a chemical engineering faculty member at Florida Institute of Technology (FIT), a U.S. institution of higher education.

Analyze this funding call. Extract eligibility, budget, duration, deadlines, required documents, submission requirements, and timeline fields.

Important:
- Determine whether FIT/universities are eligible.
- Detect national-lab-only calls.
- Detect whether FIT can likely submit as lead.
- If only national labs can lead but universities can participate as subawards, say so.
- Use "unknown" when the text is insufficient.
- Do not invent dates or budgets.
- Dates must be ISO format YYYY-MM-DD or null.
- Internal routing deadline should be 14 days before the full proposal deadline when a full deadline is known.
- Mark output as AI-analyzed and needs human verification unless the source text is very explicit.

Funding call text:
${inputText}
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
                        "You extract structured grant-call intelligence for university research proposal planning. Return only valid structured JSON matching the schema.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: "call_intelligence_analysis",
                    schema: buildAnalysisSchema(),
                    strict: true,
                },
            },
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(
            payload?.error?.message ||
            `OpenAI call analysis failed with status ${response.status}`
        );
    }

    const outputText = extractResponsesText(payload);

    if (!outputText) {
        throw new Error("OpenAI response did not contain output text.");
    }

    const parsed = JSON.parse(outputText) as Partial<CallAnalysis>;

    return normalizeAnalysis({
        ...parsed,
        call_intelligence_status: "ai_analyzed",
        extraction_method: "llm_structured_v1",
    });
}

async function updateOpportunityAnalysis(
    opportunityId: string,
    analysis: CallAnalysis
) {
    const { error } = await supabaseAdmin
        .from("funding_opportunities")
        .update({
            eligibility_status: analysis.eligibility_status,
            eligible_institution_types: analysis.eligible_institution_types,
            fit_institution_eligible: analysis.fit_institution_eligible,
            lead_applicant_allowed: analysis.lead_applicant_allowed,
            subaward_allowed: analysis.subaward_allowed,
            national_lab_only: analysis.national_lab_only,
            university_allowed: analysis.university_allowed,
            industry_required: analysis.industry_required,
            eligibility_notes: analysis.eligibility_notes,

            budget_min: analysis.budget_min,
            budget_max: analysis.budget_max,
            budget_text: analysis.budget_text,
            award_floor: analysis.award_floor,
            award_ceiling: analysis.award_ceiling,
            expected_number_of_awards: analysis.expected_number_of_awards,
            total_program_funding: analysis.total_program_funding,
            cost_share_required: analysis.cost_share_required,
            cost_share_percent: analysis.cost_share_percent,
            cost_share_text: analysis.cost_share_text,

            project_duration_months: analysis.project_duration_months,
            project_duration_min_months: analysis.project_duration_min_months,
            project_duration_max_months: analysis.project_duration_max_months,
            project_duration_text: analysis.project_duration_text,

            loi_deadline: analysis.loi_deadline,
            preproposal_deadline: analysis.preproposal_deadline,
            concept_paper_deadline: analysis.concept_paper_deadline,
            full_proposal_deadline: analysis.full_proposal_deadline,
            internal_routing_deadline: analysis.internal_routing_deadline,
            q_and_a_deadline: analysis.q_and_a_deadline,
            registration_deadline: analysis.registration_deadline,

            submission_portal: analysis.submission_portal,
            required_documents: analysis.required_documents,
            team_requirements: analysis.team_requirements,
            review_criteria: analysis.review_criteria,
            solicitation_number: analysis.solicitation_number,
            nofo_number: analysis.nofo_number,
            assistance_listing_number: analysis.assistance_listing_number,

            proposal_priority: analysis.proposal_priority,
            urgency_level: analysis.urgency_level,
            decision_status: analysis.decision_status,
            go_no_go_notes: analysis.go_no_go_notes,

            call_intelligence_status: analysis.call_intelligence_status,
            call_intelligence_summary: analysis.call_intelligence_summary,
            call_intelligence_confidence: analysis.call_intelligence_confidence,
            call_intelligence_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", opportunityId);

    if (error) {
        throw error;
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message:
            "Funding call analysis route is working. Use POST with { opportunityId, mode: 'auto' | 'llm' | 'rule_based' }.",
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

        const body = parsed.body as AnalyzeCallRequest;

        if (!body.opportunityId) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "opportunityId is required.",
                },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("funding_opportunities")
            .select(
                `
        id,
        title,
        agency,
        program,
        source,
        url,
        deadline,
        award_amount,
        eligibility,
        summary,
        full_text
      `
            )
            .eq("id", body.opportunityId)
            .single();

        if (error) {
            throw error;
        }

        const opportunity = data as FundingOpportunity;
        const mode = body.mode || "auto";

        let analysis: CallAnalysis;
        let usedFallback = false;
        let fallbackReason: string | null = null;

        if (mode === "rule_based") {
            analysis = ruleBasedAnalysis(opportunity);
        } else if (mode === "llm") {
            analysis = await generateOpenAiAnalysis(opportunity);
        } else {
            try {
                analysis = await generateOpenAiAnalysis(opportunity);
            } catch (openAiError) {
                usedFallback = true;
                fallbackReason =
                    openAiError instanceof Error
                        ? openAiError.message
                        : "Unknown OpenAI analysis error.";
                console.error("OpenAI call analysis failed, falling back:", openAiError);
                analysis = ruleBasedAnalysis(opportunity);
            }
        }

        await updateOpportunityAnalysis(opportunity.id, analysis);

        return NextResponse.json({
            ok: true,
            opportunityId: opportunity.id,
            mode,
            used_fallback: usedFallback,
            fallback_reason: fallbackReason,
            analysis,
        });
    } catch (error) {
        console.error("Funding call analysis route error:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown funding call analysis error.",
            },
            { status: 500 }
        );
    }
}