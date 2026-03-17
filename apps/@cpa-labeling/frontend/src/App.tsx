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

import "./App.css";

import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useState } from "react";

import {
  getRecordDetail,
  listRecords,
  setAuthTokenGetter,
  submitFeedback,
} from "./api/client";
import FeedbackBrowser from "./components/FeedbackBrowser";
import FeedbackDetail from "./components/FeedbackDetail";
import LabelingView from "./components/LabelingView";
import RecordList from "./components/RecordList";
import StatsPage from "./components/StatsPage";
import type {
  FeedbackSubmission,
  OverallComponentFeedback,
  PlanDetailFeedback,
  RecordDetail,
  RecordListItem,
  SeverityLevel,
  SummaryDetailFeedback,
  TranscriptFeedback,
  TranscriptSeverity,
} from "./types";
import type { FeedbackListItem } from "./types";
import {
  createDefaultOverallComponentFeedback,
  createDefaultPlanSectionFeedback,
  createDefaultSummaryFinalThoughtsFeedback,
  createDefaultSummaryNeedsRisksFeedback,
  createDefaultSummaryNeedsSectionFeedback,
  createDefaultTranscriptFeedback,
} from "./types";

type View =
  | "list"
  | "labeling"
  | "stats"
  | "feedback-browser"
  | "feedback-detail";
type LabelingTab = "transcript" | "summary-details" | "plan-details";

// State shape for all feedback
interface FeedbackState {
  transcript_feedback: TranscriptFeedback;
  summary_feedback: OverallComponentFeedback;
  plan_feedback: OverallComponentFeedback;
  summary_detail_feedback: SummaryDetailFeedback;
  plan_detail_feedback: PlanDetailFeedback;
  overall_notes: string | null;
}

function createDefaultFeedbackState(): FeedbackState {
  return {
    transcript_feedback: createDefaultTranscriptFeedback(),
    summary_feedback: createDefaultOverallComponentFeedback(),
    plan_feedback: createDefaultOverallComponentFeedback(),
    summary_detail_feedback: {
      needs_risks_overview: {},
      priority_needs: createDefaultSummaryNeedsSectionFeedback(),
      longer_term_needs: createDefaultSummaryNeedsSectionFeedback(),
      final_thoughts: createDefaultSummaryFinalThoughtsFeedback(),
    },
    plan_detail_feedback: {
      sections: {},
    },
    overall_notes: null,
  };
}

// Prepare feedback for API submission - keeps null severities as null (not converted to "none")
// This allows reviewers to submit without rating every field
function prepareFeedbackForSubmission(state: FeedbackState): FeedbackState {
  // Simply return the state as-is - null values stay null
  // The backend will store null for unrated fields
  return state;
}

// Skip auth for local development if VITE_SKIP_AUTH is set
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";

