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

import { useEffect, useState } from "react";

import { getFeedback } from "../api/client";
import type {
  FeedbackListItem,
  IssueFeedback,
  LabelingFeedback,
  OverrideFeedback,
} from "../types";

const TRANSCRIPT_KEYS: Record<string, string> = {
  danger_indication: "Danger",
  toxic_language: "Toxic",
  inappropriate_topic: "Inappropriate",
  user_frustration: "Frustration",
  major_output_error: "Output Error",
  chatbot_misunderstanding: "Misunderstand",
  looping_questions: "Looping",
  skipping_questions: "Skipping",
  other: "Other",
};

const OVERALL_KEYS: Record<string, string> = {
  factual: "Factual",
  tone: "Tone",
  other: "Other",
};

const SUMMARY_DETAIL_KEYS: Record<string, string> = {
  facts_incorrect: "Facts Incorrect",
  facts_missing: "Facts Missing",
  tone_issues: "Tone Issues",
  other: "Other",
};

const SUMMARY_NEEDS_KEYS: Record<string, string> = {
  needs_not_justified: "Not Justified",
  needs_missing: "Missing",
  other: "Other",
};

const PLAN_SECTION_KEYS: Record<string, string> = {
  recommendation_groundedness: "Groundedness",
  unsound_recommendation: "Unsound",
  obvious_incoherence: "Incoherence",
  missing_incomplete_sections: "Missing/Incomplete",
  other: "Other",
};

function hasAnyIssueInRecord(record: Record<string, IssueFeedback>): boolean {
  return Object.values(record).some(
    (issue) => (issue?.severity && issue.severity !== "none") || !!issue?.notes,
  );
}

function hasAnyIssueInComponent(component: {
  factual?: IssueFeedback;
  tone?: IssueFeedback;
  other?: IssueFeedback;
}): boolean {
  return [component.factual, component.tone, component.other].some(
    (issue) => (issue?.severity && issue.severity !== "none") || !!issue?.notes,
  );
}

function hasAnyOverride(override: OverrideFeedback): boolean {
  if (override.notes) return true;
  if (
    override.transcript_detail_feedback &&
    hasAnyIssueInRecord(override.transcript_detail_feedback)
  )
    return true;
  if (
    override.summary_feedback &&
    hasAnyIssueInComponent(override.summary_feedback)
  )
    return true;
  if (override.plan_feedback && hasAnyIssueInComponent(override.plan_feedback))
    return true;
  if (override.summary_detail_feedback) return true;
  if (
    override.plan_detail_feedback?.sections &&
    Object.keys(override.plan_detail_feedback.sections).length > 0
  )
    return true;
  return false;
}

interface FeedbackDetailProps {
  feedbackItem: FeedbackListItem;
  onBack: () => void;
  onOpenLabeling: (intakeId: string, evaluator: string) => void;
}

