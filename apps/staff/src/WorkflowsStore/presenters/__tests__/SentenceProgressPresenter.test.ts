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

import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  startOfDay,
  subYears,
} from "date-fns";
import timekeeper from "timekeeper";

import { ClientRecord, fieldToDate, ResidentRecord } from "~datatypes";

import { RootStore } from "../../../RootStore";
import { formatWorkflowsDate } from "../../../utils";
import { mockIneligibleClient, mockResidents } from "../../__fixtures__";
import { Client } from "../../Client";
import { Resident } from "../../Resident";
import { WorkflowsStore } from "../../WorkflowsStore";
import {
  SentenceProgressPresenter,
  TimelineDate,
} from "../SentenceProgressPresenter";

let presenter: SentenceProgressPresenter<Resident | Client>;
let selectedPerson: Resident | Client;
let rootStore: RootStore;
let workflowsStore: WorkflowsStore;

// test with US_ND
const mockTenantId = "US_ND";

const baseResident: ResidentRecord = {
  ...mockResidents[0],
  releaseDate: fieldToDate("2030-01-01"),
  admissionDate: fieldToDate("2021-06-06"),
};

const baseResidentWithDateGaps: ResidentRecord = {
  ...baseResident,
  // 7 years and 6 months past today's (frozen) date.
  releaseDate: fieldToDate("2033-06-01"),
};

const usNDResidentRecord: ResidentRecord = {
  ...baseResident,
  stateCode: "US_ND",
  metadata: {
    stateCode: "US_ND",
    EIGHTYFIVEPercentDate: "2028-01-01",
    paroleReviewDate: "2024-01-01",
  },
};

const baseClient: ClientRecord = {
  ...mockIneligibleClient,
  expirationDate: fieldToDate("2030-02-02"),
  supervisionStartDate: fieldToDate("2022-02-02"),
};

