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

import { describe, expect, it } from "vitest";

import {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
  HomePlanInvestigationResult,
  HomePlanType,
  ParoleCommissionDecision,
  ReleaseDecision,
} from "~@idaho-th/prisma/client";
import { deriveApprovalsOutcome } from "~@idaho-th/shared";

import {
  buildManualAddressHomePlanWriteData,
  buildSetApprovalsWriteData,
  computeApprovalsWaitStatus,
  computeManualAddressHomePlanProviderUpdates,
  mergeApprovalsDecisions,
} from "../homePlan.progression";
import type { ApprovalsDecisions } from "../homePlan.types";

describe("computeManualAddressHomePlanProviderUpdates", () => {
  it("closes still-active providers and marks conditionally approved as not selected", () => {
    expect(
      computeManualAddressHomePlanProviderUpdates([
        {
          id: "pa-1",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
        },
        {
          id: "pa-2",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
        },
        {
          id: "pa-3",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.INFO_NEEDED,
        },
      ]),
    ).toEqual([
      {
        providerApplicationId: "pa-1",
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.NOT_SELECTED,
        status: ApplicationStatus.DONE,
      },
      {
        providerApplicationId: "pa-2",
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.CANCELED,
        status: ApplicationStatus.DONE,
      },
      {
        providerApplicationId: "pa-3",
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.CANCELED,
        status: ApplicationStatus.DONE,
      },
    ]);
  });

  it("leaves already-declined providers untouched", () => {
    expect(
      computeManualAddressHomePlanProviderUpdates([
        {
          id: "pa-declined",
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.DECLINED,
        },
        {
          id: "pa-pending",
          stage: ApplicationStage.APPLICATION,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
        },
      ]),
    ).toEqual([
      {
        providerApplicationId: "pa-pending",
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.CANCELED,
        status: ApplicationStatus.DONE,
      },
    ]);
  });
});

describe("buildManualAddressHomePlanWriteData", () => {
  it("creates a manual address home plan and closes the staff case", () => {
    expect(
      buildManualAddressHomePlanWriteData(
        "123 Example St, Boise, ID 12345, USA",
        "staff-1",
        [],
      ),
    ).toEqual({
      homePlan: {
        create: {
          type: HomePlanType.MANUAL_ADDRESS,
          address: "123 Example St, Boise, ID 12345, USA",
          createdByStaffPseudonymizedId: "staff-1",
          releaseTasks: {
            create: expect.arrayContaining([
              expect.objectContaining({ taskType: expect.any(String) }),
            ]),
          },
        },
      },
      staffApplication: {
        update: {
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.CANCELED,
          status: ApplicationStatus.DONE,
          closedOutcome: null,
          closedOutcomeNote: null,
        },
      },
    });
  });

  it("closes all still-active providers when a manual address home plan is set", () => {
    expect(
      buildManualAddressHomePlanWriteData(
        "123 Example St, Boise, ID 83702, USA",
        "staff-1",
        [
          {
            id: "pa-1",
            stage: ApplicationStage.APPLICATION,
            subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
          },
          {
            id: "pa-2",
            stage: ApplicationStage.APPLICATION,
            subStage: ApplicationSubStage.INFO_NEEDED,
          },
          {
            id: "pa-declined",
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.DECLINED,
          },
        ],
      ),
    ).toMatchObject({
      providerApplications: {
        update: [
          {
            where: { id: "pa-1" },
            data: {
              stage: ApplicationStage.CLOSED,
              subStage: ApplicationSubStage.NOT_SELECTED,
              status: ApplicationStatus.DONE,
            },
          },
          {
            where: { id: "pa-2" },
            data: {
              stage: ApplicationStage.CLOSED,
              subStage: ApplicationSubStage.CANCELED,
              status: ApplicationStatus.DONE,
            },
          },
        ],
      },
    });
  });
});

type GateInput = Parameters<typeof deriveApprovalsOutcome>[0];

const NO_DECISIONS = {
  paroleCommissionDecision: null,
  releaseDecision: null,
  homePlanInvestigation: null,
} as const;

function termer(overrides: Partial<GateInput> = {}): GateInput {
  return { ...NO_DECISIONS, isRider: false, hasHomePlan: true, ...overrides };
}

function rider(overrides: Partial<GateInput> = {}): GateInput {
  return { ...NO_DECISIONS, isRider: true, hasHomePlan: true, ...overrides };
}

const CLOSE_RELEASE_DENIED = {
  type: "CLOSE",
  closedOutcome: ClosedOutcome.RELEASE_DENIED,
} as const;
const CLOSE_PLAN_REJECTED = {
  type: "CLOSE",
  closedOutcome: ClosedOutcome.HOUSING_PLAN_REJECTED,
} as const;
const ADVANCE = { type: "ADVANCE" } as const;
const WAIT = { type: "WAIT" } as const;

const PCD = ParoleCommissionDecision;
const HPI = HomePlanInvestigationResult;

