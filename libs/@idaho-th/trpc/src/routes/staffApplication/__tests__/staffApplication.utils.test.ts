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
  ApplicationStage,
  ApplicationSubStage,
  ClosedOutcome,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";

import { buildAdvanceStageTimelineEventArgs } from "../advanceStage.helpers";
import {
  buildHousingApplicationUpdatePayload,
  parseCreateApplicationFormFields,
} from "../staffApplication.helpers";

describe("buildAdvanceStageTimelineEventArgs", () => {
  it("records CASE_CLOSED when the CM advances to Closed", () => {
    const event = buildAdvanceStageTimelineEventArgs({
      applicationId: "app-1",
      staffPseudonymizedId: "staff-1",
      fromStage: ApplicationStage.RELEASE,
      targetStage: ApplicationStage.CLOSED,
      closedOutcome: ClosedOutcome.CLIENT_RELEASED,
    });

    expect(event).toMatchObject({
      applicationId: "app-1",
      type: TimelineEventType.CASE_CLOSED,
      closedSubStage: ApplicationSubStage.RELEASED,
      actor: {
        role: TimelineActorRole.STAFF,
        pseudonymizedId: "staff-1",
      },
    });
  });

  it("records STAGE_ADVANCED for non-closed forward transitions", () => {
    const event = buildAdvanceStageTimelineEventArgs({
      applicationId: "app-1",
      staffPseudonymizedId: "staff-1",
      fromStage: ApplicationStage.APPLICATION,
      targetStage: ApplicationStage.APPROVALS,
      closedOutcome: undefined,
    });

    expect(event).toMatchObject({
      type: TimelineEventType.STAGE_ADVANCED,
      fromStage: ApplicationStage.APPLICATION,
      toStage: ApplicationStage.APPROVALS,
    });
  });
});

describe("parseCreateApplicationFormFields", () => {
  it("maps form fields into client name, IDOC number, and release date", () => {
    expect(
      parseCreateApplicationFormFields({
        clientFullName: "Jane Doe",
        idocNumber: "12345",
        tpdHousingNeededDate: "2026-05-01",
      } as never),
    ).toEqual({
      clientName: "Jane Doe",
      idocNumber: "12345",
      expectedReleaseDate: new Date("2026-05-01"),
    });
  });

  it("uses empty client name and null release date when fields are missing", () => {
    expect(parseCreateApplicationFormFields({} as never)).toEqual({
      clientName: "",
      idocNumber: undefined,
      expectedReleaseDate: null,
    });
  });
});

describe("buildHousingApplicationUpdatePayload", () => {
  it("converts expected release date strings to Date objects", () => {
    const payload = buildHousingApplicationUpdatePayload({
      expectedReleaseDate: "2026-06-15",
    } as never);

    expect(payload.expectedReleaseDate).toEqual(new Date("2026-06-15"));
  });

  it("clears expected release date when null is provided", () => {
    const payload = buildHousingApplicationUpdatePayload({
      expectedReleaseDate: null,
    } as never);

    expect(payload.expectedReleaseDate).toBeNull();
  });

  it("creates and deletes eligible providers in a single nested write", () => {
    const payload = buildHousingApplicationUpdatePayload({
      addEligibleProviders: [
        {
          providerId: "p1",
          providerLocationId: "loc-1",
          eligibilityOverrideNote: "CM override",
        },
      ],
      removeEligibleProviderIds: ["ep-old"],
    } as never);

    expect(payload.eligibleProviders).toEqual({
      create: [
        {
          providerId: "p1",
          providerLocationId: "loc-1",
          isSelected: true,
          isManualOverride: true,
          eligibilityOverrideNote: "CM override",
        },
      ],
      deleteMany: { providerId: { in: ["ep-old"] } },
    });
  });
});
