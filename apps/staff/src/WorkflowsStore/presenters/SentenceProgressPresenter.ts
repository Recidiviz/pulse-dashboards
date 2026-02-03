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

import { Placement } from "@floating-ui/react";
import { ScaleBand, scaleBand } from "d3-scale";
import {
  add,
  addDays,
  eachDayOfInterval,
  startOfDay,
  subYears,
} from "date-fns";
import { differenceBy } from "lodash";
import { makeAutoObservable } from "mobx";

import { palette } from "~design-system";

import { ProgressGap } from "../../core/WorkflowsJusticeInvolvedPersonProfile/SentenceProgressGapV2";
import { SentenceProgressPoint } from "../../core/WorkflowsJusticeInvolvedPersonProfile/SentenceProgressPointV2";
import { formatDate, formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { Resident } from "../Resident";
import { JusticeInvolvedPerson } from "../types";
import { fieldToDate, optionalFieldToDate } from "../utils";
import { WorkflowsStore } from "../WorkflowsStore";

export type TimelineDate = Omit<
  SentenceProgressPoint,
  "x" | "pointFill" | "labelPlacement"
>;

type DateInterval = { start: Date; end: Date };

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
  get timelineGaps(): DateInterval[] {
    const gaps: DateInterval[] = [];
    this.timelineDates.forEach((dateInfo, index, dates) => {
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
    return this.timelineDates.at(0)?.date;
  }

  get latestDate(): Date | undefined {
    return this.timelineDates.at(-1)?.date;
  }

  /**
   * A sorted list of dates to display on the timeline.
   */
  get timelineDates(): TimelineDate[] {
    if (!this._timelineDates) {
      this.calculateTimelineDateArray();
    }

    const unsortedDates = this._timelineDates ?? [];
    return unsortedDates.toSorted(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }

  get shouldShowEmptyState(): boolean {
    // If we have <3 dates (including today's date)
    if (this.timelineDates.length < 3) return true;

    // If we have invalid sentence dates
    if (this.startDate && this.endDate && this.startDate >= this.endDate)
      return true;

    if (!this.timelineDomain) return true;

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

  get expired(): boolean {
    const today = startOfDay(new Date());
    return !!this.endDate && this.endDate < today;
  }

  get timelineScale(): ScaleBand<Date> {
    // Use a band scale instead of a timescale so that we can exclude time gaps
    // if necessary.
    return scaleBand(this.timelineDomain ?? [], [0, 100]);
  }

  /**
   * Returns information relevant to rendering a progress gap (i.e. segments of time
   * with no relevant dates) on the timeline viz.
   */
  get progressGaps(): ProgressGap[] {
    // Each timeline gap corresponds to the period of time that has been sliced out of
    // the timeline domain (i.e. everything past the 7 year cutoff).
    return this.timelineGaps.map(({ start: gapStartDate, end: gapEndDate }) => {
      // We then calculate the midpoint of the remaining 7 year segment. The 7 year
      // segment begins at the end point of the sliced out interval.
      const condensedSegmentMidpoint = startOfDay(
        add(gapEndDate, { years: 3, months: 6 }),
      );
      const timelineXValue = this.timelineScale(condensedSegmentMidpoint);

      const nextDate = this.timelineDates.find(
        (dateInfo) => dateInfo.date > gapEndDate,
      );

      const label = nextDate
        ? `${formatDate(gapStartDate, "yyyy")} - ${formatDate(nextDate.date, "yyyy")}`
        : "Timeline not to scale";

      const progressGap = {
        x: timelineXValue,
        label,
      };
      return progressGap;
    });
  }

  /**
   * Returns information relevant to rendering a progress point (i.e. a relevant date)
   * on the timeline viz
   */
  get progressPoints(): SentenceProgressPoint[] {
    return this.timelineDates.map((dateInfo) => {
      let pointFill = palette.slate90;
      let pointPlacement: Placement = "bottom";

      // Handle point fill for timeline breakpoint/today's date.
      if (dateInfo.label === "Today" && !this.expired) {
        pointFill = palette.white;
      }
      if (dateInfo.label === "Today" && this.expired) {
        pointFill = palette.data.gold1;
      }
      if (dateInfo.date === this.endDate && this.expired) {
        pointFill = palette.white;
      }

      // Calculate where the point falls on the timeline
      const timelineXValue = this.timelineScale(dateInfo.date);

      // Handle point label placement for edges of timeline
      if (timelineXValue && timelineXValue > 90) pointPlacement = "bottom-end";
      if (timelineXValue !== undefined && timelineXValue < 10)
        pointPlacement = "bottom-start";

      const progressPoint = {
        ...dateInfo,
        x: timelineXValue,
        pointFill,
        labelPlacement: pointPlacement,
      };

      return progressPoint;
    });
  }

  get timelineBreakpoint(): number | undefined {
    const breakpointDate =
      this.expired && this.endDate ? this.endDate : startOfDay(new Date());
    return this.timelineScale(breakpointDate);
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
      this.pushUsUtResidentDates(this.person);
    }
  }

  /**
   * Add Parole Review date and 85% date to the timeline for ND residents.
   */
  private pushUsNdResidentDates(resident: Resident) {
    if (resident.metadata.stateCode !== "US_ND") return;

    const { paroleReviewDate, EIGHTYFIVEPercentDate } = resident.metadata;
    this.pushTimelineDate(
      "Parole Review Eligibility",
      true,
      fieldToDate(paroleReviewDate),
    );
    this.pushTimelineDate(
      "85% Date",
      true,
      optionalFieldToDate(EIGHTYFIVEPercentDate),
    );
  }

  /**
   * Add Parole date to timeline for UT residents.
   */
  private pushUsUtResidentDates(resident: Resident) {
    if (resident.metadata.stateCode !== "US_UT") return;
    const { paroleDate } = resident.metadata;
    this.pushTimelineDate("Parole Date", true, optionalFieldToDate(paroleDate));
  }

  get isModalOpen(): boolean {
    return this._isModalOpen;
  }

  set isModalOpen(isOpen: boolean) {
    this._isModalOpen = isOpen;
  }
}
