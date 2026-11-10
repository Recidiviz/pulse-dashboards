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
  type HousingProvider,
  MessageSenderType,
  type PrismaClient,
  ThreadStatus,
} from "~@idaho-th/prisma/client";
import {
  createHousingProvider,
  createHousingProviderLocation,
  createProviderApplicationThread,
  createProviderHousingApplication,
  createThreadMessage,
  seedApplicationWithProviders,
  seedProviderUserWithHousingProviders,
  TEST_DATES,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";

export const PROVIDER_REQUEST_BODY = "Need more details";

/** The organization name the info request reads assert on. */
export const TEST_HOUSING_PROVIDER_NAME = "Sunrise House";

type MessageSeed = {
  senderType: MessageSenderType;
  /**
   * The PERSON who wrote it, never the organization. Defaults to the provider
   * user `providerCaller()` acts as (PROVIDER) or the owning staff (STAFF);
   * pass a different id to model a colleague at the same organization.
   */
  senderPseudonymizedId?: string;
  body?: string;
  originalBody?: string | null;
  readAt?: Date | null;
  editedAt?: Date | null;
  createdAt?: Date;
};

type InfoRequestSeed = {
  status?: ThreadStatus;
  /** Threads are returned newest-first, so a test seeding two must set both. */
  createdAt?: Date;
  messages?: MessageSeed[];
};

export type InfoRequestProviderSeed = {
  /**
   * An existing organization to match the application to — normally one
   * `seedProviderUserWithHousingProviders` created for the caller. Left out, a
   * fresh organization is seeded, which gives a thread the caller must not see.
   */
  providerId?: string;
  /** Ignored when `providerId` names an organization that already exists. */
  name?: string;
  subStage?: ApplicationSubStage;
  infoRequests?: InfoRequestSeed[];
};

type InfoRequestApplicationOptions = {
  staffPseudonymizedId?: string;
  stage?: ApplicationStage;
  sentToProvidersAt?: Date | null;
  /** Omit the staff application entirely (an application no CM owns). */
  withStaffApplication?: boolean;
  providers?: InfoRequestProviderSeed[];
};

/**
 * The single organization `providerCaller()` resolves to, with the person and
 * the assignment behind it. Named so a read can assert on it.
 */
export async function seedActiveHousingProvider(
  prismaClient: PrismaClient,
): Promise<HousingProvider> {
  const { housingProviders } = await seedProviderUserWithHousingProviders(
    prismaClient,
    { housingProviders: [{ name: TEST_HOUSING_PROVIDER_NAME }] },
  );
  return housingProviders[0];
}

async function seedInfoRequest(
  prismaClient: PrismaClient,
  providerApplicationId: string,
  senders: { provider: string; staff: string },
  { status, createdAt, messages = [] }: InfoRequestSeed,
) {
  const infoRequest = await createProviderApplicationThread(prismaClient, {
    providerApplicationId,
    ...(status ? { status } : {}),
    ...(createdAt ? { createdAt } : {}),
  });

  const seededMessages = await Promise.all(
    messages.map(({ senderType, senderPseudonymizedId, ...message }) =>
      createThreadMessage(prismaClient, {
        threadId: infoRequest.id,
        senderType,
        senderPseudonymizedId:
          senderPseudonymizedId ??
          (senderType === MessageSenderType.PROVIDER
            ? senders.provider
            : senders.staff),
        ...message,
      }),
    ),
  );

  return { infoRequest, messages: seededMessages };
}

type SeededInfoRequestProvider = {
  provider: HousingProvider;
  providerApplication: { id: string; providerId: string };
  infoRequests: Awaited<ReturnType<typeof seedInfoRequest>>[];
};

/**
 * Matches one organization to the application and hangs its threads off that
 * match. The thread's organization is reached only through this match row —
 * there is no organization column on the request or its messages.
 */
async function seedApplicationProviderWithInfoRequests(
  prismaClient: PrismaClient,
  applicationId: string,
  staffPseudonymizedId: string,
  {
    providerId,
    name = uniqueId("Second Chance Housing"),
    subStage = ApplicationSubStage.INFO_NEEDED,
    infoRequests = [],
  }: InfoRequestProviderSeed,
): Promise<SeededInfoRequestProvider> {
  const provider =
    providerId == null
      ? await createHousingProvider(prismaClient, { name })
      : await prismaClient.housingProvider.findUniqueOrThrow({
          where: { id: providerId },
        });

  const providerLocation = await createHousingProviderLocation(prismaClient, {
    providerId: provider.id,
  });
  const providerApplication = await createProviderHousingApplication(
    prismaClient,
    {
      applicationId,
      providerId: provider.id,
      providerLocationId: providerLocation.id,
      subStage,
    },
  );

  const senders = {
    provider: TEST_PROVIDER_PSEUDONYMIZED_ID,
    staff: staffPseudonymizedId,
  };

  return {
    provider,
    providerApplication,
    infoRequests: await Promise.all(
      infoRequests.map((seed) =>
        seedInfoRequest(prismaClient, providerApplication.id, senders, seed),
      ),
    ),
  };
}

/**
 * An application matched to one organization per entry in `providers`, each
 * with its own location and info-request threads. Organizations are returned in
 * the order the test asked for them.
 */
export async function seedInfoRequestApplication(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    stage = ApplicationStage.APPLICATION,
    sentToProvidersAt = TEST_DATES.SENT_TO_PROVIDERS,
    withStaffApplication = true,
    providers = [],
  }: InfoRequestApplicationOptions = {},
) {
  const { application, staffApplication } = await seedApplicationWithProviders(
    prismaClient,
    {
      application: {
        sentToProvidersAt,
        // Deliberately stale so a test can prove a write bumped lastActivityAt.
        lastActivityAt: TEST_DATES.LAST_ACTIVITY,
      },
      staffApplication: withStaffApplication
        ? { staffPseudonymizedId, stage }
        : null,
    },
  );

  // Promise.all keeps the results in the order the test asked for.
  const seededProviders = await Promise.all(
    providers.map((seed) =>
      seedApplicationProviderWithInfoRequests(
        prismaClient,
        application.id,
        staffPseudonymizedId,
        seed,
      ),
    ),
  );

  return { application, staffApplication, providers: seededProviders };
}

/** The common case: one organization waiting on info, with one unread question. */
export function openProviderInfoRequest(
  overrides: Omit<InfoRequestProviderSeed, "infoRequests"> = {},
): InfoRequestProviderSeed {
  return {
    ...overrides,
    infoRequests: [
      {
        status: ThreadStatus.OPEN,
        messages: [
          {
            senderType: MessageSenderType.PROVIDER,
            body: PROVIDER_REQUEST_BODY,
          },
        ],
      },
    ],
  };
}
