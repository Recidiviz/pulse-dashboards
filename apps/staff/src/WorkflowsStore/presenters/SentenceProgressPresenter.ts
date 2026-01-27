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

import { addDays, eachDayOfInterval, startOfDay, subYears } from "date-fns";
import { differenceBy } from "lodash";
import { makeAutoObservable } from "mobx";

import { SentenceProgressPoint } from "../../core/WorkflowsJusticeInvolvedPersonProfile/SentenceProgressPointV2";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { Resident } from "../Resident";
import { JusticeInvolvedPerson } from "../types";
import { fieldToDate, optionalFieldToDate } from "../utils";
import { WorkflowsStore } from "../WorkflowsStore";

export type TimelineDate = Omit<SentenceProgressPoint, "x" | "pointFill">;

/**
 * A presenter for components related to sentence progress on the person profile page.
 */
export class SentenceProgressPresenter<
  PersonType extends JusticeInvolvedPerson,
> {
  private _timelineDates?: TimelineDate[];
  private _hoveredDate?: string;
  private _isModalOpen: boolean;

  constructor(
    private readonly workflowsStore: WorkflowsStore,
    private readonly person: PersonType,
  ) {
    makeAutoObservable(this);

    this.calculateTimelineDateArray();
    this._isModalOpen = false;
  }

  get header() {
    return this.person instanceof Resident ? "Incarceration" : "Supervision";
  }

  get tenantLabels() {
    return this.workflowsStore.rootStore.tenantStore.labels;
  }

  get officerId() {
    return this.person.assignedStaffId;
  }

  get tenantId() {
    return this.workflowsStore.rootStore.currentTenantId;
  }

  get sortedTimelineDates(): TimelineDate[] {
    return this.timelineDates.toSorted(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }

  get hoveredTimelineDate(): string | undefined {
    return this._hoveredDate;
  }

  set hoveredTimelineDate(dateLabel: string | undefined) {
    this._hoveredDate = dateLabel;
  }

  /**
   * We want to exclude gaps beyond a 7 year cutoff for visual continuity of the progress
   * timeline; this calculates and returns the intervals that should be removed from
   * the timeline domain.
   * */
  get timelineGaps(): Interval[] {
    const gaps: Interval[] = [];
    this.sortedTimelineDates.forEach((dateInfo, index, dates) => {
      if (index > 0) {
        const cutoffDate = subYears(dateInfo.date, 7);
        const priorDate = dates[index - 1].date;
        if (priorDate < cutoffDate) {
          gaps.push({ start: addDays(priorDate, 1), end: cutoffDate });
        }
      }
    });
    return gaps;
  }

  /**
   * The domain for our timeline scale.
   * An array of all days between the earliest and latest dates on the timeline,
   * excluding gaps beyond 7 years.
   * */
  get timelineDomain(): Date[] | undefined {
    if (!this.earliestDate || !this.latestDate) return undefined;
    const continuousInterval = eachDayOfInterval({
      start: this.earliestDate,
      end: this.latestDate,
    });

    if (!this.timelineGaps.length) return continuousInterval;

    let discontinuousInterval = continuousInterval;
    this.timelineGaps.forEach((gap) => {
      discontinuousInterval = differenceBy(
        discontinuousInterval,
        eachDayOfInterval(gap),
        (date) => formatWorkflowsDate(date),
      );
    });
    return discontinuousInterval;
  }

  get earliestDate(): Date | undefined {
    return this.sortedTimelineDates.at(0)?.date;
  }

  get latestDate(): Date | undefined {
    return this.sortedTimelineDates.at(-1)?.date;
  }

  get timelineDates(): TimelineDate[] {
    if (!this._timelineDates) {
      this.calculateTimelineDateArray();
    }
    return this._timelineDates ?? [];
  }

  get shouldShowEmptyState(): boolean {
    // If we have <3 dates (including today's date)
    if (this.sortedTimelineDates.length < 3) return true;

    // If we have invalid sentence dates
    if (this.startDate && this.endDate && this.startDate >= this.endDate)
      return true;

    return false;
  }

  get startDate(): Date | undefined {
    if (this.person instanceof Resident) {
      return this.person.admissionDate;
    }
    if (this.person instanceof Client) {
      return this.person.supervisionStartDate;
    }
  }

  get endDate(): Date | undefined {
    if (this.person instanceof Resident) {
      return this.person.releaseDate;
    }
    if (this.person instanceof Client) {
      return this.person.expirationDate;
    }
  }

  calculateTimelineDateArray(): TimelineDate[] | undefined {
    // We always include the today marker.
    this.pushTimelineDate("Today", true, startOfDay(new Date()));

    // Resident sentence dates
    if (this.person instanceof Resident) {
      const { admissionDate, releaseDate } = this.person;
      const { releaseDateCopy } = this.tenantLabels;
      this.pushTimelineDate("Sentence Start", false, admissionDate);
      this.pushTimelineDate(releaseDateCopy, false, releaseDate);
    }

    // Client supervision dates
    if (this.person instanceof Client) {
      const { supervisionStartDate, expirationDate } = this.person;
      const { supervisionEndDateCopy } = this.tenantLabels;
      this.pushTimelineDate("Supervision Start", false, supervisionStartDate);
      this.pushTimelineDate(supervisionEndDateCopy, false, expirationDate);
    }

    // Any relevant state-specific dates
    this.pushStateSpecificDates();

    return this._timelineDates;
  }

  /**
   *  Attempt to push a new date and label onto the list of timeline dates.
   * */
  pushTimelineDate(label: string, hideLabel: boolean, date?: Date): void {
    if (!this._timelineDates) this._timelineDates = [];
    if (date)
      this._timelineDates.push({
        label,
        date,
        formattedDate: formatWorkflowsDate(date),
        hideLabel,
      });
  }

  // TODO(#11106): Add a UT-specific dates for the new UT Resident Profile
  // TODO(#11154): Add client state-specific metadata dates when available
  private pushStateSpecificDates() {
    if (this.person instanceof Resident) {
      this.pushUsNdResidentDates(this.person);
    }
  }

  /**
   * Add Parole Review date and 85% date to the timeline for ND residents.
   */
  private pushUsNdResidentDates(resident: Resident) {
    if (resident.metadata.stateCode !== "US_ND") return;

    const { paroleReviewDate, EIGHTYFIVEPercentDate } = resident.metadata;
    this.pushTimelineDate(
      "Parole Review Date",
      true,
      fieldToDate(paroleReviewDate),
    );
    this.pushTimelineDate(
      "85% Date",
      true,
      optionalFieldToDate(EIGHTYFIVEPercentDate),
    );
  }

  get isModalOpen(): boolean {
    return this._isModalOpen;
  }

  set isModalOpen(isOpen: boolean) {
    this._isModalOpen = isOpen;
  }
}
