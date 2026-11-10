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
} from "~@idaho-th/prisma/client";
import { PROVIDER_RESPONSE_TYPE } from "~@idaho-th/shared";

import {
  compareProviderApplicationSubStages,
  computeStaffApplicationSubStage,
  computeStaffStatusAfterProviderUpdate,
  computeStaffSubStageAfterProviderUpdate,
  computeStaffSubStageAfterStaffInfoReply,
  getProviderResponseValidationError,
  PROVIDER_RESPONSE_TRANSITIONS,
} from "../applicationProgression";

const baseProviderApp = {
  id: "provider-app-1",
  providerId: "provider-1",
  stage: ApplicationStage.APPLICATION,
  subStage: ApplicationSubStage.PROVIDER_REVIEW,
  providerName: "Sunrise House",
  application: {
    id: "app-1",
    sentToProvidersAt: new Date(),
    staffApplication: { id: "staff-1", status: ApplicationStatus.WAITING },
    providerApplications: [],
  },
};

describe("compareProviderApplicationSubStages", () => {
  it("orders conditionally approved before info needed, pending, and declined", () => {
    expect(
      compareProviderApplicationSubStages(
        ApplicationSubStage.CONDITIONALLY_APPROVED,
        ApplicationSubStage.INFO_NEEDED,
      ),
    ).toBeLessThan(0);
    expect(
      compareProviderApplicationSubStages(
        ApplicationSubStage.INFO_NEEDED,
        ApplicationSubStage.PROVIDER_REVIEW,
      ),
    ).toBeLessThan(0);
    expect(
      compareProviderApplicationSubStages(
        ApplicationSubStage.PROVIDER_REVIEW,
        ApplicationSubStage.DECLINED,
      ),
    ).toBeLessThan(0);
  });

  it("ranks unknown substages after the known provider workflow substages", () => {
    expect(
      compareProviderApplicationSubStages(
        ApplicationSubStage.DECLINED,
        ApplicationSubStage.SELECTED,
      ),
    ).toBeLessThan(0);
  });
});

describe("computeStaffApplicationSubStage", () => {
  it("sets the staff application substage to OFFERS_RECEIVED when any provider conditionally approves", () => {
    const subStage = computeStaffApplicationSubStage([
      ApplicationSubStage.PROVIDER_REVIEW,
      ApplicationSubStage.CONDITIONALLY_APPROVED,
      ApplicationSubStage.INFO_NEEDED,
    ]);

    expect(subStage).toBe(ApplicationSubStage.OFFERS_RECEIVED);
  });

  it("sets the staff application substage to INFO_NEEDED when any provider requests info and no providers approved", () => {
    const subStage = computeStaffApplicationSubStage([
      ApplicationSubStage.PROVIDER_REVIEW,
      ApplicationSubStage.INFO_NEEDED,
    ]);

    expect(subStage).toBe(ApplicationSubStage.INFO_NEEDED);
  });

  it("returns PROVIDER_REVIEW when providers are still reviewing", () => {
    const subStage = computeStaffApplicationSubStage([
      ApplicationSubStage.PROVIDER_REVIEW,
      ApplicationSubStage.DECLINED,
    ]);

    expect(subStage).toBe(ApplicationSubStage.PROVIDER_REVIEW);
  });

  it("sets the staff application substage to DECLINED only when all providers decline", () => {
    const subStage = computeStaffApplicationSubStage([
      ApplicationSubStage.DECLINED,
      ApplicationSubStage.DECLINED,
    ]);

    expect(subStage).toBe(ApplicationSubStage.DECLINED);
  });

  it("treats an empty provider list as Declined (all providers declined)", () => {
    expect(computeStaffApplicationSubStage([])).toBe(
      ApplicationSubStage.DECLINED,
    );
  });
});

