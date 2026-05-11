"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabaseClient";

type FundingOpportunity = {
    id: string;
    source: string | null;
    source_id: string | null;
    title: string;
    agency: string | null;
    program: string | null;
    url: string | null;
    deadline: string | null;
    award_amount: string | null;
    eligibility: string | null;
    summary: string | null;
    full_text: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;

    eligibility_status: string | null;
    eligible_institution_types: string | null;
    fit_institution_eligible: string | null;
    lead_applicant_allowed: string | null;
    subaward_allowed: string | null;
    national_lab_only: boolean | null;
    university_allowed: boolean | null;
    industry_required: boolean | null;
    eligibility_notes: string | null;

    budget_min: number | null;
    budget_max: number | null;
    budget_text: string | null;
    award_floor: number | null;
    award_ceiling: number | null;
    expected_number_of_awards: number | null;
    total_program_funding: number | null;
    cost_share_required: boolean | null;
    cost_share_percent: number | null;
    cost_share_text: string | null;

    project_duration_months: number | null;
    project_duration_min_months: number | null;
    project_duration_max_months: number | null;
    project_duration_text: string | null;

    loi_deadline: string | null;
    preproposal_deadline: string | null;
    concept_paper_deadline: string | null;
    full_proposal_deadline: string | null;
    internal_routing_deadline: string | null;
    q_and_a_deadline: string | null;
    registration_deadline: string | null;

    submission_portal: string | null;
    required_documents: string | null;
    team_requirements: string | null;
    review_criteria: string | null;
    solicitation_number: string | null;
    nofo_number: string | null;
    assistance_listing_number: string | null;

    gantt_start_date: string | null;
    gantt_end_date: string | null;
    proposal_priority: string | null;
    urgency_level: string | null;
    decision_status: string | null;
    go_no_go_notes: string | null;

    call_intelligence_status: string | null;
    call_intelligence_summary: string | null;
    call_intelligence_confidence: string | null;
    call_intelligence_updated_at: string | null;
};

type FundingMatch = {
    id: string;
    opportunity_id: string;
    total_score: number | null;
    pi_alignment: number | null;
    agency_fit: number | null;
    novelty: number | null;
    preliminary_data_readiness: number | null;
    team_readiness: number | null;
    budget_scope_feasibility: number | null;
    deadline_feasibility: number | null;
    tenure_strategy_value: number | null;
    fit_reason: string | null;
    risks: string | null;
    recommended_actions: string | null;
    suggested_title: string | null;
    likely_framing: string | null;
    required_collaborators: string | null;
    scoring_method: string | null;
    created_at: string | null;
};

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
};

type OpportunityStatus = "watch" | "concept" | "active" | "submitted" | "ignored";

