// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Prisma } from "@prisma/jii-texting-server/client";

export const MESSAGE_SERIES_INCLUDE_ATTEMPTS_AND_GROUP = {
  include: {
    messageAttempts: {
      select: {
        id: true,
        twilioMessageSid: true,
        status: true,
        createdTimestamp: true,
      },
      orderBy: {
        createdTimestamp: "desc",
      },
    },
    group: {
      select: {
        id: true,
        topicId: true,
        messageCopyTemplate: true,
        status: true,
      },
    },
  } satisfies Prisma.MessageSeriesInclude,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const messageSeriesWithOrderedAttemptsAndGroup =
  Prisma.validator<Prisma.MessageSeriesDefaultArgs>()(
    MESSAGE_SERIES_INCLUDE_ATTEMPTS_AND_GROUP,
  );

export type MessageSeriesWithAttemptsAndGroup = Prisma.MessageSeriesGetPayload<
  typeof messageSeriesWithOrderedAttemptsAndGroup
>;
