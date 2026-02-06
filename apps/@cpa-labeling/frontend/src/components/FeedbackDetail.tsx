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
import type { FeedbackListItem, LabelingFeedback } from "../types";

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
          width: "80px",
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
          {renderIssueRow(
            "Factual",
            feedback.transcript_feedback.factual.severity,
            feedback.transcript_feedback.factual.notes,
          )}
          {renderIssueRow(
            "Tone",
            feedback.transcript_feedback.tone.severity,
            feedback.transcript_feedback.tone.notes,
          )}
          {renderIssueRow(
            "Other",
            feedback.transcript_feedback.other.severity,
            feedback.transcript_feedback.other.notes,
          )}
        </div>

        <div className="feedback-detail-section">
          <h3>Summary</h3>
          {renderIssueRow(
            "Factual",
            feedback.summary_feedback.factual.severity,
            feedback.summary_feedback.factual.notes,
          )}
          {renderIssueRow(
            "Tone",
            feedback.summary_feedback.tone.severity,
            feedback.summary_feedback.tone.notes,
          )}
          {renderIssueRow(
            "Other",
            feedback.summary_feedback.other.severity,
            feedback.summary_feedback.other.notes,
          )}
        </div>

        <div className="feedback-detail-section">
          <h3>Action Plan</h3>
          {renderIssueRow(
            "Factual",
            feedback.plan_feedback.factual.severity,
            feedback.plan_feedback.factual.notes,
          )}
          {renderIssueRow(
            "Tone",
            feedback.plan_feedback.tone.severity,
            feedback.plan_feedback.tone.notes,
          )}
          {renderIssueRow(
            "Other",
            feedback.plan_feedback.other.severity,
            feedback.plan_feedback.other.notes,
          )}
        </div>
      </div>

      {feedback.overall_notes && (
        <div className="feedback-detail-section">
          <h3>Overall Notes</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{feedback.overall_notes}</p>
        </div>
      )}
    </div>
  );
}

export default FeedbackDetail;
