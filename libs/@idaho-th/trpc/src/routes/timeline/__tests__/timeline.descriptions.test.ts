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
  ReleaseTaskType,
  TimelineEventType,
} from "~@idaho-th/prisma/client";

import { buildTimelineEventDescription } from "../timeline.descriptions";

describe("buildTimelineEventDescription", () => {
  it("describes application creation for the CM/provider timeline", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.APPLICATION_CREATED,
      }),
    ).toBe("Application created for client");
  });

  it("describes sending the application to providers", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
        providerCount: 3,
        providerIds: ["a", "b", "c"],
      }),
    ).toBe("Application submitted to providers");
  });

  it("names the provider on conditional approval, decline, and info request events", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.PROVIDER_CONDITIONALLY_APPROVED,
        scopedProviderId: "provider-1",
        providerName: "Hope Housing",
      }),
    ).toBe("Hope Housing conditionally approved");

    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.PROVIDER_DECLINED,
        scopedProviderId: "provider-1",
        providerName: "Hope Housing",
      }),
    ).toBe("Hope Housing declined");

    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.PROVIDER_REQUESTED_INFO,
        scopedProviderId: "provider-1",
        providerName: "Hope Housing",
        infoRequestId: "ir-1",
      }),
    ).toBe("Hope Housing requested more information");
  });

  it("describes the CM response to an info request", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST,
        scopedProviderId: "provider-1",
        providerName: "Hope Housing",
        infoRequestId: "ir-1",
        infoRequestMessageId: "msg-1",
      }),
    ).toBe("Responded to information request from Hope Housing");
  });

  it("describes home plan selection via provider or manual address", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.PROVIDER_SELECTED_AS_HOME_PLAN,
        scopedProviderId: "provider-1",
        providerName: "Hope Housing",
      }),
    ).toBe("Home plan set: Hope Housing");

    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.HOME_PLAN_ADDRESS_SET,
        cmOnly: true,
        streetAddress: "123 Main St",
      }),
    ).toBe("Home plan set: 123 Main St");
  });

  it("uses the closed-stage wording for not-selected and case-closed events", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.PROVIDER_NOT_SELECTED,
        scopedProviderId: "provider-1",
      }),
    ).toBe("Stage set to 'Closed'");

    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.CASE_CLOSED,
        closedSubStage: "CANCELED" as never,
      }),
    ).toBe("Stage set to 'Closed'");
  });

  it("formats expected release date updates as month/day/year", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.EXPECTED_RELEASE_DATE_UPDATED,
        expectedReleaseDate: "2026-04-23",
      }),
    ).toBe("Release date changed to: 4/23/2026");
  });

  it("labels stage advances with human-readable stage names", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.STAGE_ADVANCED,
        fromStage: ApplicationStage.APPLICATION,
        toStage: ApplicationStage.APPROVALS,
      }),
    ).toBe("Stage set to 'Approvals'");
  });

  it("describes approvals approve and reject outcomes", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.APPROVALS_HOUSING_PLAN_APPROVED,
      }),
    ).toBe("Housing plan approved");

    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.APPROVALS_HOUSING_PLAN_REJECTED,
      }),
    ).toBe("Housing plan rejected");
  });

  it("describes each release-task complete and incomplete toggle", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.RELEASE_TASK_UPDATED,
        releaseTaskType: ReleaseTaskType.BED_CONFIRMED,
        completed: true,
      }),
    ).toBe("Bed confirmed");

    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.RELEASE_TASK_UPDATED,
        releaseTaskType: ReleaseTaskType.TRANSPORTATION_SECURED,
        completed: false,
      }),
    ).toBe("Transportation Secured marked incomplete");

    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.RELEASE_TASK_UPDATED,
        releaseTaskType: ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS,
        completed: true,
      }),
    ).toBe("Transportation instructions");
  });

  it("attributes document uploads to a provider when scoped, otherwise generic", () => {
    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.DOCUMENT_UPLOADED,
        fileName: "lease-agreement.pdf",
        scopedProviderId: "provider-1",
        providerName: "Hope Housing",
      }),
    ).toBe("Hope Housing uploaded lease-agreement.pdf");

    expect(
      buildTimelineEventDescription({
        type: TimelineEventType.DOCUMENT_UPLOADED,
        fileName: "lease-agreement.pdf",
        scopedProviderId: null,
      }),
    ).toBe("Document lease-agreement.pdf uploaded");
  });
});
