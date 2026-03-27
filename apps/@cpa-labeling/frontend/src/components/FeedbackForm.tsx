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

import type {
  IssueFeedback,
  OverallComponentFeedback,
  SeverityLevel,
} from "../types";

// Non-null severity values for display (3 levels: None/Mild/Severe)
type NonNullSeverity = "none" | "mild" | "severe";
const SEVERITY_LEVELS: { value: NonNullSeverity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "mild", label: "Mild" },
  { value: "severe", label: "Severe" },
];

// Single issue row with severity buttons and notes
interface IssueRowProps {
  label: string;
  feedback: IssueFeedback;
  onSeverityChange: (value: SeverityLevel) => void;
  onNotesChange: (value: string | null) => void;
  compact?: boolean;
  showTranscriptionCheckbox?: boolean;
  onTranscriptionChange?: (value: boolean) => void;
  readOnly?: boolean;
  // Override mode props
  canOverride?: boolean;
  overrideFeedback?: IssueFeedback;
  onOverrideSeverityChange?: (value: SeverityLevel) => void;
  onOverrideNotesChange?: (value: string | null) => void;
}

export function IssueRow({
  label,
  feedback,
  onSeverityChange,
  onNotesChange,
  compact,
  showTranscriptionCheckbox,
  onTranscriptionChange,
  readOnly = false,
  canOverride = false,
  overrideFeedback,
  onOverrideSeverityChange,
  onOverrideNotesChange,
}: IssueRowProps) {
  return (
    <div
      className={`issue-row ${compact ? "compact" : ""} ${readOnly ? "read-only" : ""}`}
    >
      <div className="issue-label">{label}</div>
      <div className="issue-controls">
        <div className="severity-toggle">
          {SEVERITY_LEVELS.map((level) => (
            <button
              key={level.value}
              className={`severity-btn ${feedback.severity === level.value ? `active ${level.value}` : ""}`}
              onClick={() => !readOnly && onSeverityChange(level.value)}
              disabled={readOnly}
            >
              {level.label}
            </button>
          ))}
        </div>
        <textarea
          className="issue-notes-input"
          placeholder={readOnly ? "" : "Notes..."}
          rows={2}
          value={feedback.notes || ""}
          onChange={(e) => !readOnly && onNotesChange(e.target.value || null)}
          readOnly={readOnly}
          disabled={readOnly}
        />
        {showTranscriptionCheckbox && (
          <label className="checkbox-label transcription-checkbox">
            <input
              type="checkbox"
              checked={feedback.related_to_transcription ?? false}
              onChange={(e) => onTranscriptionChange?.(e.target.checked)}
            />
            Related to transcription
          </label>
        )}
      </div>
      {showTranscriptionCheckbox && (
        <label className="checkbox-label transcription-checkbox">
          <input
            type="checkbox"
            checked={feedback.related_to_transcription ?? false}
            onChange={(e) => onTranscriptionChange?.(e.target.checked)}
            disabled={readOnly}
          />
          Related to transcription
        </label>
      )}
      {canOverride && onOverrideSeverityChange && onOverrideNotesChange && (
        <div className="override-controls">
          <div className="override-label">Override:</div>
          <div className="issue-controls">
            <div className="severity-toggle">
              {SEVERITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  className={`severity-btn override ${overrideFeedback?.severity === level.value ? `active ${level.value}` : ""}`}
                  onClick={() => onOverrideSeverityChange(level.value)}
                >
                  {level.label}
                </button>
              ))}
            </div>
            <textarea
              className="issue-notes-input override-notes"
              placeholder="Override notes..."
              rows={2}
              value={overrideFeedback?.notes || ""}
              onChange={(e) => onOverrideNotesChange(e.target.value || null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Overall feedback form for a component (transcript, summary, or plan)
interface OverallFeedbackFormProps {
  feedback: OverallComponentFeedback;
  onUpdate: (
    issueType: "factual" | "tone" | "other",
    field: "severity" | "notes",
    value: SeverityLevel | string | null,
  ) => void;
}

export function OverallFeedbackForm({
  feedback,
  onUpdate,
}: OverallFeedbackFormProps) {
  return (
    <div className="overall-feedback-form">
      <IssueRow
        label="Factual issue"
        feedback={feedback.factual}
        onSeverityChange={(v) => onUpdate("factual", "severity", v)}
        onNotesChange={(v) => onUpdate("factual", "notes", v)}
      />
      <IssueRow
        label="Tone issue"
        feedback={feedback.tone}
        onSeverityChange={(v) => onUpdate("tone", "severity", v)}
        onNotesChange={(v) => onUpdate("tone", "notes", v)}
      />
      <IssueRow
        label="Other issue"
        feedback={feedback.other}
        onSeverityChange={(v) => onUpdate("other", "severity", v)}
        onNotesChange={(v) => onUpdate("other", "notes", v)}
      />
    </div>
  );
}

// Legacy: Old-style feedback form for backwards compatibility
interface LegacyFeedbackFormProps {
  needsReview: boolean;
  severity: SeverityLevel;
  notes: string | null;
  onNeedsReviewChange: (value: boolean) => void;
  onSeverityChange: (value: SeverityLevel) => void;
  onNotesChange: (value: string | null) => void;
}

function FeedbackForm({
  needsReview,
  severity,
  notes,
  onNeedsReviewChange,
  onSeverityChange,
  onNotesChange,
}: LegacyFeedbackFormProps) {
  return (
    <div className="feedback-form">
      <div className="feedback-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={needsReview}
            onChange={(e) => onNeedsReviewChange(e.target.checked)}
          />
          Needs Review
        </label>

        <div className="severity-toggle">
          {SEVERITY_LEVELS.map((level) => (
            <button
              key={level.value}
              className={`severity-btn ${severity === level.value ? `active ${level.value}` : ""}`}
              onClick={() => onSeverityChange(level.value)}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="notes-input"
        placeholder="Notes..."
        value={notes || ""}
        onChange={(e) => onNotesChange(e.target.value || null)}
      />
    </div>
  );
}

export default FeedbackForm;