function App() {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0Loading,
    loginWithRedirect,
    logout,
    user,
    getAccessTokenSilently,
  } = useAuth0();

  // When skipping auth, pretend we're authenticated
  const isAuthenticated = SKIP_AUTH || auth0IsAuthenticated;
  const authLoading = SKIP_AUTH ? false : auth0Loading;

  const [view, setView] = useState<View>("list");
  const [labelingTab, setLabelingTab] = useState<LabelingTab>("transcript");
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [totalUnreviewed, setTotalUnreviewed] = useState(0);
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [recordDetail, setRecordDetail] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState<FeedbackState>(
    createDefaultFeedbackState(),
  );
  const [selectedFeedbackItem, setSelectedFeedbackItem] =
    useState<FeedbackListItem | null>(null);

  // Use email as evaluator (or name, or "unknown") - use "local-dev" when skipping auth
  const evaluator = SKIP_AUTH
    ? "local-dev"
    : user?.email || user?.name || "unknown";

  // Set up auth token getter for API calls (skip when auth is disabled)
  useEffect(() => {
    if (SKIP_AUTH) {
      setAuthTokenGetter(null);
    } else if (isAuthenticated) {
      setAuthTokenGetter(getAccessTokenSilently);
    } else {
      setAuthTokenGetter(null);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      // Request only 1 record (the oldest unreviewed), but get total count
      const response = await listRecords(1, 1, {
        status: "completed",
        unlabeled_only: true,
        evaluator: evaluator, // Filter to show only unreviewed by this user
      });
      setRecords(response.items);
      setTotalUnreviewed(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  // Load records when authenticated and evaluator is set
  useEffect(() => {
    if (isAuthenticated && evaluator) {
      loadRecords();
    }
  }, [isAuthenticated, evaluator]);

  const loadRecordDetail = useCallback(
    async (intakeId: string) => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getRecordDetail(intakeId, evaluator || undefined);
        setRecordDetail(detail);

        // If existing feedback, populate the form
        if (detail.existing_feedback) {
          const ef = detail.existing_feedback;
          // For transcript_feedback, check if it's the new format (has danger_indication)
          // or old format (has factual/tone/other) - use default if old format
          const isNewTranscriptFormat =
            ef.transcript_feedback &&
            "danger_indication" in ef.transcript_feedback;
          setFeedback({
            transcript_feedback: isNewTranscriptFormat
              ? (ef.transcript_feedback as unknown as TranscriptFeedback)
              : createDefaultTranscriptFeedback(),
            summary_feedback:
              ef.summary_feedback || createDefaultOverallComponentFeedback(),
            plan_feedback:
              ef.plan_feedback || createDefaultOverallComponentFeedback(),
            summary_detail_feedback: ef.summary_detail_feedback || {
              needs_risks_overview: {},
              priority_needs: createDefaultSummaryNeedsSectionFeedback(),
              longer_term_needs: createDefaultSummaryNeedsSectionFeedback(),
              final_thoughts: createDefaultSummaryFinalThoughtsFeedback(),
            },
            plan_detail_feedback: ef.plan_detail_feedback || { sections: {} },
            overall_notes: ef.overall_notes,
          });
        } else {
          // Reset form for new record
          setFeedback(createDefaultFeedbackState());
        }

        // Reset to transcript tab when loading new record
        setLabelingTab("transcript");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load record");
      } finally {
        setLoading(false);
      }
    },
    [evaluator],
  );

  const handleSelectRecord = (index: number) => {
    setCurrentRecordIndex(index);
    const record = records[index];
    if (record) {
      loadRecordDetail(record.intake_id);
      setView("labeling");
    }
  };

  const handleSubmit = async () => {
    if (!recordDetail || !evaluator) return;

    setSubmitting(true);
    setError(null);
    try {
      // Prepare feedback for submission - keeps null severities as null
      const prepared = prepareFeedbackForSubmission(feedback);
      const submission: FeedbackSubmission = {
        intake_id: recordDetail.intake_id,
        plan_id: recordDetail.plan_id,
        evaluator,
        transcript_feedback: prepared.transcript_feedback,
        summary_feedback: prepared.summary_feedback,
        plan_feedback: prepared.plan_feedback,
        summary_detail_feedback: prepared.summary_detail_feedback,
        plan_detail_feedback: prepared.plan_detail_feedback,
        overall_notes: prepared.overall_notes,
      };
      await submitFeedback(submission);
      // Refresh records to get the next unreviewed record
      await loadRecords();
      // Go back to list view (which will show the next unreviewed record)
      setView("list");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Update function for new transcript feedback (8 criteria + audio)
  const updateTranscriptFeedback = (
    criterion: keyof TranscriptFeedback,
    field: "severity" | "notes",
    value: TranscriptSeverity | string | null,
  ) => {
    setFeedback((prev) => {
      const currentCriterion = prev.transcript_feedback[criterion];
      // Handle criterion fields that are objects (severity + notes)
      if (
        typeof currentCriterion === "object" &&
        currentCriterion !== null &&
        "severity" in currentCriterion
      ) {
        return {
          ...prev,
          transcript_feedback: {
            ...prev.transcript_feedback,
            [criterion]: {
              ...currentCriterion,
              [field]: value,
            },
          },
        };
      }
      // Handle string fields (number_of_speakers, audio_other_notes)
      return {
        ...prev,
        transcript_feedback: {
          ...prev.transcript_feedback,
          [criterion]: value,
        },
      };
    });
  };

  // Update functions for summary detail feedback
  const updateSummaryNeedsRisks = (
    category: string,
    issueType: "facts_incorrect" | "facts_missing" | "tone_issues" | "other",
    field: "severity" | "notes" | "related_to_transcription",
    value: SeverityLevel | string | boolean | null,
  ) => {
    setFeedback((prev) => {
      const currentCategory =
        prev.summary_detail_feedback.needs_risks_overview[category] ||
        createDefaultSummaryNeedsRisksFeedback();
      return {
        ...prev,
        summary_detail_feedback: {
          ...prev.summary_detail_feedback,
          needs_risks_overview: {
            ...prev.summary_detail_feedback.needs_risks_overview,
            [category]: {
              ...currentCategory,
              [issueType]: {
                ...currentCategory[issueType],
                [field]: value,
              },
            },
          },
        },
      };
    });
  };

  const updateSummaryNeedsSection = (
    section: "priority_needs" | "longer_term_needs",
    issueType: "needs_not_justified" | "needs_missing" | "other",
    field: "severity" | "notes" | "related_to_transcription",
    value: SeverityLevel | string | boolean | null,
  ) => {
    setFeedback((prev) => ({
      ...prev,
      summary_detail_feedback: {
        ...prev.summary_detail_feedback,
        [section]: {
          ...prev.summary_detail_feedback[section],
          [issueType]: {
            ...prev.summary_detail_feedback[section][issueType],
            [field]: value,
          },
        },
      },
    }));
  };

  const updateSummaryFinalThoughts = (
    issueType: "statements_not_supported" | "other",
    field: "severity" | "notes" | "related_to_transcription",
    value: SeverityLevel | string | boolean | null,
  ) => {
    setFeedback((prev) => ({
      ...prev,
      summary_detail_feedback: {
        ...prev.summary_detail_feedback,
        final_thoughts: {
          ...prev.summary_detail_feedback.final_thoughts,
          [issueType]: {
            ...prev.summary_detail_feedback.final_thoughts[issueType],
            [field]: value,
          },
        },
      },
    }));
  };

  // Update functions for plan detail feedback
  const updatePlanSection = (
    section: string,
    issueType:
      | "recommendation_groundedness"
      | "unsound_recommendation"
      | "obvious_incoherence"
      | "missing_incomplete_sections"
      | "other",
    field: "severity" | "notes" | "related_to_transcription",
    value: SeverityLevel | string | boolean | null,
  ) => {
    setFeedback((prev) => {
      const currentSection =
        prev.plan_detail_feedback.sections[section] ||
        createDefaultPlanSectionFeedback();
      return {
        ...prev,
        plan_detail_feedback: {
          ...prev.plan_detail_feedback,
          sections: {
            ...prev.plan_detail_feedback.sections,
            [section]: {
              ...currentSection,
              [issueType]: {
                ...currentSection[issueType],
                [field]: value,
              },
            },
          },
        },
      };
    });
  };

  // Show loading while Auth0 is initializing
  if (authLoading) {
    return (
      <div className="app">
        <div className="auth-loading">Loading...</div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>Reentry Labeling Tool</h1>
          <p>Please log in to continue.</p>
          <button className="login-btn" onClick={() => loginWithRedirect()}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  let navSection: "review" | "stats" | "feedback";
  if (view === "list" || view === "labeling") {
    navSection = "review";
  } else if (view === "stats") {
    navSection = "stats";
  } else {
    navSection = "feedback";
  }

  const renderMainContent = () => {
    switch (view) {
      case "list":
        return (
          <RecordList
            records={records}
            totalUnreviewed={totalUnreviewed}
            loading={loading}
            onSelectRecord={handleSelectRecord}
            onRefresh={loadRecords}
          />
        );
      case "labeling":
        return (
          <LabelingView
            recordDetail={recordDetail}
            loading={loading}
            labelingTab={labelingTab}
            onTabChange={setLabelingTab}
            feedback={feedback}
            onUpdateTranscriptFeedback={updateTranscriptFeedback}
            onUpdateSummaryNeedsRisks={updateSummaryNeedsRisks}
            onUpdateSummaryNeedsSection={updateSummaryNeedsSection}
            onUpdateSummaryFinalThoughts={updateSummaryFinalThoughts}
            onUpdatePlanSection={updatePlanSection}
            onUpdateOverallNotes={(notes) =>
              setFeedback((prev) => ({ ...prev, overall_notes: notes }))
            }
            onSubmit={handleSubmit}
            submitting={submitting}
            canSubmit={!!evaluator}
            currentIndex={currentRecordIndex}
            totalRecords={totalUnreviewed}
          />
        );
      case "stats":
        return <StatsPage />;
      case "feedback-browser":
        return (
          <FeedbackBrowser
            onSelectFeedback={(item) => {
              setSelectedFeedbackItem(item);
              setView("feedback-detail");
            }}
          />
        );
      case "feedback-detail":
        return selectedFeedbackItem ? (
          <FeedbackDetail
            feedbackItem={selectedFeedbackItem}
            onBack={() => setView("feedback-browser")}
            onOpenLabeling={(intakeId) => {
              const index = records.findIndex((r) => r.intake_id === intakeId);
              if (index >= 0) {
                handleSelectRecord(index);
              } else {
                loadRecordDetail(intakeId);
                setView("labeling");
              }
            }}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Reentry Labeling Tool</h1>
        <nav className="app-nav">
          <button
            className={`nav-tab ${navSection === "review" ? "active" : ""}`}
            onClick={() => setView("list")}
          >
            Review Records
          </button>
          {SKIP_AUTH && (
            <>
              <button
                className={`nav-tab ${navSection === "stats" ? "active" : ""}`}
                onClick={() => setView("stats")}
              >
                Stats
              </button>
              <button
                className={`nav-tab ${navSection === "feedback" ? "active" : ""}`}
                onClick={() => setView("feedback-browser")}
              >
                Feedback Browser
              </button>
            </>
          )}
        </nav>
        <div className="user-info">
          <span>
            Logged in as: {SKIP_AUTH ? "local-dev" : user?.email || user?.name}
          </span>
          {!SKIP_AUTH && (
            <button
              className="logout-btn"
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              Log Out
            </button>
          )}
        </div>
        {view === "labeling" && (
          <button className="back-btn" onClick={() => setView("list")}>
            Back to List
          </button>
        )}
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="app-main">{renderMainContent()}</main>
    </div>
  );
}

export default App;
