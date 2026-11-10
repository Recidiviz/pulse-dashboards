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

import { useCallback } from "react";

import { USER_ROLE, UserRole } from "~@idaho-th/shared";

import { trpc } from "../trpc/client";

export function useDocumentsList(
  applicationId: string | undefined,
  role: UserRole,
) {
  const isStaff = role === USER_ROLE.STAFF;
  const staffList = trpc.documents.listForStaff.useQuery(
    { applicationId: applicationId ?? "" },
    { enabled: isStaff && !!applicationId, staleTime: 0 },
  );
  const providerList = trpc.documents.listForProvider.useQuery(
    { applicationId: applicationId ?? "" },
    { enabled: !isStaff && !!applicationId, staleTime: 0 },
  );
  return isStaff ? staffList : providerList;
}

export function useDocumentDownloadUrl(role: UserRole) {
  const utils = trpc.useUtils();
  const isStaff = role === USER_ROLE.STAFF;

  return useCallback(
    async (documentId: string, applicationId: string) => {
      const result = isStaff
        ? await utils.client.documents.getDownloadUrlForStaff.mutate({
            documentId,
          })
        : await utils.client.documents.getDownloadUrlForProvider.mutate({
            documentId,
          });

      void (isStaff
        ? utils.timeline.getForStaff.invalidate({ applicationId })
        : utils.timeline.getForProvider.invalidate({ applicationId }));

      return result;
    },
    [isStaff, utils],
  );
}
