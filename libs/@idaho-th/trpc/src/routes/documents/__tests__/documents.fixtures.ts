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
  type PrismaClient,
  type TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  createHousingApplicationTimelineEvent,
  createHousingProviderUser,
  createHousingProviderUserAssignment,
  seedApplicationWithProviders,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";

type StaffDocumentsApplicationOptions = {
  staffPseudonymizedId?: string;
  staffStage?: ApplicationStage;
};

/** A staff-owned application with no providers attached. */
export async function seedStaffDocumentsApplication(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    staffStage = ApplicationStage.APPLICATION,
  }: StaffDocumentsApplicationOptions = {},
) {
  const { application, staffApplication } = await seedApplicationWithProviders(
    prismaClient,
    { staffApplication: { staffPseudonymizedId, stage: staffStage } },
  );

  return { application, staffApplication };
}

type ProviderDocumentsApplicationOptions = StaffDocumentsApplicationOptions & {
  providerStage?: ApplicationStage;
  /**
   * The PROVIDER_DECLINED / PROVIDER_NOT_SELECTED event that ends this
   * organization's access, which is what sets its shared-document cutoff
   * (§7.1). Only meaningful alongside a CLOSED `providerStage`.
   */
  closedEvent?: { eventType: TimelineEventType; createdAt: Date };
};

/**
 * A staff-owned application shared with one organization.
 *
 * Nobody is assigned to that organization yet — `seedDocumentsProviderUser`
 * is what gives a person access to it, so a test can seed a caller inside the
 * organization, inside a different one, or both.
 */
export async function seedProviderDocumentsApplication(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    staffStage = ApplicationStage.APPLICATION,
    providerStage = ApplicationStage.APPLICATION,
    closedEvent,
  }: ProviderDocumentsApplicationOptions = {},
) {
  const { application, staffApplication, providers } =
    await seedApplicationWithProviders(prismaClient, {
      staffApplication: { staffPseudonymizedId, stage: staffStage },
      providers: [{ providerApplication: { stage: providerStage } }],
    });

  const [{ provider, providerLocation, providerApplication }] = providers;

  if (closedEvent) {
    await createHousingApplicationTimelineEvent(prismaClient, {
      applicationId: application.id,
      eventType: closedEvent.eventType,
      createdAt: closedEvent.createdAt,
      scopedProviderId: provider.id,
    });
  }

  return {
    application,
    staffApplication,
    housingProvider: provider,
    providerLocation,
    providerApplication,
  };
}

type DocumentsProviderUserOptions = {
  /** The organization this person is assigned to. */
  providerId: string;
  /** Defaults to the identity providerCaller() acts as. */
  pseudonymizedId?: string;
};

/**
 * A provider portal login assigned to one organization. Called twice against
 * the same `providerId` it seeds colleagues who share that organization's
 * documents; called with different ones it seeds the privacy boundary.
 */
export async function seedDocumentsProviderUser(
  prismaClient: PrismaClient,
  {
    providerId,
    pseudonymizedId = TEST_PROVIDER_PSEUDONYMIZED_ID,
  }: DocumentsProviderUserOptions,
) {
  const user = await createHousingProviderUser(prismaClient, {
    pseudonymizedId,
  });
  await createHousingProviderUserAssignment(prismaClient, {
    providerUserId: user.id,
    providerId,
  });
  return user;
}
