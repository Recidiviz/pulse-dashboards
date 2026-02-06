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

import type { TranscriptFeedback, TranscriptSeverity } from "../types";

interface TranscriptFeedbackFormProps {
  feedback: TranscriptFeedback;
  onUpdate: (
    criterion: keyof TranscriptFeedback,
    field: "severity" | "notes",
    value: TranscriptSeverity | string | null,
  ) => void;
  showAudioCriteria?: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  none: "#9ca3af",
  mild: "#fbbf24",
  severe: "#dc2626",
};

const GENERAL_CRITERIA: { key: keyof TranscriptFeedback; label: string }[] = [
  { key: "danger_indication", label: "Indication of Danger" },
  { key: "toxic_language", label: "Toxic language" },
  { key: "inappropriate_topic", label: "Inappropriate topic" },
  { key: "user_frustration", label: "Anger/frustration with the chatbot" },
  { key: "major_output_error", label: "Major output error" },
  {
    key: "chatbot_misunderstanding",
    label: "Obvious chatbot misunderstanding / error",
  },
  { key: "looping_questions", label: "Looping questions" },
  {
    key: "skipping_questions",
    label: "Skipping questions/ending section prematurely",
  },
  { key: "other", label: "Other" },
];

const AUDIO_CRITERIA: { key: keyof TranscriptFeedback; label: string }[] = [
  { key: "audio_quality", label: "Audio quality" },
  { key: "transcription_quality", label: "Quality of transcription" },
];

function TranscriptFeedbackForm({
  feedback,
  onUpdate,
  showAudioCriteria = false,
}: TranscriptFeedbackFormProps) {
  const renderCriterion = (key: keyof TranscriptFeedback, label: string) => {
    const value = feedback[key];

    // Handle criterion feedback (severity + notes)
    if (typeof value === "object" && value !== null && "severity" in value) {
      const criterionFeedback = value as {
        severity: TranscriptSeverity;
        notes: string | null;
      };

      return (
        <div key={key} className="transcript-criterion">
          <div className="transcript-criterion-label">{label}</div>
          <div className="transcript-severity-toggle">
            {(["none", "mild", "severe"] as const).map((level) => (
              <button
                key={level}
                className={`severity-btn ${criterionFeedback.severity === level ? "active" : ""}`}
                style={{
                  backgroundColor:
                    criterionFeedback.severity === level
                      ? SEVERITY_COLORS[level]
                      : undefined,
                  color:
                    criterionFeedback.severity === level ? "white" : undefined,
                }}
                onClick={() => onUpdate(key, "severity", level)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <textarea
            className="transcript-notes"
            placeholder="Notes..."
            value={criterionFeedback.notes || ""}
            onChange={(e) => onUpdate(key, "notes", e.target.value || null)}
            rows={2}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="transcript-feedback-form">
      <h3 className="feedback-section-title">Transcript Review</h3>

      {GENERAL_CRITERIA.map(({ key, label }) => renderCriterion(key, label))}

      {showAudioCriteria && (
        <>
          <h3 className="feedback-section-title audio-section-title">
            Audio Review
          </h3>

          <div className="transcript-criterion">
            <div className="transcript-criterion-label">Number of speakers</div>
            <input
              type="text"
              className="transcript-text-input"
              placeholder="e.g., 2"
              value={feedback.number_of_speakers || ""}
              onChange={(e) =>
                onUpdate("number_of_speakers", "notes", e.target.value || null)
              }
            />
          </div>

          {AUDIO_CRITERIA.map(({ key, label }) => renderCriterion(key, label))}

          <div className="transcript-criterion">
            <div className="transcript-criterion-label">Other notes</div>
            <textarea
              className="transcript-notes"
              placeholder="Any other observations about the audio..."
              value={feedback.audio_other_notes || ""}
              onChange={(e) =>
                onUpdate("audio_other_notes", "notes", e.target.value || null)
              }
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default TranscriptFeedbackForm;
