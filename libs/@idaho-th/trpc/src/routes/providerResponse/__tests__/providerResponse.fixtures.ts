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
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import {
  createHousingProviderLocation,
  createProviderApplicationThread,
  createProviderHousingApplication,
  seedApplicationWithProviders,
  TEST_DATES,
} from "~@idaho-th/trpc/test/factories";

type ProviderReviewApplicationOptions = {
  /** The provider's own stage; a home plan provider sits in Approvals or Release. */
  stage?: ApplicationStage;
  subStage?: ApplicationSubStage;
  staffStage?: ApplicationStage;
  sentToProvidersAt?: Date | null;
  withOpenInfoRequest?: boolean;
};

/**
 * An application sent to one organization and awaiting its response.
 *
 * `providerId` is an existing `HousingProvider` — normally the one
 * `seedProviderUserWithHousingProviders` created for the caller. Passing a second
 * organization's id seeds an application the caller must not be able to touch.
 */
export async function seedProviderReviewApplication(
  prismaClient: PrismaClient,
  providerId: string,
  {
    stage = ApplicationStage.APPLICATION,
    subStage = ApplicationSubStage.PROVIDER_REVIEW,
    staffStage = ApplicationStage.APPLICATION,
    sentToProvidersAt = TEST_DATES.SENT_TO_PROVIDERS,
    withOpenInfoRequest = false,
  }: ProviderReviewApplicationOptions = {},
) {
  const { application, staffApplication } = await seedApplicationWithProviders(
    prismaClient,
    {
      application: {
        sentToProvidersAt,
        // Deliberately stale so a test can prove a provider response bumped it.
        lastActivityAt: TEST_DATES.LAST_ACTIVITY,
      },
      staffApplication: { stage: staffStage },
    },
  );

  // The organization already exists, so the match is attached to it rather than
  // seeded with one of its own.
  const providerLocation = await createHousingProviderLocation(prismaClient, {
    providerId,
  });
  const providerApplication = await createProviderHousingApplication(
    prismaClient,
    {
      applicationId: application.id,
      providerId,
      providerLocationId: providerLocation.id,
      stage,
      subStage,
    },
  );

  const infoRequest = withOpenInfoRequest
    ? await createProviderApplicationThread(prismaClient, {
        providerApplicationId: providerApplication.id,
      })
    : undefined;

  return {
    providerId,
    providerLocation,
    application,
    staffApplication,
    providerApplication,
    infoRequest,
  };
}
