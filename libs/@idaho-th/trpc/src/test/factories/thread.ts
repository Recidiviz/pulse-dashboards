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
  type Prisma,
  type PrismaClient,
  ThreadStatus,
  ThreadType,
} from "~@idaho-th/prisma/client";

type ProviderApplicationThreadInput = Pick<
  Prisma.ProviderApplicationThreadUncheckedCreateInput,
  "providerApplicationId"
> &
  Partial<Prisma.ProviderApplicationThreadUncheckedCreateInput>;

export function createProviderApplicationThread(
  prismaClient: PrismaClient,
  {
    providerApplicationId,
    type = ThreadType.INFO_REQUEST,
    ...overrides
  }: ProviderApplicationThreadInput,
) {
  return prismaClient.providerApplicationThread.create({
    data: {
      providerApplicationId,
      type,
      status: ThreadStatus.OPEN,
      ...overrides,
    },
  });
}

// The sender identifies who the thread is with, so it is never defaulted.
type ThreadMessageInput = Pick<
  Prisma.ThreadMessageUncheckedCreateInput,
  "threadId" | "senderType" | "senderPseudonymizedId"
> &
  Partial<Prisma.ThreadMessageUncheckedCreateInput>;

export function createThreadMessage(
  prismaClient: PrismaClient,
  {
    threadId,
    senderType,
    senderPseudonymizedId,
    ...overrides
  }: ThreadMessageInput,
) {
  return prismaClient.threadMessage.create({
    data: {
      threadId,
      senderType,
      senderPseudonymizedId,
      body: "Need more info",
      ...overrides,
    },
  });
}
