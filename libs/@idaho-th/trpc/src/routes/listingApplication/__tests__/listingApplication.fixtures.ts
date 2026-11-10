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
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  HomePlanType,
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import { ORDERED_RELEASE_TASK_TYPES } from "~@idaho-th/shared";
import {
  createHousingApplicationHomePlan,
  createHousingApplicationTimelineEvent,
  createHousingProviderLocation,
  createProviderHousingApplication,
  createProviderTimelineReadState,
  createStaffTimelineReadState,
  seedApplicationWithProviders,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";

export const DEFAULT_CLIENT_NAME = "Jane Doe";
export const DEFAULT_IDOC_NUMBER = "12345";
export const DEFAULT_EXPECTED_RELEASE_DATE = new Date(
  "2026-07-01T00:00:00.000Z",
);

type TimelineEventSeed = {
  actorPseudonymizedId?: string | null;
  createdAt: Date;
  cmOnly?: boolean;
  /** Index into `provider` — omit for an event every provider can see. */
  scopedToProvider?: boolean;
};

type StaffRecordSeed = {
  stage?: ApplicationStage;
  subStage?: ApplicationSubStage | null;
  status?: ApplicationStatus;
  intakeStatus?: ApplicationIntakeStatus;
  /**
   * StaffHousingApplication.updatedAt drives closed-case dashboard hiding.
   * Prisma manages `@updatedAt`, so a stale value has to be forced with raw SQL.
   */
  updatedAt?: Date;
};

type ProviderRecordSeed = {
  /**
   * An existing HousingProvider — the organization the match belongs to.
   * The queue is scoped to the organization, so a second organization's
   * application is seeded by passing that organization's id here.
   */
  providerId: string;
  stage?: ApplicationStage;
  subStage?: ApplicationSubStage;
  status?: ApplicationStatus;
  updatedAt?: Date;
};

type DashboardApplicationOptions = {
  staffPseudonymizedId?: string;
  clientName?: string;
  idocNumber?: string | null;
  expectedReleaseDate?: Date | null;
  lastActivityAt?: Date;
  /** Set to `null` for an application with no staff record at all. */
  staff?: StaffRecordSeed | null;
  provider?: ProviderRecordSeed;
  /** Completed count out of the ORDERED_RELEASE_TASK_TYPES rows. */
  homePlan?: { completedReleaseTaskCount: number };
  /** Marks the application read by the staff member who owns it. */
  staffReadState?: { lastOpenedModalAt: Date };
  /**
   * Marks it read for the whole organization the match belongs to — requires
   * `provider`. `providerUserId` attributes the read; leaving it out is the
   * organization-with-no-users case.
   */
  providerReadState?: { lastOpenedModalAt: Date; providerUserId?: string };
  timelineEvents?: TimelineEventSeed[];
};

async function forceStaffRecordUpdatedAt(
  prismaClient: PrismaClient,
  staffApplicationId: string,
  updatedAt: Date,
) {
  await prismaClient.$executeRaw`
    UPDATE "StaffHousingApplication" SET "updatedAt" = ${updatedAt}
    WHERE id = ${staffApplicationId}
  `;
}

async function forceProviderRecordUpdatedAt(
  prismaClient: PrismaClient,
  providerApplicationId: string,
  updatedAt: Date,
) {
  await prismaClient.$executeRaw`
    UPDATE "ProviderHousingApplication" SET "updatedAt" = ${updatedAt}
    WHERE id = ${providerApplicationId}
  `;
}

/**
 * Attaches a match to an organization that already exists, rather than seeding
 * one of its own: the caller's organization comes from
 * `seedProviderUserWithHousingProviders`, and a second organization is seeded
 * alongside it so a test can prove its rows are absent.
 */
async function seedApplicationMatch(
  prismaClient: PrismaClient,
  applicationId: string,
  provider: ProviderRecordSeed,
) {
  const {
    providerId,
    stage = ApplicationStage.APPLICATION,
    subStage = ApplicationSubStage.PROVIDER_REVIEW,
    status = ApplicationStatus.ACTION_NEEDED,
  } = provider;

  const providerLocation = await createHousingProviderLocation(prismaClient, {
    providerId,
  });

  return {
    providerLocation,
    providerApplication: await createProviderHousingApplication(prismaClient, {
      applicationId,
      providerId,
      providerLocationId: providerLocation.id,
      stage,
      subStage,
      status,
    }),
  };
}

/**
 * One application as the dashboard sees it: a staff record, optionally a
 * provider record, a home plan, timeline events, and a viewer read state.
 */
export async function seedDashboardApplication(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    clientName = DEFAULT_CLIENT_NAME,
    idocNumber = DEFAULT_IDOC_NUMBER,
    expectedReleaseDate = DEFAULT_EXPECTED_RELEASE_DATE,
    lastActivityAt = new Date(),
    staff = {},
    provider,
    homePlan,
    staffReadState,
    providerReadState,
    timelineEvents = [],
  }: DashboardApplicationOptions = {},
) {
  const { application, staffApplication } = await seedApplicationWithProviders(
    prismaClient,
    {
      application: {
        clientName,
        idocNumber,
        expectedReleaseDate,
        lastActivityAt,
      },
      staffApplication:
        staff === null
          ? null
          : {
              staffPseudonymizedId,
              stage: staff.stage ?? ApplicationStage.APPLICATION,
              subStage: staff.subStage ?? ApplicationSubStage.PROVIDER_REVIEW,
              status: staff.status ?? ApplicationStatus.WAITING,
              intakeStatus: staff.intakeStatus ?? ApplicationIntakeStatus.DRAFT,
            },
    },
  );

  const seededMatch = provider
    ? await seedApplicationMatch(prismaClient, application.id, provider)
    : undefined;

  if (staffApplication && staff?.updatedAt) {
    await forceStaffRecordUpdatedAt(
      prismaClient,
      staffApplication.id,
      staff.updatedAt,
    );
  }

  if (seededMatch && provider?.updatedAt) {
    await forceProviderRecordUpdatedAt(
      prismaClient,
      seededMatch.providerApplication.id,
      provider.updatedAt,
    );
  }

  if (homePlan) {
    await createHousingApplicationHomePlan(prismaClient, {
      applicationId: application.id,
      type: HomePlanType.MANUAL_ADDRESS,
      releaseTasks: {
        create: ORDERED_RELEASE_TASK_TYPES.map((taskType, index) => ({
          taskType,
          completed: index < homePlan.completedReleaseTaskCount,
        })),
      },
    });
  }

  if (staffReadState) {
    await createStaffTimelineReadState(prismaClient, {
      applicationId: application.id,
      staffPseudonymizedId,
      ...staffReadState,
    });
  }

  if (providerReadState) {
    if (!provider) {
      throw new Error("providerReadState needs a provider to belong to");
    }
    await createProviderTimelineReadState(prismaClient, {
      applicationId: application.id,
      providerId: provider.providerId,
      ...providerReadState,
    });
  }

  await Promise.all(
    timelineEvents.map((event) =>
      createHousingApplicationTimelineEvent(prismaClient, {
        applicationId: application.id,
        actorPseudonymizedId: event.actorPseudonymizedId ?? null,
        createdAt: event.createdAt,
        cmOnly: event.cmOnly ?? false,
        scopedProviderId: event.scopedToProvider
          ? provider?.providerId ?? null
          : null,
      }),
    ),
  );

  return {
    application,
    staffApplication,
    providerApplication: seededMatch?.providerApplication,
  };
}