describe("deriveApprovalsOutcome", () => {
  // Every Termer/PV combination of the Parole Commission Decision and the home
  // plan investigation, with a home plan.
  it.each([
    [null, null, WAIT],
    [null, HPI.APPROVED, WAIT],
    [null, HPI.NOT_APPLICABLE, WAIT],
    [null, HPI.REJECTED, CLOSE_PLAN_REJECTED],
    [PCD.PAROLE_GRANTED, null, WAIT],
    [PCD.PAROLE_GRANTED, HPI.APPROVED, ADVANCE],
    [PCD.PAROLE_GRANTED, HPI.NOT_APPLICABLE, ADVANCE],
    [PCD.PAROLE_GRANTED, HPI.REJECTED, CLOSE_PLAN_REJECTED],
    // A fully served sentence no longer skips the investigation.
    [PCD.NOT_APPLICABLE, null, WAIT],
    [PCD.NOT_APPLICABLE, HPI.APPROVED, ADVANCE],
    [PCD.NOT_APPLICABLE, HPI.NOT_APPLICABLE, ADVANCE],
    [PCD.NOT_APPLICABLE, HPI.REJECTED, CLOSE_PLAN_REJECTED],
    [PCD.PAROLE_DENIED, null, CLOSE_RELEASE_DENIED],
    [PCD.PAROLE_DENIED, HPI.APPROVED, CLOSE_RELEASE_DENIED],
    [PCD.PAROLE_DENIED, HPI.NOT_APPLICABLE, CLOSE_RELEASE_DENIED],
    [PCD.PAROLE_DENIED, HPI.REJECTED, CLOSE_RELEASE_DENIED],
  ])("Termer/PV: parole %s + investigation %s -> %o", (pcd, hpi, outcome) => {
    expect(
      deriveApprovalsOutcome(
        termer({ paroleCommissionDecision: pcd, homePlanInvestigation: hpi }),
      ),
    ).toEqual(outcome);
  });

  it.each([
    [PCD.PAROLE_GRANTED, WAIT],
    [PCD.NOT_APPLICABLE, WAIT],
    [PCD.PAROLE_DENIED, CLOSE_RELEASE_DENIED],
  ])("Termer/PV with no home plan yet: parole %s -> %o", (pcd, outcome) => {
    expect(
      deriveApprovalsOutcome(
        termer({ hasHomePlan: false, paroleCommissionDecision: pcd }),
      ),
    ).toEqual(outcome);
  });

  it.each([
    [null, null, WAIT],
    [null, HPI.APPROVED, WAIT],
    [null, HPI.REJECTED, CLOSE_PLAN_REJECTED],
    [ReleaseDecision.PROBATION_GRANTED, null, WAIT],
    [ReleaseDecision.PROBATION_GRANTED, HPI.APPROVED, ADVANCE],
    [ReleaseDecision.PROBATION_GRANTED, HPI.REJECTED, CLOSE_PLAN_REJECTED],
    // Not offered to a Rider; never clears the gate if it gets through.
    [ReleaseDecision.PROBATION_GRANTED, HPI.NOT_APPLICABLE, WAIT],
    [ReleaseDecision.PROBATION_DENIED, null, CLOSE_RELEASE_DENIED],
    [ReleaseDecision.PROBATION_DENIED, HPI.APPROVED, CLOSE_RELEASE_DENIED],
    [ReleaseDecision.PROBATION_DENIED, HPI.REJECTED, CLOSE_RELEASE_DENIED],
  ])("Rider: release %s + investigation %s -> %o", (rd, hpi, outcome) => {
    expect(
      deriveApprovalsOutcome(
        rider({ releaseDecision: rd, homePlanInvestigation: hpi }),
      ),
    ).toEqual(outcome);
  });

  it("ignores the other cohort's release-side decision", () => {
    expect(
      deriveApprovalsOutcome(
        rider({
          paroleCommissionDecision: PCD.PAROLE_DENIED,
          releaseDecision: ReleaseDecision.PROBATION_GRANTED,
          homePlanInvestigation: HPI.APPROVED,
        }),
      ),
    ).toEqual(ADVANCE);
    expect(
      deriveApprovalsOutcome(
        termer({ releaseDecision: ReleaseDecision.PROBATION_DENIED }),
      ),
    ).toEqual(WAIT);
  });

  it.each([
    {
      name: "Termer/PV",
      base: termer(),
      first: { paroleCommissionDecision: PCD.PAROLE_GRANTED },
      second: { homePlanInvestigation: HPI.APPROVED },
    },
    {
      name: "Rider",
      base: rider(),
      first: { releaseDecision: ReleaseDecision.PROBATION_GRANTED },
      second: { homePlanInvestigation: HPI.APPROVED },
    },
  ])(
    "$name: reaches the same outcome whichever decision is saved first",
    ({ base, first, second }) => {
      const persisted: ApprovalsDecisions = { ...NO_DECISIONS };
      const gate = (decisions: ApprovalsDecisions) =>
        deriveApprovalsOutcome({ ...base, ...decisions });

      const afterFirst = mergeApprovalsDecisions(persisted, first);
      const afterSecond = mergeApprovalsDecisions(persisted, second);

      expect(gate(afterFirst)).toEqual(WAIT);
      expect(gate(afterSecond)).toEqual(WAIT);
      expect(gate(mergeApprovalsDecisions(afterFirst, second))).toEqual(
        ADVANCE,
      );
      expect(gate(mergeApprovalsDecisions(afterSecond, first))).toEqual(
        ADVANCE,
      );
    },
  );
});

