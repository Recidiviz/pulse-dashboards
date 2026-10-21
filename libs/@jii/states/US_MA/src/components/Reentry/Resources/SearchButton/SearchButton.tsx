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

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useRootStore } from "~@jii/data";
import { useUsMaTranslations } from "~@jii/translation";
import { Icon } from "~design-system";

import { ONE_HOUR_MS } from "../../../../hooks/useResources";
import { SearchOverlay } from "../SearchOverlay/SearchOverlay";
import { TriggerButton } from "./SearchButton.styles";

export const SearchButton = () => {
  const { t } = useUsMaTranslations();
  const [isSearchOpen, setSearchOpen] = useState(false);

  const {
    apiClient: { trpcQuerier },
  } = useRootStore();

  // Cache read (uses same key as useResources) and intentionally non-suspending
  const { data: resources } = useQuery({
    ...trpcQuerier.resident.resources.getResources.queryOptions(),
    staleTime: ONE_HOUR_MS,
  });

  if (!resources) return null;

  return (
    <>
      <TriggerButton type="button" onClick={() => setSearchOpen(true)}>
        <Icon kind="Search" size={16} />
        {t(($) => $.reentry.resources.search.trigger)}
      </TriggerButton>
      <SearchOverlay
        resources={resources}
        isOpen={isSearchOpen}
        onRequestClose={() => setSearchOpen(false)}
      />
    </>
  );
};
