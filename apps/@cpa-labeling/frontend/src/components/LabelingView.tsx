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

import { useCallback, useRef, useState } from "react";

import type {
  OverallComponentFeedback,
  PlanDetailFeedback,
  RecordDetail,
  SeverityLevel,
  SummaryDetailFeedback,
  TranscriptFeedback,
  TranscriptSeverity,
} from "../types";
import {
  createDefaultPlanSectionFeedback,
  createDefaultSummaryNeedsRisksFeedback,
} from "../types";
import AudioPlayer from "./AudioPlayer";
import { IssueRow } from "./FeedbackForm";
import MarkdownPanel from "./MarkdownPanel";
import TranscriptFeedbackForm from "./TranscriptFeedbackForm";
import TranscriptPanel from "./TranscriptPanel";

type LabelingTab = "transcript" | "summary-details" | "plan-details";
type SummaryDetailSubTab =
  | "full-summary"
  | "personal-background"
  | "needs-risks"
  | "priority-needs"
  | "longer-term"
  | "final-thoughts";

interface FeedbackState {
  transcript_feedback: TranscriptFeedback;
  summary_feedback: OverallComponentFeedback;
  plan_feedback: OverallComponentFeedback;
  summary_detail_feedback: SummaryDetailFeedback;
  plan_detail_feedback: PlanDetailFeedback;
  overall_notes: string | null;
}

interface LabelingViewProps {
  recordDetail: RecordDetail | null;
  loading: boolean;
  labelingTab: LabelingTab;
  onTabChange: (tab: LabelingTab) => void;
  feedback: FeedbackState;
  onUpdateTranscriptFeedback: (
    criterion: keyof TranscriptFeedback,
    field: "severity" | "notes",
    value: TranscriptSeverity | string | null,
  ) => void;
  onUpdateSummaryNeedsRisks: (
    category: string,
    issueType: "facts_incorrect" | "facts_missing" | "tone_issues" | "other",
    field: "severity" | "notes",
    value: SeverityLevel | string | null,
  ) => void;
  onUpdateSummaryNeedsSection: (
    section: "priority_needs" | "longer_term_needs",
    issueType: "needs_not_justified" | "needs_missing" | "other",
    field: "severity" | "notes",
    value: SeverityLevel | string | null,
  ) => void;
  onUpdateSummaryFinalThoughts: (
    issueType: "statements_not_supported" | "other",
    field: "severity" | "notes",
    value: SeverityLevel | string | null,
  ) => void;
  onUpdatePlanSection: (
    section: string,
    issueType:
      | "recommendation_groundedness"
      | "unsound_recommendation"
      | "obvious_incoherence"
      | "missing_incomplete_sections"
      | "other",
    field: "severity" | "notes",
    value: SeverityLevel | string | null,
  ) => void;
  onUpdateOverallNotes: (notes: string | null) => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
  currentIndex: number;
  totalRecords: number;
}