describe("SentenceProgressPresenter", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    timekeeper.freeze(fieldToDate("2026-01-01"));
    rootStore = new RootStore();
    rootStore.tenantStore.setCurrentTenantId(mockTenantId);
    workflowsStore = {
      featureVariants: { sentenceProgressV2: {} },
      rootStore: {
        tenantStore: {
          labels: {
            releaseDateCopy: "Release Date",
            supervisionEndDateCopy: "End Date",
          },
        },
      },
    } as unknown as WorkflowsStore;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // TODO(#11154): Add tests for presenter empty state logic, including erroneous dates
  describe("Resident Progress", () => {
    beforeEach(() => {
      selectedPerson = new Resident(baseResident, rootStore);
      workflowsStore = {
        ...workflowsStore,
        selectedPerson: selectedPerson,
      } as unknown as WorkflowsStore;
      presenter = new SentenceProgressPresenter(workflowsStore, selectedPerson);
    });

    test("start date matches person record", () => {
      expect(presenter.startDate).toEqual(baseResident.admissionDate);
    });

    test("end date matches person record", () => {
      expect(presenter.endDate).toEqual(baseResident.releaseDate);
    });

    test("no timeline gaps when dates are within 7 years", () => {
      expect(presenter.timelineGaps).toBeEmpty();
    });

    test("timeline domain is continuous between start and end date", () => {
      const start = baseResident.admissionDate as Date;
      const end = baseResident.releaseDate as Date;
      expect(presenter.timelineDomain).toEqual(
        eachDayOfInterval({
          start,
          end,
        }),
      );
      expect(presenter.timelineDomain?.length).toEqual(
        differenceInDays(startOfDay(end), startOfDay(start)) + 1,
      );
    });

    test("timeline dates include start date", () => {
      const expectedAdmissionDate: TimelineDate = {
        date: fieldToDate("2021-06-06"),
        label: "Sentence Start",
        formattedDate: "Jun 6, 2021",
        hideLabel: false,
      };

      expect(presenter.sortedTimelineDates).toContainEqual(
        expectedAdmissionDate,
      );
    });

    test("timeline dates include end date", () => {
      const expectedReleaseDate: TimelineDate = {
        date: fieldToDate("2030-01-01"),
        label: "Release Date",
        formattedDate: "Jan 1, 2030",
        hideLabel: false,
      };

      expect(presenter.sortedTimelineDates).toContainEqual(expectedReleaseDate);
    });

    test("timeline dates include today", () => {
      const todayDate: TimelineDate = {
        date: fieldToDate("2026-01-01"),
        label: "Today",
        formattedDate: formatWorkflowsDate(new Date()),
        hideLabel: true,
      };

      expect(presenter.sortedTimelineDates).toContainEqual(todayDate);
    });

    describe("Timeline with date gaps", () => {
      beforeEach(() => {
        // Resident has a gap between today's date and their release date of >7 years
        selectedPerson = new Resident(baseResidentWithDateGaps, rootStore);

        workflowsStore = {
          ...workflowsStore,
          selectedPerson: selectedPerson,
        } as unknown as WorkflowsStore;
        presenter = new SentenceProgressPresenter(
          workflowsStore,
          selectedPerson,
        );
      });

      test("timelineGaps finds gap of >7 years", () => {
        const timelineGaps = presenter.timelineGaps;
        expect(timelineGaps).toHaveLength(1);

        const tomorrow = addDays(new Date(), 1);
        expect(timelineGaps[0]).toEqual({
          start: tomorrow,
          end: subYears(presenter.endDate as Date, 7),
        });
      });

      test("timelineDomain excludes gap of >7 years", () => {
        const domain = presenter.timelineDomain;
        const gap = presenter.timelineGaps[0];
        expect(domain).not.toContainAnyValues(eachDayOfInterval(gap));

        const start = baseResidentWithDateGaps.admissionDate as Date;
        const end = baseResidentWithDateGaps.releaseDate as Date;
        expect(domain).toHaveLength(
          differenceInDays(end, start) - differenceInDays(gap.end, gap.start),
        );
      });
    });

    describe("ND metadata fields", () => {
      beforeEach(() => {
        selectedPerson = new Resident(usNDResidentRecord, rootStore);
        workflowsStore = {
          ...workflowsStore,
          selectedPerson: selectedPerson,
        } as unknown as WorkflowsStore;
        presenter = new SentenceProgressPresenter(
          workflowsStore,
          selectedPerson,
        );
      });

      test("timeline dates include parole review date", () => {
        const expectedParoleReviewEntry: TimelineDate = {
          date: fieldToDate("2024-01-01"),
          label: "Parole Review Date",
          formattedDate: "Jan 1, 2024",
          hideLabel: true,
        };

        expect(presenter.sortedTimelineDates).toContainEqual(
          expectedParoleReviewEntry,
        );
      });

      test("timeline dates include 85% date", () => {
        const expectedParoleReviewEntry: TimelineDate = {
          date: fieldToDate("2028-01-01"),
          label: "85% Date",
          formattedDate: "Jan 1, 2028",
          hideLabel: true,
        };

        expect(presenter.sortedTimelineDates).toContainEqual(
          expectedParoleReviewEntry,
        );
      });
    });
  });

  // TODO(#11154): Add metadata tests once client metadata is being visualized on
  // timeline
  describe("Client Progress", () => {
    beforeEach(() => {
      selectedPerson = new Client(baseClient, rootStore);
      workflowsStore = {
        ...workflowsStore,
        selectedPerson: selectedPerson,
      } as unknown as WorkflowsStore;
      presenter = new SentenceProgressPresenter(workflowsStore, selectedPerson);
    });

    test("start date", () => {
      expect(presenter.startDate).toEqual(baseClient.supervisionStartDate);
    });

    test("end date", () => {
      expect(presenter.endDate).toEqual(baseClient.expirationDate);
    });

    test("timeline dates include start date", () => {
      const expectedStartDate: TimelineDate = {
        date: fieldToDate("2022-02-02"),
        label: "Supervision Start",
        formattedDate: "Feb 2, 2022",
        hideLabel: false,
      };

      expect(presenter.sortedTimelineDates).toContainEqual(expectedStartDate);
    });

    test("timeline dates include end date", () => {
      const expectedEndDate: TimelineDate = {
        date: fieldToDate("2030-02-02"),
        label: "End Date",
        formattedDate: "Feb 2, 2030",
        hideLabel: false,
      };

      expect(presenter.sortedTimelineDates).toContainEqual(expectedEndDate);
    });

    test("timeline dates include today", () => {
      const todayDate: TimelineDate = {
        date: fieldToDate("2026-01-01"),
        label: "Today",
        formattedDate: formatWorkflowsDate(new Date()),
        hideLabel: true,
      };

      expect(presenter.sortedTimelineDates).toContainEqual(todayDate);
    });
  });
});