function FeedbackDetail({
  feedbackItem,
  onBack,
  onOpenLabeling,
}: FeedbackDetailProps) {
  const [feedback, setFeedback] = useState<LabelingFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const results = await getFeedback(
        feedbackItem.intake_id,
        feedbackItem.evaluator,
      );
      if (results.length > 0) {
        setFeedback(results[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [feedbackItem.intake_id, feedbackItem.evaluator]);

  const severityColor = (severity: string | null) => {
    switch (severity) {
      case "severe":
        return "#dc2626";
      case "med":
        return "#f97316";
      case "low":
        return "#fbbf24";
      case "none":
        return "#9ca3af";
      default:
        return "#e0e0e0";
    }
  };

  const renderSeverityBadge = (severity: string | null) => (
    <span
      style={{
        display: "inline-block",
        padding: "0.125rem 0.5rem",
        borderRadius: "4px",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "white",
        background: severityColor(severity),
      }}
    >
      {severity || "none"}
    </span>
  );

  const renderIssueRow = (
    label: string,
    severity: string | null,
    notes: string | null,
    labelWidth = "80px",
  ) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.25rem 0",
      }}
    >
      <span
        style={{
          width: labelWidth,
          flexShrink: 0,
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#666",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {renderSeverityBadge(severity)}
      {notes && (
        <span style={{ fontSize: "0.8125rem", color: "#333" }}>{notes}</span>
      )}
    </div>
  );

  // Helper to check if an issue has any content
  const hasIssue = (issue: IssueFeedback | undefined | null): boolean => {
    if (!issue) return false;
    return (
      (issue.severity !== null && issue.severity !== "none") || !!issue.notes
    );
  };

  // Render a subsection with a category/section name
  const renderSubsection = (
    title: string,
    issues: { label: string; issue: IssueFeedback | undefined | null }[],
  ) => {
    const relevantIssues = issues.filter(({ issue }) => hasIssue(issue));
    if (relevantIssues.length === 0) return null;

    return (
      <div style={{ marginBottom: "0.75rem" }}>
        <div
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "#333",
            marginBottom: "0.25rem",
            borderBottom: "1px solid #e0e0e0",
            paddingBottom: "0.25rem",
          }}
        >
          {title}
        </div>
        {relevantIssues.map(({ label, issue }) =>
          renderIssueRow(
            label,
            issue?.severity ?? null,
            issue?.notes ?? null,
            "140px",
          ),
        )}
      </div>
    );
  };

  const renderOverrideSubsection = (
    title: string,
    keyMap: Record<string, string>,
    data: Record<string, IssueFeedback>,
  ) => {
    const entries = Object.entries(keyMap).filter(([key]) => {
      const issue = data[key];
      return (
        issue && ((issue.severity && issue.severity !== "none") || issue.notes)
      );
    });
    if (entries.length === 0) return null;

    return (
      <div style={{ marginBottom: "0.75rem" }}>
        <div
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "#92400e",
            marginBottom: "0.25rem",
            borderBottom: "1px solid #fbbf24",
            paddingBottom: "0.25rem",
          }}
        >
          {title}
        </div>
        {entries.map(([key, label]) =>
          renderIssueRow(
            label,
            data[key]?.severity ?? null,
            data[key]?.notes ?? null,
            "140px",
          ),
        )}
      </div>
    );
  };

  const renderOverrideSummaryDetails = (
    details: NonNullable<OverrideFeedback["summary_detail_feedback"]>,
  ) => {
    const sections: React.ReactNode[] = [];

    if (details.needs_risks_overview) {
      for (const [category, catFeedback] of Object.entries(
        details.needs_risks_overview,
      )) {
        if (
          catFeedback &&
          hasAnyIssueInRecord(
            catFeedback as unknown as Record<string, IssueFeedback>,
          )
        ) {
          const el = renderOverrideSubsection(
            category,
            SUMMARY_DETAIL_KEYS,
            catFeedback as unknown as Record<string, IssueFeedback>,
          );
          if (el) sections.push(<div key={category}>{el}</div>);
        }
      }
    }

    if (details.priority_needs) {
      const el = renderOverrideSubsection(
        "Priority Needs",
        SUMMARY_NEEDS_KEYS,
        details.priority_needs as unknown as Record<string, IssueFeedback>,
      );
      if (el) sections.push(<div key="priority_needs">{el}</div>);
    }

    if (details.longer_term_needs) {
      const el = renderOverrideSubsection(
        "Longer-term Needs",
        SUMMARY_NEEDS_KEYS,
        details.longer_term_needs as unknown as Record<string, IssueFeedback>,
      );
      if (el) sections.push(<div key="longer_term_needs">{el}</div>);
    }

    if (details.final_thoughts) {
      const el = renderOverrideSubsection(
        "Final Thoughts",
        { statements_not_supported: "Not Supported", other: "Other" },
        details.final_thoughts as unknown as Record<string, IssueFeedback>,
      );
      if (el) sections.push(<div key="final_thoughts">{el}</div>);
    }

    if (sections.length === 0) return null;
    return <>{sections}</>;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderOverridePlanDetails = (sections: Record<string, any>) => {
    const els: React.ReactNode[] = [];
    for (const [sectionName, sectionFeedback] of Object.entries(sections)) {
      if (sectionFeedback && hasAnyIssueInRecord(sectionFeedback)) {
        const el = renderOverrideSubsection(
          sectionName,
          PLAN_SECTION_KEYS,
          sectionFeedback,
        );
        if (el) els.push(<div key={sectionName}>{el}</div>);
      }
    }
    if (els.length === 0) return null;
    return <>{els}</>;
  };

  if (loading)
    return <div className="loading">Loading feedback details...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!feedback)
    return <div className="empty-content">Feedback not found.</div>;

  return (
    <div className="feedback-detail">
      <div className="feedback-detail-header">
        <button className="back-btn" onClick={onBack}>
          Back to Browser
        </button>
        <h2>Feedback Detail</h2>
        <button
          className="refresh-btn"
          onClick={() =>
            onOpenLabeling(feedbackItem.intake_id, feedbackItem.evaluator)
          }
        >
          Open in Labeling View
        </button>
      </div>

      <div className="feedback-detail-meta">
        <div>
          <strong>Intake ID:</strong> <code>{feedback.intake_id}</code>
        </div>
        <div>
          <strong>Evaluator:</strong> {feedback.evaluator}
        </div>
        <div>
          <strong>Reviewed:</strong>{" "}
          {new Date(feedback.created_at).toLocaleString()}
        </div>
        <div>
          <strong>Updated:</strong>{" "}
          {new Date(feedback.updated_at).toLocaleString()}
        </div>
      </div>

      <div className="feedback-detail-grid">
        <div className="feedback-detail-section">
          <h3>Transcript</h3>
          {feedback.transcript_feedback ? (
            <>
              {renderIssueRow(
                "Danger",
                feedback.transcript_feedback.danger_indication?.severity ??
                  null,
                feedback.transcript_feedback.danger_indication?.notes ?? null,
              )}
              {renderIssueRow(
                "Toxic",
                feedback.transcript_feedback.toxic_language?.severity ?? null,
                feedback.transcript_feedback.toxic_language?.notes ?? null,
              )}
              {renderIssueRow(
                "Inappropriate",
                feedback.transcript_feedback.inappropriate_topic?.severity ??
                  null,
                feedback.transcript_feedback.inappropriate_topic?.notes ?? null,
              )}
              {renderIssueRow(
                "Frustration",
                feedback.transcript_feedback.user_frustration?.severity ?? null,
                feedback.transcript_feedback.user_frustration?.notes ?? null,
              )}
              {renderIssueRow(
                "Output Error",
                feedback.transcript_feedback.major_output_error?.severity ??
                  null,
                feedback.transcript_feedback.major_output_error?.notes ?? null,
              )}
              {renderIssueRow(
                "Misunderstand",
                feedback.transcript_feedback.chatbot_misunderstanding
                  ?.severity ?? null,
                feedback.transcript_feedback.chatbot_misunderstanding?.notes ??
                  null,
              )}
              {renderIssueRow(
                "Looping",
                feedback.transcript_feedback.looping_questions?.severity ??
                  null,
                feedback.transcript_feedback.looping_questions?.notes ?? null,
              )}
              {renderIssueRow(
                "Skipping",
                feedback.transcript_feedback.skipping_questions?.severity ??
                  null,
                feedback.transcript_feedback.skipping_questions?.notes ?? null,
              )}
              {renderIssueRow(
                "Other",
                feedback.transcript_feedback.other?.severity ?? null,
                feedback.transcript_feedback.other?.notes ?? null,
              )}
            </>
          ) : (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              No transcript feedback
            </p>
          )}
        </div>

        <div className="feedback-detail-section">
          <h3>Summary (Overall)</h3>
          {feedback.summary_feedback ? (
            <>
              {renderIssueRow(
                "Factual",
                feedback.summary_feedback.factual?.severity ?? null,
                feedback.summary_feedback.factual?.notes ?? null,
              )}
              {renderIssueRow(
                "Tone",
                feedback.summary_feedback.tone?.severity ?? null,
                feedback.summary_feedback.tone?.notes ?? null,
              )}
              {renderIssueRow(
                "Other",
                feedback.summary_feedback.other?.severity ?? null,
                feedback.summary_feedback.other?.notes ?? null,
              )}
            </>
          ) : (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              No summary feedback
            </p>
          )}
        </div>

        <div className="feedback-detail-section">
          <h3>Action Plan (Overall)</h3>
          {feedback.plan_feedback ? (
            <>
              {renderIssueRow(
                "Factual",
                feedback.plan_feedback.factual?.severity ?? null,
                feedback.plan_feedback.factual?.notes ?? null,
              )}
              {renderIssueRow(
                "Tone",
                feedback.plan_feedback.tone?.severity ?? null,
                feedback.plan_feedback.tone?.notes ?? null,
              )}
              {renderIssueRow(
                "Other",
                feedback.plan_feedback.other?.severity ?? null,
                feedback.plan_feedback.other?.notes ?? null,
              )}
            </>
          ) : (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              No plan feedback
            </p>
          )}
        </div>
      </div>

      {/* Summary Detail Feedback */}
      {feedback.summary_detail_feedback && (
        <div className="feedback-detail-section" style={{ marginTop: "1rem" }}>
          <h3>Summary Details</h3>

          {/* Needs & Risks Overview - dynamic categories */}
          {feedback.summary_detail_feedback.needs_risks_overview &&
            Object.entries(
              feedback.summary_detail_feedback.needs_risks_overview,
            ).map(([category, categoryFeedback]) =>
              renderSubsection(category, [
                {
                  label: "Facts Incorrect",
                  issue: categoryFeedback?.facts_incorrect,
                },
                {
                  label: "Facts Missing",
                  issue: categoryFeedback?.facts_missing,
                },
                { label: "Tone Issues", issue: categoryFeedback?.tone_issues },
                { label: "Other", issue: categoryFeedback?.other },
              ]),
            )}

          {/* Priority Needs */}
          {renderSubsection("Priority Needs", [
            {
              label: "Not Justified",
              issue:
                feedback.summary_detail_feedback.priority_needs
                  ?.needs_not_justified,
            },
            {
              label: "Missing",
              issue:
                feedback.summary_detail_feedback.priority_needs?.needs_missing,
            },
            {
              label: "Other",
              issue: feedback.summary_detail_feedback.priority_needs?.other,
            },
          ])}

          {/* Longer-term Needs */}
          {renderSubsection("Longer-term Needs", [
            {
              label: "Not Justified",
              issue:
                feedback.summary_detail_feedback.longer_term_needs
                  ?.needs_not_justified,
            },
            {
              label: "Missing",
              issue:
                feedback.summary_detail_feedback.longer_term_needs
                  ?.needs_missing,
            },
            {
              label: "Other",
              issue: feedback.summary_detail_feedback.longer_term_needs?.other,
            },
          ])}

          {/* Final Thoughts */}
          {renderSubsection("Final Thoughts", [
            {
              label: "Not Supported",
              issue:
                feedback.summary_detail_feedback.final_thoughts
                  ?.statements_not_supported,
            },
            {
              label: "Other",
              issue: feedback.summary_detail_feedback.final_thoughts?.other,
            },
          ])}
        </div>
      )}

      {/* Plan Detail Feedback */}
      {feedback.plan_detail_feedback?.sections &&
        Object.keys(feedback.plan_detail_feedback.sections).length > 0 && (
          <div
            className="feedback-detail-section"
            style={{ marginTop: "1rem" }}
          >
            <h3>Action Plan Details</h3>
            {Object.entries(feedback.plan_detail_feedback.sections).map(
              ([sectionName, sectionFeedback]) =>
                renderSubsection(sectionName, [
                  {
                    label: "Groundedness",
                    issue: sectionFeedback?.recommendation_groundedness,
                  },
                  {
                    label: "Unsound",
                    issue: sectionFeedback?.unsound_recommendation,
                  },
                  {
                    label: "Incoherence",
                    issue: sectionFeedback?.obvious_incoherence,
                  },
                  {
                    label: "Missing/Incomplete",
                    issue: sectionFeedback?.missing_incomplete_sections,
                  },
                  { label: "Other", issue: sectionFeedback?.other },
                ]),
            )}
          </div>
        )}

      {feedback.overall_notes && (
        <div className="feedback-detail-section">
          <h3>Overall Notes</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{feedback.overall_notes}</p>
        </div>
      )}

      {feedback.override_feedback &&
        hasAnyOverride(feedback.override_feedback) && (
          <div
            className="feedback-detail-section"
            style={{
              marginTop: "1.5rem",
              border: "2px solid #f59e0b",
              borderRadius: "8px",
              padding: "1rem",
              background: "#fffbeb",
            }}
          >
            <h3 style={{ color: "#92400e", marginBottom: "0.5rem" }}>
              Override Feedback
            </h3>
            <div
              style={{
                fontSize: "0.8125rem",
                color: "#92400e",
                marginBottom: "0.75rem",
              }}
            >
              By {feedback.override_feedback.evaluator}
              {feedback.override_feedback.updated_at && (
                <>
                  {" "}
                  on{" "}
                  {new Date(
                    feedback.override_feedback.updated_at,
                  ).toLocaleString()}
                </>
              )}
            </div>

            {feedback.override_feedback.notes && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#92400e",
                    textTransform: "uppercase",
                    marginBottom: "0.25rem",
                  }}
                >
                  Notes
                </div>
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {feedback.override_feedback.notes}
                </p>
              </div>
            )}

            {/* Transcript overrides */}
            {feedback.override_feedback.transcript_detail_feedback &&
              hasAnyIssueInRecord(
                feedback.override_feedback.transcript_detail_feedback,
              ) &&
              renderOverrideSubsection(
                "Transcript",
                TRANSCRIPT_KEYS,
                feedback.override_feedback.transcript_detail_feedback,
              )}

            {/* Summary overall overrides */}
            {feedback.override_feedback.summary_feedback &&
              hasAnyIssueInComponent(
                feedback.override_feedback.summary_feedback,
              ) &&
              renderOverrideSubsection(
                "Summary (Overall)",
                OVERALL_KEYS,
                feedback.override_feedback
                  .summary_feedback as unknown as Record<string, IssueFeedback>,
              )}

            {/* Plan overall overrides */}
            {feedback.override_feedback.plan_feedback &&
              hasAnyIssueInComponent(
                feedback.override_feedback.plan_feedback,
              ) &&
              renderOverrideSubsection(
                "Action Plan (Overall)",
                OVERALL_KEYS,
                feedback.override_feedback.plan_feedback as unknown as Record<
                  string,
                  IssueFeedback
                >,
              )}

            {/* Summary detail overrides */}
            {feedback.override_feedback.summary_detail_feedback &&
              renderOverrideSummaryDetails(
                feedback.override_feedback.summary_detail_feedback,
              )}

            {/* Plan detail overrides */}
            {feedback.override_feedback.plan_detail_feedback?.sections &&
              renderOverridePlanDetails(
                feedback.override_feedback.plan_detail_feedback.sections,
              )}
          </div>
        )}
    </div>
  );
}

export default FeedbackDetail;
