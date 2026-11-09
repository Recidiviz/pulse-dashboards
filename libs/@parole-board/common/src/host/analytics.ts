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

// Every metadata field is a month, a count, a kind, a public location code, a
// pseudonymizedId or an assessment value. Never add emails, DOC ids, entry ids,
// month ids or free text: these go to Segment.

/** The month an admin is viewing. NONE means the month hasn't been created. */
export interface PbCalendarMonthMetadata {
  year: number;
  month: number;
  status: "DRAFT" | "PUBLISHED" | "NONE";
}

/** The months one add-month request created, as "YYYY-MM" strings. */
export interface PbCalendarMonthAddedMetadata {
  months: string[];
  count: number;
}

/** The month an editor moved back to draft with Edit month. */
export interface PbCalendarMonthUnpublishedMetadata {
  year: number;
  month: number;
}

/**
 * The month an entry is in and its kind code. Kinds come from the calendar
 * config, so kind is a plain string rather than a union.
 */
export interface PbCalendarEntryMetadata {
  year: number;
  month: number;
  kind: string;
}

/** dayDelta is the target date minus the original date, in days. */
export interface PbCalendarMovedMetadata extends PbCalendarEntryMetadata {
  method: "drag" | "move_to";
  dayDelta: number;
}

/**
 * Counts for a month at the moment it was published.
 *
 * isRepublish is true when the month had a latestPublication: it was
 * published before, then an editor clicked Edit month to change it.
 * daysBeforeMonthStart counts days from today, in the calendar's timezone, to
 * the 1st of the month, and is negative once the month has started.
 */
export interface PbCalendarPublishedMetadata {
  year: number;
  month: number;
  hearingDays: number;
  hearingCount: number;
  holidayWarningCount: number;
  isRepublish: boolean;
  daysBeforeMonthStart: number;
}

/** resourceCode is null for patterns of kinds that have no resource. */
export interface PbCalendarPatternEditedMetadata {
  kindCode: string;
  resourceCode: string | null;
}

/**
 * A risk assessment the user selected in the case profile. Fires per tool;
 * the aggregate selection sends PbAssessmentAggregateClickedMetadata instead.
 * maxScore and riskLevel are null when the source has none. date is the
 * assessment date as "YYYY-MM-DD".
 */
export interface PbAssessmentClickedMetadata {
  pseudonymizedId: string;
  tool: string;
  score: number;
  maxScore: number | null;
  riskLevel: string | null;
  date: string;
}

/**
 * The assessments the user selected as a group, such as the CTAP suite. Each
 * array has one entry per assessment, in the same order, so tools[i] pairs
 * with scores[i], maxScores[i], riskLevels[i] and dates[i].
 */
export interface PbAssessmentAggregateClickedMetadata {
  pseudonymizedId: string;
  tools: string[];
  scores: number[];
  maxScores: (number | null)[];
  riskLevels: (string | null)[];
  dates: string[];
}

/** Whether the completed DOC or Edovo programs list opened or closed. */
export interface PbProgramsToggledMetadata {
  pseudonymizedId: string;
  programCount: number;
  isExpanded: boolean;
}

/** Whether the older disciplinaries list opened or closed. */
export interface PbDisciplinariesToggledMetadata {
  pseudonymizedId: string;
  disciplinaryCount: number;
  isExpanded: boolean;
}

/**
 * Analytics events the Parole Board features report through their host.
 * Callers fire each calendar mutation's event only after the server confirms
 * it.
 */
export interface ParoleBoardAnalytics {
  trackPbPublicCalendarAdminViewed(metadata: PbCalendarMonthMetadata): void;
  trackPbPublicCalendarMonthAdded(metadata: PbCalendarMonthAddedMetadata): void;
  trackPbPublicCalendarHearingAdded(metadata: PbCalendarEntryMetadata): void;
  trackPbPublicCalendarHearingDeleted(metadata: PbCalendarEntryMetadata): void;
  trackPbPublicCalendarHearingMoved(metadata: PbCalendarMovedMetadata): void;
  trackPbPublicCalendarMonthPublished(
    metadata: PbCalendarPublishedMetadata,
  ): void;
  trackPbPublicCalendarMonthUnpublished(
    metadata: PbCalendarMonthUnpublishedMetadata,
  ): void;
  trackPbPublicCalendarPatternEdited(
    metadata: PbCalendarPatternEditedMetadata,
  ): void;
  trackPbAssessmentClicked(metadata: PbAssessmentClickedMetadata): void;
  trackPbAssessmentAggregateClicked(
    metadata: PbAssessmentAggregateClickedMetadata,
  ): void;
  trackPbCompletedProgramsToggled(metadata: PbProgramsToggledMetadata): void;
  trackPbEdovoProgramsToggled(metadata: PbProgramsToggledMetadata): void;
  trackPbDisciplinariesToggled(metadata: PbDisciplinariesToggledMetadata): void;
}