describe("buildSetApprovalsWriteData", () => {
  const granted = {
    paroleCommissionDecision: null,
    releaseDecision: ReleaseDecision.PROBATION_GRANTED,
    homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
  };
  const rejected = {
    paroleCommissionDecision: null,
    releaseDecision: ReleaseDecision.PROBATION_GRANTED,
    homePlanInvestigation: HomePlanInvestigationResult.REJECTED,
  };

  it("advances cleared cases to release for staff and selected provider", () => {
    const writeData = buildSetApprovalsWriteData(
      granted,
      deriveApprovalsOutcome(rider(granted)),
      "staff-1",
      "provider-app-1",
    );

    expect(writeData.staffApplication).toEqual({
      update: {
        stage: ApplicationStage.RELEASE,
        status: ApplicationStatus.ACTION_NEEDED,
      },
    });
    expect(writeData.providerApplications).toEqual({
      update: {
        where: { id: "provider-app-1" },
        data: {
          stage: ApplicationStage.RELEASE,
          status: ApplicationStatus.ACTION_NEEDED,
        },
      },
    });
    expect(writeData.homePlan?.update).toEqual({
      releaseDecision: granted.releaseDecision,
      homePlanInvestigation: granted.homePlanInvestigation,
      approvalsAt: expect.any(Date),
      approvalsByStaffPseudonymizedId: "staff-1",
    });
  });

  it("never writes the Parole Commission Decision onto the home plan", () => {
    const decisions = {
      paroleCommissionDecision: PCD.PAROLE_GRANTED,
      releaseDecision: null,
      homePlanInvestigation: null,
    };
    const writeData = buildSetApprovalsWriteData(
      decisions,
      deriveApprovalsOutcome(termer(decisions)),
      "staff-1",
      null,
    );

    expect(writeData.homePlan?.update).toEqual({
      releaseDecision: null,
      homePlanInvestigation: null,
    });
  });

  it("closes rejected cases and marks the provider view as canceled", () => {
    const writeData = buildSetApprovalsWriteData(
      rejected,
      deriveApprovalsOutcome(rider(rejected)),
      "staff-1",
      "provider-app-1",
    );

    expect(writeData.staffApplication).toEqual({
      update: {
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.PLAN_REJECTED,
        status: ApplicationStatus.DONE,
        closedOutcome: ClosedOutcome.HOUSING_PLAN_REJECTED,
        closedOutcomeNote: null,
      },
    });
    expect(writeData.providerApplications).toEqual({
      update: {
        where: { id: "provider-app-1" },
        data: {
          stage: ApplicationStage.CLOSED,
          subStage: ApplicationSubStage.CANCELED,
          status: ApplicationStatus.DONE,
        },
      },
    });
  });

  it("leaves providers alone when none is selected", () => {
    expect(
      buildSetApprovalsWriteData(
        granted,
        deriveApprovalsOutcome(rider(granted)),
        "staff-1",
        null,
      ).providerApplications,
    ).toBeUndefined();
    expect(
      buildSetApprovalsWriteData(
        rejected,
        deriveApprovalsOutcome(rider(rejected)),
        "staff-1",
        null,
      ).providerApplications,
    ).toBeUndefined();
  });

  it("sets staff waiting on P&P once the release-side decision is in", () => {
    const decisions = {
      paroleCommissionDecision: PCD.PAROLE_GRANTED,
      releaseDecision: null,
      homePlanInvestigation: null,
    };
    const writeData = buildSetApprovalsWriteData(
      decisions,
      deriveApprovalsOutcome(termer(decisions)),
      "staff-1",
      "provider-app-1",
    );

    expect(writeData.staffApplication).toEqual({
      update: { status: ApplicationStatus.WAITING_ON_PP },
    });
    expect(writeData.providerApplications).toBeUndefined();
  });
});

describe("computeApprovalsWaitStatus", () => {
  it.each([
    [null, null, ApplicationStatus.WAITING_ON_PAROLE_BOARD],
    [PCD.PAROLE_GRANTED, null, ApplicationStatus.WAITING_ON_PP],
    [PCD.NOT_APPLICABLE, null, ApplicationStatus.WAITING_ON_PP],
    [null, ReleaseDecision.PROBATION_GRANTED, ApplicationStatus.WAITING_ON_PP],
  ])(
    "parole %s / release %s -> %s",
    (paroleCommissionDecision, releaseDecision, status) => {
      expect(
        computeApprovalsWaitStatus({
          paroleCommissionDecision,
          releaseDecision,
        }),
      ).toBe(status);
    },
  );
});
