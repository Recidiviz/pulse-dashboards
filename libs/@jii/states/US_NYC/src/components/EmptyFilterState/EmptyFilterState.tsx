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

import { FC } from "react";

import {
  BrowseLink,
  BrowseList,
  ClearButton,
  EmptyMessage,
  EmptyWrapper,
} from "./EmptyFilterState.styles";

export type CategoryLinkItem = {
  label: string;
  to: string;
};

export type EmptyFilterStateProps = {
  onClearFilters: () => void;
  categoryLinks: CategoryLinkItem[];
};

const EMPTY_FILTER_STATE_COPY = {
  noResults: "No programs match these filters.",
  clearFilters: "Clear filters",
  browseByCategory: "Or browse by category:",
};

export const EmptyFilterState: FC<EmptyFilterStateProps> = ({
  onClearFilters,
  categoryLinks,
}) => {
  return (
    <EmptyWrapper>
      <EmptyMessage>{EMPTY_FILTER_STATE_COPY.noResults}</EmptyMessage>
      <ClearButton type="button" onClick={onClearFilters}>
        {EMPTY_FILTER_STATE_COPY.clearFilters}
      </ClearButton>
      {categoryLinks.length > 0 ? (
        <>
          <EmptyMessage>
            {EMPTY_FILTER_STATE_COPY.browseByCategory}
          </EmptyMessage>
          <BrowseList>
            {categoryLinks.map(({ label, to }) => (
              <li key={label}>
                <BrowseLink to={to}>{label}</BrowseLink>
              </li>
            ))}
          </BrowseList>
        </>
      ) : null}
    </EmptyWrapper>
  );
};
