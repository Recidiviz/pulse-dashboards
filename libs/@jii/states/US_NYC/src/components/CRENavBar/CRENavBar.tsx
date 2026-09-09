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
import { Wordmark } from "~@jii/layout";
import { Button } from "~design-system";

import { ONE_HOUR_MS } from "../../hooks/useResources";
import { BackButton } from "../BackButton/BackButton";
import { useBackTarget } from "../BackTarget/useBackTarget";
import { SearchOverlay } from "../SearchOverlay/SearchOverlay";
import { NavBar } from "./CRENavBar.styles";

const CRE_NAV_BAR_COPY = {
  ariaLabel: "Community Resources Navigation Bar",
  searchTrigger: "Search",
};

export function CRENavBar() {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const hasBackTarget = useBackTarget() !== null;

  const {
    apiClient: { trpcQuerier },
  } = useRootStore();

  // Cache read (uses same key as useResources) and intentionally non-suspending
  const { data: resources } = useQuery({
    ...trpcQuerier.resident.resources.getResources.queryOptions(),
    staleTime: ONE_HOUR_MS,
  });

  return (
    <NavBar aria-label={CRE_NAV_BAR_COPY.ariaLabel}>
      {hasBackTarget ? <BackButton /> : <Wordmark />}

      {resources && (
        <>
          <Button
            kind="secondary"
            shape="block"
            onClick={() => setSearchOpen(true)}
          >
            {CRE_NAV_BAR_COPY.searchTrigger}
          </Button>

          <SearchOverlay
            resources={resources}
            isOpen={isSearchOpen}
            onRequestClose={() => setSearchOpen(false)}
          />
        </>
      )}
    </NavBar>
  );
}
