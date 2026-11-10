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

import { describe, expect, it, vi } from "vitest";

import {
  ApplicationStage,
  ApplicationSubStage,
  ReleaseTaskType,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { STAFF_CASE_CLOSED_MESSAGE } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";

import { recordTimelineEvent } from "../timeline.events";
import type { TimelineEventInput } from "../timeline.types";

function buildTx(staffStage: ApplicationStage = ApplicationStage.APPLICATION) {
  return {
    staffHousingApplication: {
      findFirst: vi.fn().mockResolvedValue({ stage: staffStage }),
    },
    housingApplicationTimelineEvent: { create: vi.fn() },
  };
}

describe("recordTimelineEvent", () => {
  const applicationId = "app-1";

  it("writes a STAFF event with its actor, scope, rendered copy, and metadata", async () => {
    const tx = buildTx();

    await recordTimelineEvent(tx as never, {
      applicationId,
      actor: {
        role: TimelineActorRole.STAFF,
        pseudonymizedId: "staff-1",
      },
      scopedProviderId: "provider-1",
      type: TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST,
      providerName: "Sunrise House",
      infoRequestId: "info-1",
      infoRequestMessageId: "message-1",
    });

    expect(tx.housingApplicationTimelineEvent.create).toHaveBeenCalledWith({
      data: {
        applicationId,
        eventType: TimelineEventType.CM_RESPONDED_TO_INFO_REQUEST,
        description: "Responded to information request from Sunrise House",
        actorRole: TimelineActorRole.STAFF,
        actorPseudonymizedId: "staff-1",
        scopedProviderId: "provider-1",
        cmOnly: false,
        metadata: {
          infoRequestId: "info-1",
          infoRequestMessageId: "message-1",
        },
      },
    });
  });

  it("nulls the actor id for SYSTEM events and keeps the required provider scope", async () => {
    const tx = buildTx();

    await recordTimelineEvent(tx as never, {
      applicationId,
      actor: { role: TimelineActorRole.SYSTEM },
      scopedProviderId: "provider-1",
      type: TimelineEventType.PROVIDER_NOT_SELECTED,
    });

    expect(tx.housingApplicationTimelineEvent.create).toHaveBeenCalledWith({
      data: {
        applicationId,
        eventType: TimelineEventType.PROVIDER_NOT_SELECTED,
        description: "Stage set to 'Closed'",
        actorRole: TimelineActorRole.SYSTEM,
        actorPseudonymizedId: null,
        scopedProviderId: "provider-1",
        cmOnly: false,
        metadata: undefined,
      },
    });
  });

  it("renders copy and stores structured metadata for release-task toggles", async () => {
    const tx = buildTx();

    await recordTimelineEvent(tx as never, {
      applicationId,
      actor: {
        role: TimelineActorRole.PROVIDER,
        pseudonymizedId: "provider-1",
      },
      type: TimelineEventType.RELEASE_TASK_UPDATED,
      releaseTaskType: ReleaseTaskType.BED_CONFIRMED,
      completed: false,
    });

    expect(tx.housingApplicationTimelineEvent.create).toHaveBeenCalledWith({
      data: {
        applicationId,
        eventType: TimelineEventType.RELEASE_TASK_UPDATED,
        description: "Bed Confirmed marked incomplete",
        actorRole: TimelineActorRole.PROVIDER,
        actorPseudonymizedId: "provider-1",
        scopedProviderId: null,
        cmOnly: false,
        metadata: {
          releaseTaskType: ReleaseTaskType.BED_CONFIRMED,
          completed: false,
        },
      },
    });
  });

  it("records a DOCUMENT_UPLOADED event with the file name for the CM", async () => {
    const tx = buildTx();

    await recordTimelineEvent(tx as never, {
      applicationId,
      actor: { role: TimelineActorRole.STAFF, pseudonymizedId: "staff-1" },
      scopedProviderId: null,
      type: TimelineEventType.DOCUMENT_UPLOADED,
      fileName: "lease-agreement.pdf",
    });

    expect(tx.housingApplicationTimelineEvent.create).toHaveBeenCalledWith({
      data: {
        applicationId,
        eventType: TimelineEventType.DOCUMENT_UPLOADED,
        description: "Document lease-agreement.pdf uploaded",
        actorRole: TimelineActorRole.STAFF,
        actorPseudonymizedId: "staff-1",
        scopedProviderId: null,
        cmOnly: false,
        metadata: undefined,
      },
    });
  });

  it("records a DOCUMENT_UPLOADED event scoped to the uploading provider", async () => {
    const tx = buildTx();

    await recordTimelineEvent(tx as never, {
      applicationId,
      actor: {
        role: TimelineActorRole.PROVIDER,
        pseudonymizedId: "provider-1",
      },
      scopedProviderId: "provider-1",
      type: TimelineEventType.DOCUMENT_UPLOADED,
      providerName: "Sunrise House",
      fileName: "lease-agreement.pdf",
    });

    expect(tx.housingApplicationTimelineEvent.create).toHaveBeenCalledWith({
      data: {
        applicationId,
        eventType: TimelineEventType.DOCUMENT_UPLOADED,
        description: "Sunrise House uploaded lease-agreement.pdf",
        actorRole: TimelineActorRole.PROVIDER,
        actorPseudonymizedId: "provider-1",
        scopedProviderId: "provider-1",
        cmOnly: false,
        metadata: undefined,
      },
    });
  });

  it("hides an event from all providers when cmOnly is set", async () => {
    const tx = buildTx();

    await recordTimelineEvent(tx as never, {
      applicationId,
      actor: { role: TimelineActorRole.STAFF, pseudonymizedId: "staff-1" },
      cmOnly: true,
      type: TimelineEventType.HOME_PLAN_ADDRESS_SET,
      streetAddress: "123 Main St",
    });

    expect(tx.housingApplicationTimelineEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cmOnly: true }),
      }),
    );
  });

  it("rejects a provider-scoped event recorded without a provider id", () => {
    // @ts-expect-error PROVIDER_DECLINED requires scopedProviderId
    const bad: TimelineEventInput = {
      type: TimelineEventType.PROVIDER_DECLINED,
      providerName: "Hope",
    };
    expect(bad).toBeTruthy();
  });

  it("rejects a cmOnly event recorded with a scopedProviderId instead", () => {
    // @ts-expect-error HOME_PLAN_ADDRESS_SET requires cmOnly, not scopedProviderId
    const bad: TimelineEventInput = {
      type: TimelineEventType.HOME_PLAN_ADDRESS_SET,
      streetAddress: "123 Main St",
      scopedProviderId: "provider-1",
    };
    expect(bad).toBeTruthy();
  });

  it("rejects a DOCUMENT_UPLOADED event with providerName but no scopedProviderId", () => {
    // @ts-expect-error providerName requires scopedProviderId to be set
    const bad: TimelineEventInput = {
      type: TimelineEventType.DOCUMENT_UPLOADED,
      providerName: "Hope",
    };
    expect(bad).toBeTruthy();
  });

  it("blocks new timeline events after the staff case is closed", async () => {
    const tx = buildTx(ApplicationStage.CLOSED);

    await expect(
      recordTimelineEvent(tx as never, {
        applicationId,
        actor: {
          role: TimelineActorRole.STAFF,
          pseudonymizedId: "staff-1",
        },
        type: TimelineEventType.EXPECTED_RELEASE_DATE_UPDATED,
        expectedReleaseDate: "2026-08-01",
      }),
    ).rejects.toThrow(STAFF_CASE_CLOSED_MESSAGE);

    expect(tx.housingApplicationTimelineEvent.create).not.toHaveBeenCalled();
  });

  it("still records CASE_CLOSED after the staff case is already closed", async () => {
    const tx = buildTx(ApplicationStage.CLOSED);

    await recordTimelineEvent(tx as never, {
      applicationId,
      actor: { role: TimelineActorRole.SYSTEM },
      type: TimelineEventType.CASE_CLOSED,
      closedSubStage: ApplicationSubStage.PLAN_REJECTED,
    });

    expect(tx.housingApplicationTimelineEvent.create).toHaveBeenCalled();
  });
});
