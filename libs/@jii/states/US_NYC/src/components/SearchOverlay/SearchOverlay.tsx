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

import { FC, useMemo, useRef, useState } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";
import { Button } from "~design-system";

import { useCreAnalytics } from "../../hooks/useCreAnalytics";
import { useResourceSearch } from "../../hooks/useResourceSearch";
import { buildCategoryGrid, buildCategoryLinks } from "../../hooks/utils";
import { ResourceSummary } from "../../types";
import { ResourceCard } from "../ResourceCard/ResourceCard";
import {
  BrowseLabel,
  BrowseLink,
  BrowseList,
  ClearButton,
  EmptyMessage,
  PageContainer,
  ResultList,
  SearchBar,
  SearchInput,
  StyledSearchOverlay,
  VisuallyHidden,
} from "./SearchOverlay.styles";

const { ResourceExplorer } = State.Resident;
const { CategoryResults } = ResourceExplorer;

export type SearchOverlayProps = {
  resources: ResourceSummary[];
  isOpen: boolean;
  onRequestClose: () => void;
};

const SEARCH_OVERLAY_COPY = {
  ariaLabel: "Search resources",
  closeLabel: "Close",
  clearLabel: "Clear Text",
  placeholder: "Search resources by name or description",
  noMatches: (query: string) => `No programs match "${query}".`,
  resultsFound: (count: number) =>
    `${count} ${count === 1 ? "result" : "results"} found`,
  browseByCategory: "Browse by category instead:",
};

function getResultAnnouncement(
  trimmedQuery: string,
  resultCount: number,
  isQueryPending: boolean,
): string {
  if (!trimmedQuery || isQueryPending) return "";
  if (resultCount > 0) return SEARCH_OVERLAY_COPY.resultsFound(resultCount);
  return SEARCH_OVERLAY_COPY.noMatches(trimmedQuery);
}

export const SearchOverlay: FC<SearchOverlayProps> = ({
  resources,
  isOpen,
  onRequestClose,
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReturnFocusRef = useRef(true);

  const residentParams = useTypedParams(State.Resident);
  const { trackSearchQuery, trackResourceViewed } = useCreAnalytics();

  const { helpCategories, demographicCategories } = useMemo(
    () => buildCategoryGrid(resources),
    [resources],
  );
  const { results, isQueryPending } = useResourceSearch(
    resources,
    query,
    trackSearchQuery,
  );

  const trimmedQuery = query.trim();
  const resultAnnouncement = getResultAnnouncement(
    trimmedQuery,
    results.length,
    isQueryPending,
  );

  const handleClose = () => {
    setQuery("");
    onRequestClose();
  };

  // Skips react-modal's focus-return to "Search" when navigating to a new page as a screen
  // reader would announce the old page's trigger instead of the page we just navigated to.
  const handleNavigateAway = () => {
    shouldReturnFocusRef.current = false;
    handleClose();
  };

  const categoryPath = (category: string) =>
    CategoryResults.buildPath({ ...residentParams, category });

  const detailPath = (resource: ResourceSummary, category: string) => {
    const path = CategoryResults.Detail.buildPath({
      ...residentParams,
      category,
      resourceId: resource.organizationId,
    });
    const backTarget = encodeURIComponent(categoryPath(category));
    return `${path}?backTarget=${backTarget}`;
  };

  const categoryLinks = buildCategoryLinks(
    { helpCategories, demographicCategories },
    categoryPath,
  );

  return (
    <StyledSearchOverlay
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel={SEARCH_OVERLAY_COPY.ariaLabel}
      onAfterOpen={() => {
        inputRef.current?.focus();
        shouldReturnFocusRef.current = true;
      }}
      shouldReturnFocusAfterClose={shouldReturnFocusRef.current}
      closeTimeoutMS={0}
    >
      <SearchBar>
        <SearchInput
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={SEARCH_OVERLAY_COPY.placeholder}
          aria-label={SEARCH_OVERLAY_COPY.placeholder}
        />
        {query && (
          <ClearButton type="button" onClick={() => setQuery("")}>
            {SEARCH_OVERLAY_COPY.clearLabel}
          </ClearButton>
        )}
        <Button kind="secondary" shape="block" onClick={handleClose}>
          {SEARCH_OVERLAY_COPY.closeLabel}
        </Button>
      </SearchBar>

      <VisuallyHidden role="status" aria-live="polite">
        {resultAnnouncement}
      </VisuallyHidden>

      <PageContainer>
        {results.length > 0 ? (
          <ResultList onClick={handleNavigateAway}>
            {results.map((resource) => {
              const category = resource.categories[0]?.category;
              if (!category) return null;
              return (
                <ResourceCard
                  key={resource.organizationId}
                  name={resource.name}
                  to={detailPath(resource, category)}
                  chips={resource.tags}
                  compact
                  onClick={() =>
                    trackResourceViewed(
                      resource.organizationId,
                      resource.name,
                      "search",
                    )
                  }
                />
              );
            })}
          </ResultList>
        ) : (
          trimmedQuery &&
          !isQueryPending && (
            <>
              <EmptyMessage>
                {SEARCH_OVERLAY_COPY.noMatches(trimmedQuery)}
              </EmptyMessage>
              <BrowseLabel>{SEARCH_OVERLAY_COPY.browseByCategory}</BrowseLabel>
              <BrowseList onClick={handleNavigateAway}>
                {categoryLinks.map(({ label, to }) => (
                  <li key={label}>
                    <BrowseLink to={to}>{label}</BrowseLink>
                  </li>
                ))}
              </BrowseList>
            </>
          )
        )}
      </PageContainer>
    </StyledSearchOverlay>
  );
};
