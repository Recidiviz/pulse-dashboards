// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

export type SeverityLevel = "none" | "low" | "med" | "mild" | "severe" | null;

export interface TranscriptMessage {
  role: string;
  content: string;
  section: string | null;
  created_at: string;
}

// New issue feedback structure
export interface IssueFeedback {
  severity: SeverityLevel;
  notes: string | null;
}

export interface OverallComponentFeedback {
  factual: IssueFeedback;
  tone: IssueFeedback;
  other: IssueFeedback;
}

// Summary detail feedback types
export interface SummaryNeedsRisksFeedback {
  facts_incorrect: IssueFeedback;
  facts_missing: IssueFeedback;
  tone_issues: IssueFeedback;
  other: IssueFeedback;
}

export interface SummaryNeedsSectionFeedback {
  needs_not_justified: IssueFeedback;
  needs_missing: IssueFeedback;
  other: IssueFeedback;
}

export interface SummaryFinalThoughtsFeedback {
  statements_not_supported: IssueFeedback;
  other: IssueFeedback;
}

export interface SummaryDetailFeedback {
  needs_risks_overview: Record<string, SummaryNeedsRisksFeedback>;
  priority_needs: SummaryNeedsSectionFeedback;
  longer_term_needs: SummaryNeedsSectionFeedback;
  final_thoughts: SummaryFinalThoughtsFeedback;
}

// Plan detail feedback types
export interface PlanSectionFeedback {
  recommendation_groundedness: IssueFeedback;
  unsound_recommendation: IssueFeedback;
  obvious_incoherence: IssueFeedback;
  missing_incomplete_sections: IssueFeedback;
  other: IssueFeedback;
}

export interface PlanDetailFeedback {
  sections: Record<string, PlanSectionFeedback>;
}

// Parsed sections from markdown
export interface SummarySection {
  name: string;
  content: string;
  categories: string[];
}

export interface PlanSection {
  name: string;
  content: string;
}

export interface LabelingFeedback {
  id: string;
  created_at: string;
  updated_at: string;
  intake_id: string;
  plan_id: string | null;
  evaluator: string;
  // New structure
  transcript_feedback: OverallComponentFeedback;
  summary_feedback: OverallComponentFeedback;
  plan_feedback: OverallComponentFeedback;
  summary_detail_feedback: SummaryDetailFeedback | null;
  plan_detail_feedback: PlanDetailFeedback | null;
  // Legacy fields
  transcript_needs_review: boolean;
  transcript_severity: SeverityLevel;
  transcript_notes: string | null;
  summary_needs_review: boolean;
  summary_severity: SeverityLevel;
  summary_notes: string | null;
  plan_needs_review: boolean;
  plan_severity: SeverityLevel;
  plan_notes: string | null;
  overall_notes: string | null;
}

export interface RecordListItem {
  intake_id: string;
  plan_id: string | null;
  client_pseudo_id: string | null;
  intake_created_at: string;
  intake_completed_at: string | null;
  intake_status: string;
  has_feedback: boolean;
  feedback_evaluators: string[];
}

export interface RecordDetail {
  intake_id: string;
  plan_id: string | null;
  client_pseudo_id: string | null;
  intake_created_at: string;
  completed_at: string | null;
  state_code: string | null;
  transcript_messages: TranscriptMessage[];
  summary_markdown: string | null;
  summary_sections: SummarySection[];
  action_plan_markdown: string | null;
  plan_sections: PlanSection[];
  existing_feedback: LabelingFeedback | null;
}