export default function FundingDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [opportunity, setOpportunity] = useState<FundingOpportunity | null>(
        null
    );
    const [match, setMatch] = useState<FundingMatch | null>(null);
    const [scoreHistory, setScoreHistory] = useState<FundingMatch[]>([]);
    const [tasks, setTasks] = useState<ProposalTask[]>([]);

    const [loading, setLoading] = useState(true);
    const [generatingTasks, setGeneratingTasks] = useState(false);
    const [deletingScoreId, setDeletingScoreId] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [savingCallIntel, setSavingCallIntel] = useState(false);
    const [analyzingCall, setAnalyzingCall] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [message, setMessage] = useState("");

    const [eligibilityStatus, setEligibilityStatus] = useState("unknown");
    const [eligibleInstitutionTypes, setEligibleInstitutionTypes] = useState("");
    const [fitInstitutionEligible, setFitInstitutionEligible] = useState("unknown");
    const [leadApplicantAllowed, setLeadApplicantAllowed] = useState("unknown");
    const [subawardAllowed, setSubawardAllowed] = useState("unknown");
    const [nationalLabOnly, setNationalLabOnly] = useState(false);
    const [universityAllowed, setUniversityAllowed] = useState("unknown");
    const [industryRequired, setIndustryRequired] = useState(false);
    const [eligibilityNotes, setEligibilityNotes] = useState("");

    const [budgetMin, setBudgetMin] = useState("");
    const [budgetMax, setBudgetMax] = useState("");
    const [budgetText, setBudgetText] = useState("");
    const [awardFloor, setAwardFloor] = useState("");
    const [awardCeiling, setAwardCeiling] = useState("");
    const [expectedNumberOfAwards, setExpectedNumberOfAwards] = useState("");
    const [totalProgramFunding, setTotalProgramFunding] = useState("");
    const [costShareRequired, setCostShareRequired] = useState("unknown");
    const [costSharePercent, setCostSharePercent] = useState("");
    const [costShareText, setCostShareText] = useState("");

    const [projectDurationMonths, setProjectDurationMonths] = useState("");
    const [projectDurationMinMonths, setProjectDurationMinMonths] = useState("");
    const [projectDurationMaxMonths, setProjectDurationMaxMonths] = useState("");
    const [projectDurationText, setProjectDurationText] = useState("");

    const [loiDeadline, setLoiDeadline] = useState("");
    const [preproposalDeadline, setPreproposalDeadline] = useState("");
    const [conceptPaperDeadline, setConceptPaperDeadline] = useState("");
    const [fullProposalDeadline, setFullProposalDeadline] = useState("");
    const [internalRoutingDeadline, setInternalRoutingDeadline] = useState("");
    const [qAndADeadline, setQAndADeadline] = useState("");
    const [registrationDeadline, setRegistrationDeadline] = useState("");

    const [submissionPortal, setSubmissionPortal] = useState("");
    const [requiredDocuments, setRequiredDocuments] = useState("");
    const [teamRequirements, setTeamRequirements] = useState("");
    const [reviewCriteria, setReviewCriteria] = useState("");
    const [solicitationNumber, setSolicitationNumber] = useState("");
    const [nofoNumber, setNofoNumber] = useState("");
    const [assistanceListingNumber, setAssistanceListingNumber] = useState("");

    const [proposalPriority, setProposalPriority] = useState("unassigned");
    const [urgencyLevel, setUrgencyLevel] = useState("unknown");
    const [decisionStatus, setDecisionStatus] = useState("undecided");
    const [goNoGoNotes, setGoNoGoNotes] = useState("");
    const [callIntelligenceStatus, setCallIntelligenceStatus] =
        useState("not_analyzed");
    const [callIntelligenceSummary, setCallIntelligenceSummary] = useState("");
    const [callIntelligenceConfidence, setCallIntelligenceConfidence] =
        useState("unknown");

    useEffect(() => {
        if (id) {
            loadOpportunityDetail();
        }
    }, [id]);

    async function loadOpportunityDetail() {
        setLoading(true);
        setErrorMessage("");
        setMessage("");

        const { data: opportunityData, error: opportunityError } = await supabase
            .from("funding_opportunities")
            .select("*")
            .eq("id", id)
            .single();

        if (opportunityError) {
            console.error("Error loading funding opportunity:", opportunityError);
            setErrorMessage(opportunityError.message);
            setLoading(false);
            return;
        }

        setOpportunity(opportunityData);
        hydrateCallIntelligence(opportunityData);

        const { data: matchData, error: matchError } = await supabase
            .from("funding_matches")
            .select("*")
            .eq("opportunity_id", id)
            .order("created_at", { ascending: false });

        if (matchError) {
            console.error("Error loading fit scores:", matchError);
            setErrorMessage(matchError.message);
            setLoading(false);
            return;
        }

        const matches = matchData || [];
        setScoreHistory(matches);
        setMatch(matches.length > 0 ? matches[0] : null);

        const { data: taskData, error: taskError } = await supabase
            .from("proposal_tasks")
            .select("*")
            .eq("opportunity_id", id)
            .order("due_date", { ascending: true });

        if (taskError) {
            console.error("Error loading proposal tasks:", taskError);
            setErrorMessage(taskError.message);
            setLoading(false);
            return;
        }

        setTasks(taskData || []);
        setLoading(false);
    }

    function hydrateCallIntelligence(data: FundingOpportunity) {
        setEligibilityStatus(data.eligibility_status || "unknown");
        setEligibleInstitutionTypes(data.eligible_institution_types || "");
        setFitInstitutionEligible(data.fit_institution_eligible || "unknown");
        setLeadApplicantAllowed(data.lead_applicant_allowed || "unknown");
        setSubawardAllowed(data.subaward_allowed || "unknown");
        setNationalLabOnly(Boolean(data.national_lab_only));
        setUniversityAllowed(
            data.university_allowed === true
                ? "yes"
                : data.university_allowed === false
                    ? "no"
                    : "unknown"
        );
        setIndustryRequired(Boolean(data.industry_required));
        setEligibilityNotes(data.eligibility_notes || "");

        setBudgetMin(data.budget_min ? String(data.budget_min) : "");
        setBudgetMax(data.budget_max ? String(data.budget_max) : "");
        setBudgetText(data.budget_text || data.award_amount || "");
        setAwardFloor(data.award_floor ? String(data.award_floor) : "");
        setAwardCeiling(data.award_ceiling ? String(data.award_ceiling) : "");
        setExpectedNumberOfAwards(
            data.expected_number_of_awards ? String(data.expected_number_of_awards) : ""
        );
        setTotalProgramFunding(
            data.total_program_funding ? String(data.total_program_funding) : ""
        );
        setCostShareRequired(
            data.cost_share_required === true
                ? "yes"
                : data.cost_share_required === false
                    ? "no"
                    : "unknown"
        );
        setCostSharePercent(
            data.cost_share_percent ? String(data.cost_share_percent) : ""
        );
        setCostShareText(data.cost_share_text || "");

        setProjectDurationMonths(
            data.project_duration_months ? String(data.project_duration_months) : ""
        );
        setProjectDurationMinMonths(
            data.project_duration_min_months
                ? String(data.project_duration_min_months)
                : ""
        );
        setProjectDurationMaxMonths(
            data.project_duration_max_months
                ? String(data.project_duration_max_months)
                : ""
        );
        setProjectDurationText(data.project_duration_text || "");

        setLoiDeadline(data.loi_deadline || "");
        setPreproposalDeadline(data.preproposal_deadline || "");
        setConceptPaperDeadline(data.concept_paper_deadline || "");
        setFullProposalDeadline(data.full_proposal_deadline || "");
        setInternalRoutingDeadline(data.internal_routing_deadline || "");
        setQAndADeadline(data.q_and_a_deadline || "");
        setRegistrationDeadline(data.registration_deadline || "");

        setSubmissionPortal(data.submission_portal || "");
        setRequiredDocuments(data.required_documents || "");
        setTeamRequirements(data.team_requirements || "");
        setReviewCriteria(data.review_criteria || "");
        setSolicitationNumber(data.solicitation_number || "");
        setNofoNumber(data.nofo_number || "");
        setAssistanceListingNumber(data.assistance_listing_number || "");

        setProposalPriority(data.proposal_priority || "unassigned");
        setUrgencyLevel(data.urgency_level || "unknown");
        setDecisionStatus(data.decision_status || "undecided");
        setGoNoGoNotes(data.go_no_go_notes || "");
        setCallIntelligenceStatus(data.call_intelligence_status || "not_analyzed");
        setCallIntelligenceSummary(data.call_intelligence_summary || "");
        setCallIntelligenceConfidence(
            data.call_intelligence_confidence || "unknown"
        );
    }

    function nullableNumber(value: string) {
        if (!value.trim()) return null;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }

    function nullableInteger(value: string) {
        if (!value.trim()) return null;
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
    }

    function nullableDate(value: string) {
        return value.trim() ? value : null;
    }

    function boolFromSelect(value: string) {
        if (value === "yes") return true;
        if (value === "no") return false;
        return null;
    }

    async function handleAnalyzeCallIntelligence() {
        if (!opportunity) return;

        const confirmed = window.confirm(
            "Analyze this funding call with AI/rule-based extraction? This will update eligibility, budget, duration, and timeline fields. You should still verify the result manually."
        );

        if (!confirmed) return;

        setAnalyzingCall(true);
        setErrorMessage("");
        setMessage("");

        try {
            const response = await fetch("/api/funding/analyze-call", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    opportunityId: opportunity.id,
                    mode: "auto",
                }),
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                console.error("Analyze call error:", payload);
                setErrorMessage(
                    payload.error || "Call intelligence analysis failed. Please try again."
                );
                setAnalyzingCall(false);
                return;
            }

            const fallbackNote = payload.used_fallback
                ? " OpenAI failed, so rule-based fallback was used."
                : "";

            setMessage(
                `Eligibility and timeline analysis completed. Method: ${payload.analysis?.extraction_method || "unknown"
                }.${fallbackNote}`
            );

            await loadOpportunityDetail();
        } catch (error) {
            console.error("Analyze call UI error:", error);
            setErrorMessage(
                error instanceof Error ? error.message : "Unknown call analysis error."
            );
        }

        setAnalyzingCall(false);
    }

    async function handleSaveCallIntelligence() {
        if (!opportunity) return;

        setSavingCallIntel(true);
        setErrorMessage("");
        setMessage("");

        const updatedPayload = {
            eligibility_status: eligibilityStatus,
            eligible_institution_types: eligibleInstitutionTypes || null,
            fit_institution_eligible: fitInstitutionEligible,
            lead_applicant_allowed: leadApplicantAllowed,
            subaward_allowed: subawardAllowed,
            national_lab_only: nationalLabOnly,
            university_allowed: boolFromSelect(universityAllowed),
            industry_required: industryRequired,
            eligibility_notes: eligibilityNotes || null,

            budget_min: nullableNumber(budgetMin),
            budget_max: nullableNumber(budgetMax),
            budget_text: budgetText || null,
            award_floor: nullableNumber(awardFloor),
            award_ceiling: nullableNumber(awardCeiling),
            expected_number_of_awards: nullableInteger(expectedNumberOfAwards),
            total_program_funding: nullableNumber(totalProgramFunding),
            cost_share_required: boolFromSelect(costShareRequired),
            cost_share_percent: nullableNumber(costSharePercent),
            cost_share_text: costShareText || null,

            project_duration_months: nullableInteger(projectDurationMonths),
            project_duration_min_months: nullableInteger(projectDurationMinMonths),
            project_duration_max_months: nullableInteger(projectDurationMaxMonths),
            project_duration_text: projectDurationText || null,

            loi_deadline: nullableDate(loiDeadline),
            preproposal_deadline: nullableDate(preproposalDeadline),
            concept_paper_deadline: nullableDate(conceptPaperDeadline),
            full_proposal_deadline: nullableDate(fullProposalDeadline),
            internal_routing_deadline: nullableDate(internalRoutingDeadline),
            q_and_a_deadline: nullableDate(qAndADeadline),
            registration_deadline: nullableDate(registrationDeadline),

            submission_portal: submissionPortal || null,
            required_documents: requiredDocuments || null,
            team_requirements: teamRequirements || null,
            review_criteria: reviewCriteria || null,
            solicitation_number: solicitationNumber || null,
            nofo_number: nofoNumber || null,
            assistance_listing_number: assistanceListingNumber || null,

            proposal_priority: proposalPriority,
            urgency_level: urgencyLevel,
            decision_status: decisionStatus,
            go_no_go_notes: goNoGoNotes || null,
            call_intelligence_status: callIntelligenceStatus,
            call_intelligence_summary: callIntelligenceSummary || null,
            call_intelligence_confidence: callIntelligenceConfidence,
            call_intelligence_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("funding_opportunities")
            .update(updatedPayload)
            .eq("id", opportunity.id);

        if (error) {
            console.error("Error saving call intelligence:", error);
            setErrorMessage(error.message);
            setSavingCallIntel(false);
            return;
        }

        setMessage("Eligibility, budget, duration, and timeline fields saved.");
        await loadOpportunityDetail();
        setSavingCallIntel(false);
    }

    function getScoreLabel(score: number | null) {
        if (!score) return "Not scored";
        if (score >= 85) return "Pursue now";
        if (score >= 70) return "Develop concept note";
        if (score >= 55) return "Watch or collaborate";
        return "Low priority";
    }

    function getScoreDescription(score: number | null) {
        if (!score) return "This opportunity has not been scored yet.";
        if (score >= 85) {
            return "This is a strong opportunity and should be considered for immediate proposal development.";
        }
        if (score >= 70) {
            return "This is a promising opportunity. A short concept note is recommended before committing fully.";
        }
        if (score >= 55) {
            return "This may be useful to monitor or pursue as a collaborator, but it may not be a top PI-led priority.";
        }
        return "This opportunity appears to be low priority based on the current scoring record.";
    }

    function formatDateTime(dateString: string | null) {
        if (!dateString) return "Not available";
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;
        return date.toLocaleString();
    }

    function addDays(date: Date, days: number) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split("T")[0];
    }

    function subtractDaysFromDeadline(deadline: string | null, daysBefore: number) {
        if (!deadline) return null;
        const deadlineDate = new Date(deadline);
        deadlineDate.setDate(deadlineDate.getDate() - daysBefore);
        return deadlineDate.toISOString().split("T")[0];
    }

    function buildDefaultTasks() {
        const today = new Date();

        const mainDeadline =
            fullProposalDeadline ||
            opportunity?.full_proposal_deadline ||
            opportunity?.deadline ||
            null;

        const conceptDue =
            subtractDaysFromDeadline(mainDeadline, 60) || addDays(today, 7);

        const collaboratorsDue =
            subtractDaysFromDeadline(mainDeadline, 50) || addDays(today, 10);

        const literatureDue =
            subtractDaysFromDeadline(mainDeadline, 45) || addDays(today, 14);

        const aimsDue =
            subtractDaysFromDeadline(mainDeadline, 35) || addDays(today, 21);

        const budgetDue =
            subtractDaysFromDeadline(mainDeadline, 25) || addDays(today, 28);

        const complianceDue =
            subtractDaysFromDeadline(mainDeadline, 14) || addDays(today, 35);

        const finalReviewDue =
            subtractDaysFromDeadline(mainDeadline, 7) || addDays(today, 42);

        return [
            {
                opportunity_id: id,
                task_title: "Draft one-page concept note",
                task_description:
                    "Summarize the problem, central hypothesis, novelty, research aims, expected outcomes, and agency fit.",
                owner: "Kazi",
                due_date: conceptDue,
                status: "todo",
                priority: "high",
            },
            {
                opportunity_id: id,
                task_title: "Confirm FIT/university eligibility",
                task_description:
                    "Check whether Florida Institute of Technology can submit as lead, whether university applicants are allowed, and whether the call is national-lab-only.",
                owner: "Kazi",
                due_date: subtractDaysFromDeadline(mainDeadline, 55) || addDays(today, 8),
                status: "todo",
                priority: "high",
            },
            {
                opportunity_id: id,
                task_title: "Identify required collaborators",
                task_description:
                    match?.required_collaborators ||
                    "Identify collaborators needed for technical credibility, validation, data, facilities, or broader impacts.",
                owner: "Kazi",
                due_date: collaboratorsDue,
                status: "todo",
                priority: "high",
            },
            {
                opportunity_id: id,
                task_title: "Collect recent papers and funded award examples",
                task_description:
                    "Find recent literature, prior funded awards, and agency language that can support the proposal framing.",
                owner: "Kazi",
                due_date: literatureDue,
                status: "todo",
                priority: "medium",
            },
            {
                opportunity_id: id,
                task_title: "Develop specific aims and work packages",
                task_description:
                    "Convert the concept into 2 to 3 research aims, tasks, milestones, validation metrics, and expected deliverables.",
                owner: "Kazi",
                due_date: aimsDue,
                status: "todo",
                priority: "high",
            },
            {
                opportunity_id: id,
                task_title: "Prepare budget and scope assumptions",
                task_description:
                    "Estimate personnel, student support, equipment, travel, publication, computing, and collaborator costs.",
                owner: "Kazi",
                due_date: budgetDue,
                status: "todo",
                priority: "medium",
            },
            {
                opportunity_id: id,
                task_title: "Check solicitation compliance",
                task_description:
                    "Review page limits, eligibility, required documents, cost share, submission portal, data management, mentoring, and internal routing requirements.",
                owner: "Kazi",
                due_date: complianceDue,
                status: "todo",
                priority: "high",
            },
            {
                opportunity_id: id,
                task_title: "Complete final technical review",
                task_description:
                    "Review proposal narrative, figures, budget justification, references, biosketches, collaborators, and submission package.",
                owner: "Kazi",
                due_date: finalReviewDue,
                status: "todo",
                priority: "high",
            },
        ];
    }

    async function handleGenerateTasks() {
        setGeneratingTasks(true);
        setErrorMessage("");
        setMessage("");

        if (!opportunity) {
            setErrorMessage("Funding opportunity is not loaded yet.");
            setGeneratingTasks(false);
            return;
        }

        if (tasks.length > 0) {
            setErrorMessage(
                "Proposal tasks already exist for this opportunity. We will add task editing in a later step."
            );
            setGeneratingTasks(false);
            return;
        }

        const generatedTasks = buildDefaultTasks();

        const { error } = await supabase
            .from("proposal_tasks")
            .insert(generatedTasks);

        if (error) {
            console.error("Error generating proposal tasks:", error);
            setErrorMessage(error.message);
            setGeneratingTasks(false);
            return;
        }

        setMessage("Proposal tasks generated successfully.");
        await loadOpportunityDetail();
        setGeneratingTasks(false);
    }

    async function handleUpdateTaskStatus(taskId: string, newStatus: string) {
        setErrorMessage("");
        setMessage("");

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

    async function handleDeleteScore(scoreId: string) {
        const confirmed = window.confirm(
            "Delete this score record? This action cannot be undone."
        );

        if (!confirmed) return;

        setDeletingScoreId(scoreId);
        setErrorMessage("");
        setMessage("");

        const { error } = await supabase
            .from("funding_matches")
            .delete()
            .eq("id", scoreId);

        if (error) {
            console.error("Error deleting score:", error);
            setErrorMessage(error.message);
            setDeletingScoreId(null);
            return;
        }

        setMessage("Score record deleted successfully.");
        await loadOpportunityDetail();
        setDeletingScoreId(null);
    }

    async function handleUpdateOpportunityStatus(newStatus: OpportunityStatus) {
        if (!opportunity) return;

        setUpdatingStatus(true);
        setErrorMessage("");
        setMessage("");

        const { error } = await supabase
            .from("funding_opportunities")
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", opportunity.id);

        if (error) {
            console.error("Error updating opportunity status:", error);
            setErrorMessage(error.message);
            setUpdatingStatus(false);
            return;
        }

        setOpportunity({
            ...opportunity,
            status: newStatus,
            updated_at: new Date().toISOString(),
        });

        setMessage(`Opportunity status updated to ${newStatus}.`);
        setUpdatingStatus(false);
    }

    function getEligibilityBadge() {
        if (nationalLabOnly) return "National lab only";
        if (fitInstitutionEligible === "yes") return "FIT eligible";
        if (fitInstitutionEligible === "likely") return "FIT likely eligible";
        if (fitInstitutionEligible === "maybe") return "Eligibility needs review";
        if (fitInstitutionEligible === "no") return "FIT not eligible";
        return "Eligibility unknown";
    }

    function getDeadlineBadge() {
        const mainDeadline =
            fullProposalDeadline ||
            opportunity?.full_proposal_deadline ||
            opportunity?.deadline;

        if (!mainDeadline) return "No full deadline";

        const today = new Date();
        const deadlineDate = new Date(mainDeadline);
        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
            (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (Number.isNaN(diffDays)) return "Deadline unclear";
        if (diffDays < 0) return `Passed ${Math.abs(diffDays)} days ago`;
        if (diffDays === 0) return "Due today";
        if (diffDays === 1) return "Due tomorrow";
        return `Due in ${diffDays} days`;
    }

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
            <section className="mx-auto max-w-6xl">
                <AppHeader
                    title="Funding Opportunity Detail"
                    description="Review the opportunity, eligibility, budget, timeline, fit score, score history, and proposal preparation tasks."
                    activePage="funding"
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

                {loading && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
                        Loading funding opportunity...
                    </div>
                )}

                {!loading && !errorMessage && !opportunity && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
                        No funding opportunity found.
                    </div>
                )}

                {!loading && opportunity && (
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm text-slate-400">
                                            {opportunity.agency || "Agency not provided"}
                                            {opportunity.program ? ` • ${opportunity.program}` : ""}
                                        </p>

                                        <h2 className="mt-2 text-2xl font-bold">
                                            {opportunity.title}
                                        </h2>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300">
                                                {opportunity.status || "watch"}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                {getEligibilityBadge()}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                {getDeadlineBadge()}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                Priority: {proposalPriority}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                Intelligence: {callIntelligenceStatus}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:items-end">
                                        <label className="text-xs text-slate-500">
                                            Opportunity Status
                                        </label>
                                        <select
                                            value={opportunity.status || "watch"}
                                            onChange={(event) =>
                                                handleUpdateOpportunityStatus(
                                                    event.target.value as OpportunityStatus
                                                )
                                            }
                                            disabled={updatingStatus}
                                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <option value="watch">Watch</option>
                                            <option value="concept">Concept</option>
                                            <option value="active">Active</option>
                                            <option value="submitted">Submitted</option>
                                            <option value="ignored">Ignored</option>
                                        </select>
                                        {updatingStatus && (
                                            <p className="text-xs text-slate-500">Updating...</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
                                    <p>
                                        <span className="text-slate-500">Deadline:</span>{" "}
                                        {opportunity.deadline || "Not provided"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Award amount:</span>{" "}
                                        {opportunity.award_amount || "Not provided"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Source:</span>{" "}
                                        {opportunity.source || "manual"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Source ID:</span>{" "}
                                        {opportunity.source_id || "Not provided"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">Solicitation #:</span>{" "}
                                        {solicitationNumber || "Not provided"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500">NOFO #:</span>{" "}
                                        {nofoNumber || "Not provided"}
                                    </p>
                                </div>

                                {opportunity.url && (
                                    <a
                                        href={opportunity.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-5 inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                    >
                                        Open original funding page
                                    </a>
                                )}
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold">
                                            Eligibility & Timeline Intelligence
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-400">
                                            Manually record or AI-extract whether FIT or a university
                                            can submit, whether the call is national-lab-only, and
                                            which deadlines matter.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAnalyzeCallIntelligence}
                                        disabled={analyzingCall}
                                        className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {analyzingCall
                                            ? "Analyzing..."
                                            : "Analyze Eligibility & Timeline"}
                                    </button>
                                </div>

                                <div className="mt-6 grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Eligibility status
                                        </label>
                                        <select
                                            value={eligibilityStatus}
                                            onChange={(event) =>
                                                setEligibilityStatus(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        >
                                            <option value="unknown">Unknown</option>
                                            <option value="eligible">Eligible</option>
                                            <option value="likely_eligible">Likely eligible</option>
                                            <option value="possibly_eligible">
                                                Possibly eligible
                                            </option>
                                            <option value="not_eligible">Not eligible</option>
                                            <option value="national_lab_only">
                                                National lab only
                                            </option>
                                            <option value="industry_only">Industry only</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Is FIT eligible?
                                        </label>
                                        <select
                                            value={fitInstitutionEligible}
                                            onChange={(event) =>
                                                setFitInstitutionEligible(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        >
                                            <option value="unknown">Unknown</option>
                                            <option value="yes">Yes</option>
                                            <option value="likely">Likely</option>
                                            <option value="maybe">Maybe, needs review</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            University allowed?
                                        </label>
                                        <select
                                            value={universityAllowed}
                                            onChange={(event) =>
                                                setUniversityAllowed(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        >
                                            <option value="unknown">Unknown</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Lead applicant allowed?
                                        </label>
                                        <select
                                            value={leadApplicantAllowed}
                                            onChange={(event) =>
                                                setLeadApplicantAllowed(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        >
                                            <option value="unknown">Unknown</option>
                                            <option value="yes">Yes</option>
                                            <option value="likely">Likely</option>
                                            <option value="maybe">Maybe</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Subaward allowed?
                                        </label>
                                        <select
                                            value={subawardAllowed}
                                            onChange={(event) =>
                                                setSubawardAllowed(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        >
                                            <option value="unknown">Unknown</option>
                                            <option value="yes">Yes</option>
                                            <option value="likely">Likely</option>
                                            <option value="maybe">Maybe</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Proposal priority
                                        </label>
                                        <select
                                            value={proposalPriority}
                                            onChange={(event) =>
                                                setProposalPriority(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        >
                                            <option value="unassigned">Unassigned</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Go / no-go decision
                                        </label>
                                        <select
                                            value={decisionStatus}
                                            onChange={(event) =>
                                                setDecisionStatus(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        >
                                            <option value="undecided">Undecided</option>
                                            <option value="go">Go</option>
                                            <option value="no_go">No-go</option>
                                            <option value="watch">Watch</option>
                                            <option value="collaborate_only">
                                                Collaborate only
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Urgency level
                                        </label>
                                        <select
                                            value={urgencyLevel}
                                            onChange={(event) => setUrgencyLevel(event.target.value)}
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        >
                                            <option value="unknown">Unknown</option>
                                            <option value="overdue">Overdue</option>
                                            <option value="urgent_0_14_days">Urgent, 0–14 days</option>
                                            <option value="soon_15_45_days">Soon, 15–45 days</option>
                                            <option value="medium_46_90_days">Medium, 46–90 days</option>
                                            <option value="later_90_plus_days">Later, 90+ days</option>
                                            <option value="no_deadline">No deadline</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <label className="flex items-center gap-3 text-sm text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={nationalLabOnly}
                                            onChange={(event) =>
                                                setNationalLabOnly(event.target.checked)
                                            }
                                        />
                                        National lab only
                                    </label>

                                    <label className="flex items-center gap-3 text-sm text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={industryRequired}
                                            onChange={(event) =>
                                                setIndustryRequired(event.target.checked)
                                            }
                                        />
                                        Industry partner required
                                    </label>
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Eligible institution types
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={eligibleInstitutionTypes}
                                        onChange={(event) =>
                                            setEligibleInstitutionTypes(event.target.value)
                                        }
                                        placeholder="Institutions of higher education, nonprofits, national labs, industry, state agencies..."
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Eligibility notes
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={eligibilityNotes}
                                        onChange={(event) => setEligibilityNotes(event.target.value)}
                                        placeholder="Explain why FIT is eligible, likely eligible, or not eligible. Note if a national lab must lead."
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-8 grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Budget min
                                        </label>
                                        <input
                                            type="number"
                                            value={budgetMin}
                                            onChange={(event) => setBudgetMin(event.target.value)}
                                            placeholder="300000"
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Budget max
                                        </label>
                                        <input
                                            type="number"
                                            value={budgetMax}
                                            onChange={(event) => setBudgetMax(event.target.value)}
                                            placeholder="750000"
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Award floor
                                        </label>
                                        <input
                                            type="number"
                                            value={awardFloor}
                                            onChange={(event) => setAwardFloor(event.target.value)}
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Award ceiling
                                        </label>
                                        <input
                                            type="number"
                                            value={awardCeiling}
                                            onChange={(event) => setAwardCeiling(event.target.value)}
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Expected number of awards
                                        </label>
                                        <input
                                            type="number"
                                            value={expectedNumberOfAwards}
                                            onChange={(event) =>
                                                setExpectedNumberOfAwards(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Total program funding
                                        </label>
                                        <input
                                            type="number"
                                            value={totalProgramFunding}
                                            onChange={(event) =>
                                                setTotalProgramFunding(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Budget text
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={budgetText}
                                        onChange={(event) => setBudgetText(event.target.value)}
                                        placeholder="$300,000 to $750,000 over 24 to 36 months..."
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-5 grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Cost share required?
                                        </label>
                                        <select
                                            value={costShareRequired}
                                            onChange={(event) =>
                                                setCostShareRequired(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        >
                                            <option value="unknown">Unknown</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Cost share percent
                                        </label>
                                        <input
                                            type="number"
                                            value={costSharePercent}
                                            onChange={(event) =>
                                                setCostSharePercent(event.target.value)
                                            }
                                            placeholder="20"
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Cost share notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={costShareText}
                                        onChange={(event) => setCostShareText(event.target.value)}
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-8 grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Duration, months
                                        </label>
                                        <input
                                            type="number"
                                            value={projectDurationMonths}
                                            onChange={(event) =>
                                                setProjectDurationMonths(event.target.value)
                                            }
                                            placeholder="36"
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Duration text
                                        </label>
                                        <input
                                            type="text"
                                            value={projectDurationText}
                                            onChange={(event) =>
                                                setProjectDurationText(event.target.value)
                                            }
                                            placeholder="24 to 36 months"
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            LOI deadline
                                        </label>
                                        <input
                                            type="date"
                                            value={loiDeadline}
                                            onChange={(event) => setLoiDeadline(event.target.value)}
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Preproposal deadline
                                        </label>
                                        <input
                                            type="date"
                                            value={preproposalDeadline}
                                            onChange={(event) =>
                                                setPreproposalDeadline(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Concept paper deadline
                                        </label>
                                        <input
                                            type="date"
                                            value={conceptPaperDeadline}
                                            onChange={(event) =>
                                                setConceptPaperDeadline(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Full proposal deadline
                                        </label>
                                        <input
                                            type="date"
                                            value={fullProposalDeadline}
                                            onChange={(event) =>
                                                setFullProposalDeadline(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Internal routing deadline
                                        </label>
                                        <input
                                            type="date"
                                            value={internalRoutingDeadline}
                                            onChange={(event) =>
                                                setInternalRoutingDeadline(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Registration deadline
                                        </label>
                                        <input
                                            type="date"
                                            value={registrationDeadline}
                                            onChange={(event) =>
                                                setRegistrationDeadline(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Submission portal
                                        </label>
                                        <input
                                            type="text"
                                            value={submissionPortal}
                                            onChange={(event) =>
                                                setSubmissionPortal(event.target.value)
                                            }
                                            placeholder="Research.gov, Grants.gov, EERE eXCHANGE..."
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-300">
                                            Assistance listing number
                                        </label>
                                        <input
                                            type="text"
                                            value={assistanceListingNumber}
                                            onChange={(event) =>
                                                setAssistanceListingNumber(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Required documents
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={requiredDocuments}
                                        onChange={(event) =>
                                            setRequiredDocuments(event.target.value)
                                        }
                                        placeholder="Project summary, project description, budget, budget justification, biosketches, current and pending, facilities, data management plan..."
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Team requirements
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={teamRequirements}
                                        onChange={(event) => setTeamRequirements(event.target.value)}
                                        placeholder="National lab lead, industry partner, multi-PI team, cost-share partner..."
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Go / no-go notes
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={goNoGoNotes}
                                        onChange={(event) => setGoNoGoNotes(event.target.value)}
                                        placeholder="Why should this be pursued or ignored? What evidence is still needed?"
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-5">
                                    <label className="text-sm font-medium text-slate-300">
                                        Call intelligence summary
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={callIntelligenceSummary}
                                        onChange={(event) =>
                                            setCallIntelligenceSummary(event.target.value)
                                        }
                                        placeholder="Short summary of eligibility, budget, duration, key deadlines, and submission requirements."
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400"
                                    />
                                </div>

                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={handleSaveCallIntelligence}
                                        disabled={savingCallIntel}
                                        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingCallIntel
                                            ? "Saving..."
                                            : "Save Eligibility & Timeline"}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Opportunity Summary</h3>
                                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                    {opportunity.summary || "No summary provided."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Eligibility</h3>
                                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                    {opportunity.eligibility ||
                                        "No eligibility information provided."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Full Text / Notes</h3>
                                <p className="mt-4 max-h-[500px] overflow-y-auto whitespace-pre-line rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
                                    {opportunity.full_text || "No full text or notes provided."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold">Proposal Tasks</h3>
                                        <p className="mt-2 text-sm text-slate-400">
                                            Generate and track proposal preparation tasks for this
                                            opportunity.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGenerateTasks}
                                        disabled={generatingTasks || tasks.length > 0}
                                        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {generatingTasks
                                            ? "Generating..."
                                            : tasks.length > 0
                                                ? "Tasks Generated"
                                                : "Generate Proposal Tasks"}
                                    </button>
                                </div>

                                {tasks.length === 0 && (
                                    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                                        No proposal tasks generated yet.
                                    </div>
                                )}

                                {tasks.length > 0 && (
                                    <div className="mt-6 space-y-4">
                                        {tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">
                                                            {task.task_title}
                                                        </h4>
                                                        <p className="mt-2 text-sm leading-6 text-slate-400">
                                                            {task.task_description ||
                                                                "No task description provided."}
                                                        </p>
                                                    </div>

                                                    <span className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300">
                                                        {task.priority || "medium"}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                                                    <p>
                                                        <span className="text-slate-500">Owner:</span>{" "}
                                                        {task.owner || "Not assigned"}
                                                    </p>

                                                    <p>
                                                        <span className="text-slate-500">Due:</span>{" "}
                                                        {task.due_date || "Not set"}
                                                    </p>

                                                    <div>
                                                        <label className="text-slate-500">Status:</label>
                                                        <select
                                                            value={task.status || "todo"}
                                                            onChange={(event) =>
                                                                handleUpdateTaskStatus(
                                                                    task.id,
                                                                    event.target.value
                                                                )
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
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                <h3 className="text-xl font-semibold">Latest Fit Score</h3>

                                {!match && (
                                    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                                        This opportunity has not been scored yet.
                                        <div className="mt-4">
                                            <a
                                                href="/funding"
                                                className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                                            >
                                                Score in Funding Radar
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {match && (
                                    <div className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 p-5">
                                        <p className="text-sm text-emerald-300">
                                            {getScoreLabel(match.total_score)}
                                        </p>

                                        <div className="mt-2 flex items-end gap-2">
                                            <p className="text-5xl font-bold">
                                                {match.total_score ?? 0}
                                            </p>
                                            <p className="pb-2 text-sm text-slate-400">/100</p>
                                        </div>

                                        <p className="mt-4 text-sm leading-6 text-slate-300">
                                            {getScoreDescription(match.total_score)}
                                        </p>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                Scoring method:{" "}
                                                {match.scoring_method || "rule_based_v1"}
                                            </span>

                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                Scored: {formatDateTime(match.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {scoreHistory.length > 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                    <h3 className="text-xl font-semibold">Score History</h3>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Compare previous scoring runs for this funding opportunity.
                                    </p>

                                    <div className="mt-5 space-y-4">
                                        {scoreHistory.map((score, index) => (
                                            <div
                                                key={score.id}
                                                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                                {index === 0 ? "Latest" : `Run ${index + 1}`}
                                                            </span>

                                                            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                                                                {score.scoring_method || "rule_based_v1"}
                                                            </span>
                                                        </div>

                                                        <p className="mt-3 text-sm text-slate-400">
                                                            {formatDateTime(score.created_at)}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col gap-3 sm:items-end">
                                                        <div className="rounded-xl border border-slate-700 px-4 py-3 text-center">
                                                            <p className="text-xs text-slate-400">Score</p>
                                                            <p className="text-2xl font-bold">
                                                                {score.total_score ?? 0}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteScore(score.id)}
                                                            disabled={deletingScoreId === score.id}
                                                            className="rounded-xl border border-red-900 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {deletingScoreId === score.id
                                                                ? "Deleting..."
                                                                : "Delete Score"}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
                                                    <p>PI alignment: {score.pi_alignment}/20</p>
                                                    <p>Agency fit: {score.agency_fit}/20</p>
                                                    <p>Novelty: {score.novelty}/15</p>
                                                    <p>
                                                        Preliminary data:{" "}
                                                        {score.preliminary_data_readiness}/15
                                                    </p>
                                                    <p>Team readiness: {score.team_readiness}/10</p>
                                                    <p>
                                                        Budget/scope: {score.budget_scope_feasibility}/10
                                                    </p>
                                                    <p>
                                                        Deadline feasibility: {score.deadline_feasibility}/5
                                                    </p>
                                                    <p>
                                                        Tenure value: {score.tenure_strategy_value}/5
                                                    </p>
                                                </div>

                                                {score.fit_reason && (
                                                    <p className="mt-4 text-sm leading-6 text-slate-300">
                                                        {score.fit_reason}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {match && (
                                <>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                        <h3 className="text-xl font-semibold">Score Breakdown</h3>

                                        <div className="mt-5 space-y-3 text-sm text-slate-300">
                                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                                <span>PI research alignment</span>
                                                <span>{match.pi_alignment}/20</span>
                                            </div>

                                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                                <span>Agency/program fit</span>
                                                <span>{match.agency_fit}/20</span>
                                            </div>

                                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                                <span>Novelty</span>
                                                <span>{match.novelty}/15</span>
                                            </div>

                                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                                <span>Preliminary data readiness</span>
                                                <span>{match.preliminary_data_readiness}/15</span>
                                            </div>

                                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                                <span>Team readiness</span>
                                                <span>{match.team_readiness}/10</span>
                                            </div>

                                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                                <span>Budget/scope feasibility</span>
                                                <span>{match.budget_scope_feasibility}/10</span>
                                            </div>

                                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                                <span>Deadline feasibility</span>
                                                <span>{match.deadline_feasibility}/5</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span>Tenure-strategy value</span>
                                                <span>{match.tenure_strategy_value}/5</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                        <h3 className="text-xl font-semibold">Fit Reason</h3>
                                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                            {match.fit_reason || "No fit reason provided."}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                        <h3 className="text-xl font-semibold">
                                            Recommended Actions
                                        </h3>
                                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                            {match.recommended_actions ||
                                                "No recommended actions provided."}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                        <h3 className="text-xl font-semibold">Risks</h3>
                                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                            {match.risks || "No risks provided."}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                        <h3 className="text-xl font-semibold">Suggested Title</h3>
                                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                            {match.suggested_title || "No suggested title provided."}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                        <h3 className="text-xl font-semibold">Proposal Framing</h3>
                                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                            {match.likely_framing ||
                                                "No proposal framing provided."}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                                        <h3 className="text-xl font-semibold">
                                            Required Collaborators
                                        </h3>
                                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                                            {match.required_collaborators ||
                                                "No collaborator recommendation provided."}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}