describe("PROVIDER_RESPONSE_TRANSITIONS", () => {
  it("conditionally approve keeps Application stage and sets provider Waiting", () => {
    expect(
      PROVIDER_RESPONSE_TRANSITIONS[
        PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE
      ].providerUpdate,
    ).toEqual({
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      status: ApplicationStatus.WAITING,
    });
  });

  it("request info keeps Application stage and sets provider Waiting", () => {
    expect(
      PROVIDER_RESPONSE_TRANSITIONS[PROVIDER_RESPONSE_TYPE.INFO_NEEDED]
        .providerUpdate,
    ).toEqual({
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.INFO_NEEDED,
      status: ApplicationStatus.WAITING,
    });
  });

  it("decline closes the provider application as Done", () => {
    expect(
      PROVIDER_RESPONSE_TRANSITIONS[PROVIDER_RESPONSE_TYPE.DECLINE]
        .providerUpdate,
    ).toEqual({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.DECLINED,
      status: ApplicationStatus.DONE,
    });
  });
});

describe("computeStaffSubStageAfterProviderUpdate", () => {
  it("applies the updated provider sub-stage before computing staff sub-stage", () => {
    const staffSubStage = computeStaffSubStageAfterProviderUpdate(
      [
        { id: "a", subStage: ApplicationSubStage.PROVIDER_REVIEW },
        { id: "b", subStage: ApplicationSubStage.PROVIDER_REVIEW },
      ],
      "a",
      ApplicationSubStage.CONDITIONALLY_APPROVED,
    );

    expect(staffSubStage).toBe(ApplicationSubStage.OFFERS_RECEIVED);
  });
});

describe("computeStaffSubStageAfterStaffInfoReply", () => {
  it("returns PROVIDER_REVIEW when no other providers need info", () => {
    const staffSubStage = computeStaffSubStageAfterStaffInfoReply(
      [
        { id: "a", subStage: ApplicationSubStage.INFO_NEEDED },
        { id: "b", subStage: ApplicationSubStage.PROVIDER_REVIEW },
      ],
      "a",
    );

    expect(staffSubStage).toBe(ApplicationSubStage.PROVIDER_REVIEW);
  });

  it("returns INFO_NEEDED when another provider still needs info", () => {
    const staffSubStage = computeStaffSubStageAfterStaffInfoReply(
      [
        { id: "a", subStage: ApplicationSubStage.INFO_NEEDED },
        { id: "b", subStage: ApplicationSubStage.INFO_NEEDED },
      ],
      "a",
    );

    expect(staffSubStage).toBe(ApplicationSubStage.INFO_NEEDED);
  });
});

describe("computeStaffStatusAfterProviderUpdate", () => {
  it("sets ACTION_NEEDED when a provider conditionally approves", () => {
    const staffStatus = computeStaffStatusAfterProviderUpdate(
      ApplicationStatus.WAITING,
      ApplicationSubStage.OFFERS_RECEIVED,
      PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE,
    );

    expect(staffStatus).toBe(ApplicationStatus.ACTION_NEEDED);
  });

  it("preserves staff status when only some providers declined", () => {
    const staffStatus = computeStaffStatusAfterProviderUpdate(
      ApplicationStatus.WAITING,
      ApplicationSubStage.PROVIDER_REVIEW,
      PROVIDER_RESPONSE_TYPE.DECLINE,
    );

    expect(staffStatus).toBe(ApplicationStatus.WAITING);
  });

  it("sets ACTION_NEEDED when all providers declined", () => {
    const staffStatus = computeStaffStatusAfterProviderUpdate(
      ApplicationStatus.WAITING,
      ApplicationSubStage.DECLINED,
      PROVIDER_RESPONSE_TYPE.DECLINE,
    );

    expect(staffStatus).toBe(ApplicationStatus.ACTION_NEEDED);
  });

  it.each([
    [ApplicationSubStage.PROVIDER_REVIEW, ApplicationStatus.WAITING],
    [ApplicationSubStage.OFFERS_RECEIVED, ApplicationStatus.ACTION_NEEDED],
    [ApplicationSubStage.INFO_NEEDED, ApplicationStatus.ACTION_NEEDED],
    [ApplicationSubStage.DECLINED, ApplicationStatus.ACTION_NEEDED],
  ])(
    "after a revoke rolls up to %s, sets %s",
    (staffSubStage, expectedStatus) => {
      // The revoked offer had already set ACTION_NEEDED.
      const staffStatus = computeStaffStatusAfterProviderUpdate(
        ApplicationStatus.ACTION_NEEDED,
        staffSubStage,
        PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL,
      );

      expect(staffStatus).toBe(expectedStatus);
    },
  );

  it("sets ACTION_NEEDED when a provider requests more info", () => {
    const staffStatus = computeStaffStatusAfterProviderUpdate(
      ApplicationStatus.WAITING,
      ApplicationSubStage.INFO_NEEDED,
      PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
    );

    expect(staffStatus).toBe(ApplicationStatus.ACTION_NEEDED);
  });
});

