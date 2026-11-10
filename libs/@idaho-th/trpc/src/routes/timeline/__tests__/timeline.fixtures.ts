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
  type ApplicationStage,
  MessageSenderType,
  type PrismaClient,
  type ThreadType,
} from "~@idaho-th/prisma/client";
import {
  createProviderApplicationThread,
  createThreadMessage,
  seedApplicationWithProviders,
  type SeededApplicationProvider,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";

type MessageSeed = {
  senderType: MessageSenderType;
  body: string;
};

type InfoRequestSeed = {
  type?: ThreadType;
  messages?: MessageSeed[];
};

export type TimelineProviderSeed = {
  name?: string;
  stage?: ApplicationStage;
  infoRequests?: InfoRequestSeed[];
};

type TimelineApplicationOptions = {
  staffPseudonymizedId?: string;
  /**
   * The person who authors the provider side of an info request. Authorship is
   * per person even though the organization owns the match, so this is a
   * `HousingProviderUser` pseudonymized id, never an organization id.
   */
  providerPseudonymizedId?: string;
  providers?: TimelineProviderSeed[];
};

async function seedProviderInfoRequests(
  prismaClient: PrismaClient,
  { providerApplication }: SeededApplicationProvider,
  pseudonymizedIds: {
    staffPseudonymizedId: string;
    providerPseudonymizedId: string;
  },
  infoRequests: InfoRequestSeed[],
) {
  return Promise.all(
    infoRequests.map(async ({ type, messages = [] }) => {
      const infoRequest = await createProviderApplicationThread(prismaClient, {
        providerApplicationId: providerApplication.id,
        type,
      });

      const seededMessages = await Promise.all(
        messages.map(({ senderType, body }) =>
          createThreadMessage(prismaClient, {
            threadId: infoRequest.id,
            senderType,
            senderPseudonymizedId:
              senderType === MessageSenderType.PROVIDER
                ? pseudonymizedIds.providerPseudonymizedId
                : pseudonymizedIds.staffPseudonymizedId,
            body,
          }),
        ),
      );

      return { infoRequest, messages: seededMessages };
    }),
  );
}

/**
 * A staff-owned application with one provider application per entry in
 * `providers`. Timeline events are left to the test — they need the seeded
 * provider ids, and their `createdAt` ordering is usually the point.
 */
export async function seedTimelineApplication(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    providerPseudonymizedId = TEST_PROVIDER_PSEUDONYMIZED_ID,
    providers = [],
  }: TimelineApplicationOptions = {},
) {
  const {
    application,
    staffApplication,
    providers: seededProviders,
  } = await seedApplicationWithProviders(prismaClient, {
    staffApplication: { staffPseudonymizedId },
    providers: providers.map(({ name, stage }) => ({
      provider: { name },
      providerApplication: { stage },
    })),
  });

  const providersWithInfoRequests = await Promise.all(
    seededProviders.map(async (seeded, index) => ({
      ...seeded,
      infoRequests: await seedProviderInfoRequests(
        prismaClient,
        seeded,
        { staffPseudonymizedId, providerPseudonymizedId },
        providers[index]?.infoRequests ?? [],
      ),
    })),
  );

  return {
    application,
    staffApplication,
    providers: providersWithInfoRequests,
  };
}