export interface FeedbackSubmission {
  intake_id: string;
  plan_id: string | null;
  evaluator: string;
  // New structure
  transcript_feedback?: TranscriptFeedback;
  summary_feedback?: OverallComponentFeedback;
  plan_feedback?: OverallComponentFeedback;
  summary_detail_feedback?: SummaryDetailFeedback;
  plan_detail_feedback?: PlanDetailFeedback;
  // Legacy fields
  transcript_needs_review?: boolean;
  transcript_severity?: SeverityLevel;
  transcript_notes?: string | null;
  summary_needs_review?: boolean;
  summary_severity?: SeverityLevel;
  summary_notes?: string | null;
  plan_needs_review?: boolean;
  plan_severity?: SeverityLevel;
  plan_notes?: string | null;
  overall_notes?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface LabelingStats {
  total_feedback_records: number;
  unique_intakes_labeled: number;
  records_with_issues: number;
  records_with_severe_issues: number;
  by_evaluator: Record<string, number>;
  by_component: Record<string, number>;
  by_issue_type: Record<string, number>;
  severity_distribution: Record<string, number>;
}

export interface FeedbackListItem {
  id: string;
  intake_id: string;
  evaluator: string;
  created_at: string;
  updated_at: string;
  highest_severity: string;
  components_with_issues: string[];
  overall_notes: string | null;
}

// New transcript-specific feedback types
export type TranscriptSeverity = "none" | "mild" | "severe" | null;

export interface TranscriptCriterionFeedback {
  severity: TranscriptSeverity;
  notes: string | null;
}

export interface TranscriptFeedback {
  // General criteria (all transcripts)
  danger_indication: TranscriptCriterionFeedback;
  toxic_language: TranscriptCriterionFeedback;
  inappropriate_topic: TranscriptCriterionFeedback;
  user_frustration: TranscriptCriterionFeedback;
  major_output_error: TranscriptCriterionFeedback;
  chatbot_misunderstanding: TranscriptCriterionFeedback;
  looping_questions: TranscriptCriterionFeedback;
  skipping_questions: TranscriptCriterionFeedback;
  other: TranscriptCriterionFeedback;
  // Audio-only criteria
  number_of_speakers: string | null;
  audio_quality: TranscriptCriterionFeedback;
  transcription_quality: TranscriptCriterionFeedback;
  audio_other_notes: string | null;
}

// Helper to create default issue feedback
export function createDefaultIssueFeedback(): IssueFeedback {
  return { severity: null, notes: null }; // null = no selection yet
}

// Helper to create default overall component feedback
export function createDefaultOverallComponentFeedback(): OverallComponentFeedback {
  return {
    factual: createDefaultIssueFeedback(),
    tone: createDefaultIssueFeedback(),
    other: createDefaultIssueFeedback(),
  };
}

// Helper to create default summary needs/risks feedback
export function createDefaultSummaryNeedsRisksFeedback(): SummaryNeedsRisksFeedback {
  return {
    facts_incorrect: createDefaultIssueFeedback(),
    facts_missing: createDefaultIssueFeedback(),
    tone_issues: createDefaultIssueFeedback(),
    other: createDefaultIssueFeedback(),
  };
}

// Helper to create default summary needs section feedback
export function createDefaultSummaryNeedsSectionFeedback(): SummaryNeedsSectionFeedback {
  return {
    needs_not_justified: createDefaultIssueFeedback(),
    needs_missing: createDefaultIssueFeedback(),
    other: createDefaultIssueFeedback(),
  };
}

// Helper to create default summary final thoughts feedback
export function createDefaultSummaryFinalThoughtsFeedback(): SummaryFinalThoughtsFeedback {
  return {
    statements_not_supported: createDefaultIssueFeedback(),
    other: createDefaultIssueFeedback(),
  };
}

// Helper to create default plan section feedback
export function createDefaultPlanSectionFeedback(): PlanSectionFeedback {
  return {
    recommendation_groundedness: createDefaultIssueFeedback(),
    unsound_recommendation: createDefaultIssueFeedback(),
    obvious_incoherence: createDefaultIssueFeedback(),
    missing_incomplete_sections: createDefaultIssueFeedback(),
    other: createDefaultIssueFeedback(),
  };
}

// Helper to create default transcript criterion feedback
export function createDefaultTranscriptCriterionFeedback(): TranscriptCriterionFeedback {
  return { severity: null, notes: null };
}

// Helper to create default transcript feedback
export function createDefaultTranscriptFeedback(): TranscriptFeedback {
  return {
    danger_indication: createDefaultTranscriptCriterionFeedback(),
    toxic_language: createDefaultTranscriptCriterionFeedback(),
    inappropriate_topic: createDefaultTranscriptCriterionFeedback(),
    user_frustration: createDefaultTranscriptCriterionFeedback(),
    major_output_error: createDefaultTranscriptCriterionFeedback(),
    chatbot_misunderstanding: createDefaultTranscriptCriterionFeedback(),
    looping_questions: createDefaultTranscriptCriterionFeedback(),
    skipping_questions: createDefaultTranscriptCriterionFeedback(),
    other: createDefaultTranscriptCriterionFeedback(),
    number_of_speakers: null,
    audio_quality: createDefaultTranscriptCriterionFeedback(),
    transcription_quality: createDefaultTranscriptCriterionFeedback(),
    audio_other_notes: null,
  };
}