describe("getProviderResponseValidationError", () => {
  it("allows INFO_NEEDED from PROVIDER_REVIEW", () => {
    const error = getProviderResponseValidationError(
      baseProviderApp,
      PROVIDER_RESPONSE_TRANSITIONS[PROVIDER_RESPONSE_TYPE.INFO_NEEDED],
    );

    expect(error).toBeUndefined();
  });

  it("allows INFO_NEEDED from CONDITIONALLY_APPROVED", () => {
    const error = getProviderResponseValidationError(
      {
        ...baseProviderApp,
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      },
      PROVIDER_RESPONSE_TRANSITIONS[PROVIDER_RESPONSE_TYPE.INFO_NEEDED],
    );

    expect(error).toBeUndefined();
  });

  it("rejects CONDITIONALLY_APPROVE after a response was already submitted", () => {
    const error = getProviderResponseValidationError(
      {
        ...baseProviderApp,
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      },
      PROVIDER_RESPONSE_TRANSITIONS[
        PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE
      ],
    );

    expect(error?.message).toBe("Application has already been responded to");
  });

  it("allows CONDITIONALLY_APPROVE from INFO_NEEDED", () => {
    const error = getProviderResponseValidationError(
      {
        ...baseProviderApp,
        subStage: ApplicationSubStage.INFO_NEEDED,
      },
      PROVIDER_RESPONSE_TRANSITIONS[
        PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE
      ],
    );

    expect(error).toBeUndefined();
  });

  it("allows DECLINE from INFO_NEEDED", () => {
    const error = getProviderResponseValidationError(
      {
        ...baseProviderApp,
        subStage: ApplicationSubStage.INFO_NEEDED,
      },
      PROVIDER_RESPONSE_TRANSITIONS[PROVIDER_RESPONSE_TYPE.DECLINE],
    );

    expect(error).toBeUndefined();
  });

  it("allows DECLINE from CONDITIONALLY_APPROVED", () => {
    const error = getProviderResponseValidationError(
      {
        ...baseProviderApp,
        subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      },
      PROVIDER_RESPONSE_TRANSITIONS[PROVIDER_RESPONSE_TYPE.DECLINE],
    );

    expect(error).toBeUndefined();
  });

  it("rejects responses when the provider was selected as the home plan", () => {
    const error = getProviderResponseValidationError(
      {
        ...baseProviderApp,
        subStage: ApplicationSubStage.SELECTED,
      },
      PROVIDER_RESPONSE_TRANSITIONS[
        PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE
      ],
    );

    expect(error?.message).toBe(
      "Application response can no longer be changed",
    );
  });

  it("rejects responses after the provider declined", () => {
    const error = getProviderResponseValidationError(
      {
        ...baseProviderApp,
        subStage: ApplicationSubStage.DECLINED,
      },
      PROVIDER_RESPONSE_TRANSITIONS[PROVIDER_RESPONSE_TYPE.INFO_NEEDED],
    );

    expect(error?.message).toBe(
      "Application response can no longer be changed",
    );
  });
});
