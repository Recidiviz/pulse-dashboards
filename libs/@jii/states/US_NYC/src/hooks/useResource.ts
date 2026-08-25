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

import { useSuspenseQuery } from "@tanstack/react-query";

import { useRootStore } from "~@jii/data";

import { US_NYC_CONTACT_LABELS } from "../constants";
import { buildContactInformation } from "./utils";

export function useResource(resourceId: number) {
  const {
    apiClient: { trpcQuerier },
  } = useRootStore();

  const { data } = useSuspenseQuery(
    trpcQuerier.resident.resources.getResource.queryOptions({
      organizationId: resourceId,
    }),
  );

  const labels = [
    ...data.categories.map(
      ({ category, subcategory }) => `${category} / ${subcategory}`,
    ),
    ...data.tags,
  ];

  const contactInformation = buildContactInformation(
    data.addresses,
    data.phoneNumbers,
    data.websites,
    US_NYC_CONTACT_LABELS,
  );

  return {
    name: data.name,
    description: data.description,
    contactInformation,
    labels,
  };
}