function LabelingView({
  recordDetail,
  loading,
  labelingTab,
  onTabChange,
  feedback,
  onUpdateTranscriptFeedback,
  onUpdateSummaryNeedsRisks,
  onUpdateSummaryNeedsSection,
  onUpdateSummaryFinalThoughts,
  onUpdatePlanSection,
  onUpdateOverallNotes,
  onSubmit,
  submitting,
  canSubmit,
  currentIndex,
  totalRecords,
}: LabelingViewProps) {
  // Ref for transcript container in summary details view
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(
    null,
  );
  const [summarySubTab, setSummarySubTab] =
    useState<SummaryDetailSubTab>("full-summary");

  // Scroll to a section in the transcript (only scrolls the container, not the page)
  const scrollToSection = useCallback((category: string) => {
    if (!transcriptContainerRef.current) return;

    const container = transcriptContainerRef.current;
    const categoryLower = category.toLowerCase();

    // Helper to scroll element into view within container only
    const scrollElementIntoContainer = (element: Element) => {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollOffset =
        elementRect.top - containerRect.top + container.scrollTop - 10; // 10px padding
      container.scrollTo({ top: scrollOffset, behavior: "smooth" });
    };

    // Find the first transcript section header that matches
    const sectionHeaders = container.querySelectorAll(
      ".transcript-section-header",
    );

    for (const header of sectionHeaders) {
      const sectionName =
        header.getAttribute("data-section")?.toLowerCase() || "";
      // Match if either contains the other (handles slight naming differences)
      const matches =
        sectionName.includes(categoryLower) ||
        categoryLower.includes(sectionName);

      if (matches) {
        scrollElementIntoContainer(header);
        setHighlightedSection(category);
        // Clear highlight after 2 seconds
        setTimeout(() => setHighlightedSection(null), 2000);
        return;
      }
    }

    // Fallback: search through messages
    const messages = container.querySelectorAll(
      ".transcript-message[data-section]",
    );
    for (const msg of messages) {
      const sectionName = msg.getAttribute("data-section")?.toLowerCase() || "";
      const matches =
        sectionName.includes(categoryLower) ||
        categoryLower.includes(sectionName);

      if (matches) {
        scrollElementIntoContainer(msg);
        setHighlightedSection(category);
        setTimeout(() => setHighlightedSection(null), 2000);
        return;
      }
    }
  }, []);

  if (loading) {
    return <div className="loading">Loading record...</div>;
  }

  if (!recordDetail) {
    return <div className="loading">No record selected</div>;
  }

  // Check if this is an audio/transcription intake (has audio associated)
  // For now, we'll show audio criteria if there's any recording session data
  // This can be refined later when we have proper audio URL detection
  const hasAudio = false; // TODO: detect from recordDetail when audio is available

  const renderTranscriptView = () => (
    <div className="transcript-tab-container">
      {/* Left pane: Audio player + Transcript */}
      <div className="transcript-left-pane">
        <AudioPlayer audioUrl={hasAudio ? "placeholder" : null} />
        <div className="transcript-content-scroll">
          <TranscriptPanel messages={recordDetail.transcript_messages} />
        </div>
      </div>

      {/* Right pane: Feedback form */}
      <div className="transcript-feedback-sidebar">
        <TranscriptFeedbackForm
          feedback={feedback.transcript_feedback}
          onUpdate={onUpdateTranscriptFeedback}
          showAudioCriteria={hasAudio}
        />
      </div>
    </div>
  );

  const renderSummaryDetailsView = () => {
    const markdown = recordDetail.summary_markdown || "";

    // Parse sections directly from markdown
    // Split by lines starting with # (h1 headers)
    const parseSectionsFromMarkdown = (
      md: string,
    ): { name: string; content: string }[] => {
      const sections: { name: string; content: string }[] = [];
      const lines = md.split("\n");
      let currentSection: { name: string; content: string[] } | null = null;

      for (const line of lines) {
        // Check for h1 header: # Section Name
        const headerMatch = line.match(/^#\s+(.+?)\s*$/);
        if (headerMatch) {
          // Save previous section if exists
          if (currentSection) {
            sections.push({
              name: currentSection.name,
              content: currentSection.content.join("\n").trim(),
            });
          }
          currentSection = { name: headerMatch[1], content: [] };
        } else if (currentSection) {
          currentSection.content.push(line);
        }
      }
      // Don't forget the last section
      if (currentSection) {
        sections.push({
          name: currentSection.name,
          content: currentSection.content.join("\n").trim(),
        });
      }
      return sections;
    };

    const parsedSections = parseSectionsFromMarkdown(markdown);

    // Find specific sections
    const findSection = (
      keywords: string[],
    ): { name: string; content: string } | undefined => {
      return parsedSections.find((s) => {
        const nameLower = s.name.toLowerCase();
        return keywords.every((kw) => nameLower.includes(kw.toLowerCase()));
      });
    };

    const personalBackgroundSection = findSection(["personal", "background"]);
    const needsRisksSection = findSection(["needs", "risks"]);
    const priorityNeedsSection = findSection(["priority", "needs"]);
    const longerTermSection = findSection(["longer"]) || findSection(["term"]);
    const finalThoughtsSection = findSection(["final", "thoughts"]);

    // Parse categories from Needs and Risks Overview section
    // Format: - **Category Name:** description text
    const parseNeedsRisksCategories = (
      content: string,
    ): { name: string; bullet: string }[] => {
      const categories: { name: string; bullet: string }[] = [];
      const lines = content.split("\n");
      for (const line of lines) {
        // Match lines like: - **Employment:** Plans to work...
        const match = line.match(/^-\s+\*\*([^*:]+)(?::\*\*|\*\*:)\s*(.*)$/);
        if (match) {
          categories.push({
            name: match[1].trim(),
            bullet: line.trim(),
          });
        }
      }
      return categories;
    };

    const needsRisksCategories = needsRisksSection
      ? parseNeedsRisksCategories(needsRisksSection.content)
      : [];

    // Sub-navigation tabs for summary details
    const subTabs: {
      id: SummaryDetailSubTab;
      label: string;
      hasContent: boolean;
    }[] = [
      { id: "full-summary", label: "Full Summary", hasContent: !!markdown },
      {
        id: "personal-background",
        label: "Personal Background",
        hasContent: !!personalBackgroundSection,
      },
      {
        id: "needs-risks",
        label: "Needs & Risks",
        hasContent: needsRisksCategories.length > 0,
      },
      {
        id: "priority-needs",
        label: "Priority Needs",
        hasContent: !!priorityNeedsSection,
      },
      {
        id: "longer-term",
        label: "Longer-term",
        hasContent: !!longerTermSection,
      },
      {
        id: "final-thoughts",
        label: "Final Thoughts",
        hasContent: !!finalThoughtsSection,
      },
    ];

    const renderSubTabContent = () => {
      switch (summarySubTab) {
        case "full-summary":
          return (
            <div className="detail-section">
              <div
                className="section-content-preview"
                style={{ maxHeight: "none" }}
              >
                <MarkdownPanel
                  content={markdown}
                  emptyMessage="No summary available"
                />
              </div>
            </div>
          );

        case "personal-background":
          return (
            <div className="detail-section">
              {personalBackgroundSection ? (
                <>
                  <div className="section-content-preview">
                    <MarkdownPanel
                      content={personalBackgroundSection.content}
                    />
                  </div>
                  <IssueRow
                    label="Groundedness"
                    feedback={
                      feedback.summary_detail_feedback.needs_risks_overview[
                        "Personal Background"
                      ]?.facts_incorrect || { severity: null, notes: null }
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsRisks(
                        "Personal Background",
                        "facts_incorrect",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsRisks(
                        "Personal Background",
                        "facts_incorrect",
                        "notes",
                        v,
                      )
                    }
                  />
                  <IssueRow
                    label="Facts missing"
                    feedback={
                      feedback.summary_detail_feedback.needs_risks_overview[
                        "Personal Background"
                      ]?.facts_missing || { severity: null, notes: null }
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsRisks(
                        "Personal Background",
                        "facts_missing",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsRisks(
                        "Personal Background",
                        "facts_missing",
                        "notes",
                        v,
                      )
                    }
                  />
                  <IssueRow
                    label="Tone issues"
                    feedback={
                      feedback.summary_detail_feedback.needs_risks_overview[
                        "Personal Background"
                      ]?.tone_issues || { severity: null, notes: null }
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsRisks(
                        "Personal Background",
                        "tone_issues",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsRisks(
                        "Personal Background",
                        "tone_issues",
                        "notes",
                        v,
                      )
                    }
                  />
                  <IssueRow
                    label="Other"
                    feedback={
                      feedback.summary_detail_feedback.needs_risks_overview[
                        "Personal Background"
                      ]?.other || { severity: null, notes: null }
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsRisks(
                        "Personal Background",
                        "other",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsRisks(
                        "Personal Background",
                        "other",
                        "notes",
                        v,
                      )
                    }
                  />
                </>
              ) : (
                <div className="empty-content">
                  No Personal Background section found in summary
                </div>
              )}
            </div>
          );

        case "needs-risks":
          return (
            <>
              {needsRisksCategories.map(({ name, bullet }) => {
                const categoryFeedback =
                  feedback.summary_detail_feedback.needs_risks_overview[name] ||
                  createDefaultSummaryNeedsRisksFeedback();
                return (
                  <div key={name} className="category-feedback">
                    <h5
                      className="clickable-category"
                      onClick={() => scrollToSection(name)}
                      title={`Click to scroll to ${name} in transcript`}
                    >
                      {name}
                    </h5>
                    <div className="category-bullet-preview">
                      <MarkdownPanel content={bullet} />
                    </div>
                    <IssueRow
                      label="Groundedness"
                      feedback={categoryFeedback.facts_incorrect}
                      onSeverityChange={(v) =>
                        onUpdateSummaryNeedsRisks(
                          name,
                          "facts_incorrect",
                          "severity",
                          v,
                        )
                      }
                      onNotesChange={(v) =>
                        onUpdateSummaryNeedsRisks(
                          name,
                          "facts_incorrect",
                          "notes",
                          v,
                        )
                      }
                      compact
                    />
                    <IssueRow
                      label="Facts missing"
                      feedback={categoryFeedback.facts_missing}
                      onSeverityChange={(v) =>
                        onUpdateSummaryNeedsRisks(
                          name,
                          "facts_missing",
                          "severity",
                          v,
                        )
                      }
                      onNotesChange={(v) =>
                        onUpdateSummaryNeedsRisks(
                          name,
                          "facts_missing",
                          "notes",
                          v,
                        )
                      }
                      compact
                    />
                    <IssueRow
                      label="Tone issues"
                      feedback={categoryFeedback.tone_issues}
                      onSeverityChange={(v) =>
                        onUpdateSummaryNeedsRisks(
                          name,
                          "tone_issues",
                          "severity",
                          v,
                        )
                      }
                      onNotesChange={(v) =>
                        onUpdateSummaryNeedsRisks(
                          name,
                          "tone_issues",
                          "notes",
                          v,
                        )
                      }
                      compact
                    />
                    <IssueRow
                      label="Other"
                      feedback={categoryFeedback.other}
                      onSeverityChange={(v) =>
                        onUpdateSummaryNeedsRisks(name, "other", "severity", v)
                      }
                      onNotesChange={(v) =>
                        onUpdateSummaryNeedsRisks(name, "other", "notes", v)
                      }
                      compact
                    />
                  </div>
                );
              })}
              {needsRisksCategories.length === 0 && (
                <div className="empty-content">
                  No categories found in summary
                </div>
              )}
            </>
          );

        case "priority-needs":
          return (
            <div className="detail-section">
              {priorityNeedsSection ? (
                <>
                  <div className="section-content-preview">
                    <MarkdownPanel content={priorityNeedsSection.content} />
                  </div>
                  <IssueRow
                    label="Needs not justified"
                    feedback={
                      feedback.summary_detail_feedback.priority_needs
                        .needs_not_justified
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "priority_needs",
                        "needs_not_justified",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "priority_needs",
                        "needs_not_justified",
                        "notes",
                        v,
                      )
                    }
                  />
                  <IssueRow
                    label="Needs missing"
                    feedback={
                      feedback.summary_detail_feedback.priority_needs
                        .needs_missing
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "priority_needs",
                        "needs_missing",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "priority_needs",
                        "needs_missing",
                        "notes",
                        v,
                      )
                    }
                  />
                  <IssueRow
                    label="Other"
                    feedback={
                      feedback.summary_detail_feedback.priority_needs.other
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "priority_needs",
                        "other",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "priority_needs",
                        "other",
                        "notes",
                        v,
                      )
                    }
                  />
                </>
              ) : (
                <div className="empty-content">
                  No Priority Needs section found in summary
                </div>
              )}
            </div>
          );

        case "longer-term":
          return (
            <div className="detail-section">
              {longerTermSection ? (
                <>
                  <div className="section-content-preview">
                    <MarkdownPanel content={longerTermSection.content} />
                  </div>
                  <IssueRow
                    label="Needs not justified"
                    feedback={
                      feedback.summary_detail_feedback.longer_term_needs
                        .needs_not_justified
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "longer_term_needs",
                        "needs_not_justified",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "longer_term_needs",
                        "needs_not_justified",
                        "notes",
                        v,
                      )
                    }
                  />
                  <IssueRow
                    label="Needs missing"
                    feedback={
                      feedback.summary_detail_feedback.longer_term_needs
                        .needs_missing
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "longer_term_needs",
                        "needs_missing",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "longer_term_needs",
                        "needs_missing",
                        "notes",
                        v,
                      )
                    }
                  />
                  <IssueRow
                    label="Other"
                    feedback={
                      feedback.summary_detail_feedback.longer_term_needs.other
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "longer_term_needs",
                        "other",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryNeedsSection(
                        "longer_term_needs",
                        "other",
                        "notes",
                        v,
                      )
                    }
                  />
                </>
              ) : (
                <div className="empty-content">
                  No Longer-term Needs section found in summary
                </div>
              )}
            </div>
          );

        case "final-thoughts":
          return (
            <div className="detail-section">
              {finalThoughtsSection ? (
                <>
                  <div className="section-content-preview">
                    <MarkdownPanel content={finalThoughtsSection.content} />
                  </div>
                  <IssueRow
                    label="Statements not supported"
                    feedback={
                      feedback.summary_detail_feedback.final_thoughts
                        .statements_not_supported
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryFinalThoughts(
                        "statements_not_supported",
                        "severity",
                        v,
                      )
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryFinalThoughts(
                        "statements_not_supported",
                        "notes",
                        v,
                      )
                    }
                  />
                  <IssueRow
                    label="Other"
                    feedback={
                      feedback.summary_detail_feedback.final_thoughts.other
                    }
                    onSeverityChange={(v) =>
                      onUpdateSummaryFinalThoughts("other", "severity", v)
                    }
                    onNotesChange={(v) =>
                      onUpdateSummaryFinalThoughts("other", "notes", v)
                    }
                  />
                </>
              ) : (
                <div className="empty-content">
                  No Final Thoughts section found in summary
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="detail-view summary-details">
        <div className="detail-left-panel">
          <h3>Transcript</h3>
          <div className="scrollable-content" ref={transcriptContainerRef}>
            <TranscriptPanel
              messages={recordDetail.transcript_messages}
              highlightSection={highlightedSection}
            />
          </div>
        </div>

        <div className="detail-right-panel">
          <h3>Intake Summary Details</h3>
          <div className="sub-tab-navigation">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                className={`sub-tab-btn ${summarySubTab === tab.id ? "active" : ""} ${!tab.hasContent ? "disabled" : ""}`}
                onClick={() => tab.hasContent && setSummarySubTab(tab.id)}
                disabled={!tab.hasContent}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="scrollable-content">{renderSubTabContent()}</div>
        </div>
      </div>
    );
  };

  const renderPlanDetailsView = () => {
    // For plan feedback, we use a single "Full Plan" key
    const planFeedbackKey = "Full Plan";
    const sectionFeedback =
      feedback.plan_detail_feedback.sections[planFeedbackKey] ||
      createDefaultPlanSectionFeedback();

    return (
      <div className="detail-view plan-details">
        {/* Left panel: Full Action Plan */}
        <div className="detail-left-panel">
          <h3>Action Plan</h3>
          <div className="scrollable-content">
            <MarkdownPanel
              content={recordDetail.action_plan_markdown}
              emptyMessage="No action plan available"
            />
          </div>
        </div>

        {/* Right panel: Labels */}
        <div className="detail-right-panel">
          <h3>Labels</h3>
          <div className="scrollable-content">
            <div className="section-feedback">
              <IssueRow
                label="Recommendation Groundedness"
                feedback={sectionFeedback.recommendation_groundedness}
                onSeverityChange={(v) =>
                  onUpdatePlanSection(
                    planFeedbackKey,
                    "recommendation_groundedness",
                    "severity",
                    v,
                  )
                }
                onNotesChange={(v) =>
                  onUpdatePlanSection(
                    planFeedbackKey,
                    "recommendation_groundedness",
                    "notes",
                    v,
                  )
                }
              />
              <IssueRow
                label="Unsound Recommendation"
                feedback={sectionFeedback.unsound_recommendation}
                onSeverityChange={(v) =>
                  onUpdatePlanSection(
                    planFeedbackKey,
                    "unsound_recommendation",
                    "severity",
                    v,
                  )
                }
                onNotesChange={(v) =>
                  onUpdatePlanSection(
                    planFeedbackKey,
                    "unsound_recommendation",
                    "notes",
                    v,
                  )
                }
              />
              <IssueRow
                label="Obvious incoherence"
                feedback={sectionFeedback.obvious_incoherence}
                onSeverityChange={(v) =>
                  onUpdatePlanSection(
                    planFeedbackKey,
                    "obvious_incoherence",
                    "severity",
                    v,
                  )
                }
                onNotesChange={(v) =>
                  onUpdatePlanSection(
                    planFeedbackKey,
                    "obvious_incoherence",
                    "notes",
                    v,
                  )
                }
              />
              <IssueRow
                label="Missing/Incomplete Sections"
                feedback={sectionFeedback.missing_incomplete_sections}
                onSeverityChange={(v) =>
                  onUpdatePlanSection(
                    planFeedbackKey,
                    "missing_incomplete_sections",
                    "severity",
                    v,
                  )
                }
                onNotesChange={(v) =>
                  onUpdatePlanSection(
                    planFeedbackKey,
                    "missing_incomplete_sections",
                    "notes",
                    v,
                  )
                }
              />
              <IssueRow
                label="Other"
                feedback={sectionFeedback.other}
                onSeverityChange={(v) =>
                  onUpdatePlanSection(planFeedbackKey, "other", "severity", v)
                }
                onNotesChange={(v) =>
                  onUpdatePlanSection(planFeedbackKey, "other", "notes", v)
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="labeling-view">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${labelingTab === "transcript" ? "active" : ""}`}
          onClick={() => onTabChange("transcript")}
        >
          Transcript
        </button>
        <button
          className={`tab-btn ${labelingTab === "summary-details" ? "active" : ""}`}
          onClick={() => onTabChange("summary-details")}
        >
          Summary Details
        </button>
        <button
          className={`tab-btn ${labelingTab === "plan-details" ? "active" : ""}`}
          onClick={() => onTabChange("plan-details")}
        >
          Plan Details
        </button>
      </div>

      {/* Record Metadata */}
      <div className="record-metadata">
        {recordDetail.client_pseudo_id && (
          <span className="metadata-item">
            <strong>Client:</strong> {recordDetail.client_pseudo_id}
          </span>
        )}
        <span className="metadata-item">
          <strong>Intake:</strong> {recordDetail.intake_id.slice(0, 8)}
        </span>
        {recordDetail.state_code && (
          <span className="metadata-item">
            <strong>State:</strong> {recordDetail.state_code}
          </span>
        )}
        {recordDetail.completed_at && (
          <span className="metadata-item">
            <strong>Completed:</strong>{" "}
            {new Date(recordDetail.completed_at).toLocaleString()}
          </span>
        )}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {labelingTab === "transcript" && renderTranscriptView()}
        {labelingTab === "summary-details" && renderSummaryDetailsView()}
        {labelingTab === "plan-details" && renderPlanDetailsView()}
      </div>

      {/* Navigation Footer */}
      <div className="navigation-footer">
        <div className="record-counter">
          Record {currentIndex + 1} of {totalRecords}
        </div>

        <div className="submit-section">
          <textarea
            className="overall-notes-input"
            placeholder="Overall notes (optional)"
            rows={3}
            value={feedback.overall_notes || ""}
            onChange={(e) => onUpdateOverallNotes(e.target.value || null)}
          />
          <button
            className="submit-btn"
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LabelingView;
