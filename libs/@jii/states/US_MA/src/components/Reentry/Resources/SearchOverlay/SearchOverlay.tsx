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

import { FC, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";
import { Button } from "~design-system";

import { useResourceSearch } from "../../../../hooks/useResourceSearch";
import { ResourceCard } from "../ResourceCard/ResourceCard";
import { ResourceSummary } from "../types";
import { getResourceChips, groupResourcesBySubcategory } from "../utils";
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

const { CategoryResults } = State.Resident.UsMaReentry.Resources;

export type SearchOverlayProps = {
  resources: ResourceSummary[];
  isOpen: boolean;
  onRequestClose: () => void;
};

export const SearchOverlay: FC<SearchOverlayProps> = ({
  resources,
  isOpen,
  onRequestClose,
}) => {
  const { t } = useUsMaTranslations();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReturnFocusRef = useRef(true);

  const { category, ...residentParams } = useTypedParams(CategoryResults);
  const location = useLocation();
  const { results, isQueryPending } = useResourceSearch(resources, query, t);

  const trimmedQuery = query.trim();
  const noMatchesMessage = t(($) => $.reentry.resources.search.noMatches, {
    query: trimmedQuery,
  });

  let resultAnnouncement = "";
  if (trimmedQuery && !isQueryPending) {
    resultAnnouncement =
      results.length > 0
        ? t(($) => $.reentry.resources.search.resultCount, {
            count: results.length,
          })
        : noMatchesMessage;
  }

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

  const backTarget = encodeURIComponent(
    `${location.pathname}${location.search}`,
  );
  // Keeps the route's category when the resource has it, so a housing result
  // opened from the housing list stays under housing. Otherwise uses the
  // resource's first category, lowercased to match the other category links.
  const detailPath = (resource: ResourceSummary) => {
    const resourceCategories = resource.categories.map((cat) =>
      cat.category.toLowerCase(),
    );
    const resultCategory = resourceCategories.includes(category.toLowerCase())
      ? category
      : resourceCategories[0];
    if (!resultCategory) return null;

    const path = CategoryResults.Detail.buildPath({
      ...residentParams,
      category: resultCategory,
      resourceId: resource.organizationId,
    });
    return `${path}?backTarget=${backTarget}`;
  };

  const subcategoryLinks = groupResourcesBySubcategory(resources, category).map(
    ([subcategory]) => ({
      label: subcategory,
      to: CategoryResults.buildPath(
        { ...residentParams, category },
        { subcategories: [subcategory] },
      ),
    }),
  );

  return (
    <StyledSearchOverlay
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel={t(($) => $.reentry.resources.search.ariaLabel)}
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
          placeholder={t(($) => $.reentry.resources.search.placeholder)}
          aria-label={t(($) => $.reentry.resources.search.placeholder)}
        />
        {query && (
          <ClearButton type="button" onClick={() => setQuery("")}>
            {t(($) => $.reentry.resources.search.clear)}
          </ClearButton>
        )}
        <Button kind="secondary" shape="block" onClick={handleClose}>
          {t(($) => $.reentry.resources.search.close)}
        </Button>
      </SearchBar>

      <VisuallyHidden role="status" aria-live="polite">
        {resultAnnouncement}
      </VisuallyHidden>

      <PageContainer>
        {results.length > 0 ? (
          <ResultList>
            {results.map((resource) => {
              const to = detailPath(resource);
              if (!to) return null;
              return (
                <ResourceCard
                  key={resource.organizationId}
                  name={resource.name}
                  to={to}
                  primaryContact={resource.primaryContactValue}
                  chips={getResourceChips(resource, t)}
                  onClick={handleNavigateAway}
                />
              );
            })}
          </ResultList>
        ) : (
          trimmedQuery &&
          !isQueryPending && (
            <>
              <EmptyMessage>{noMatchesMessage}</EmptyMessage>
              <BrowseLabel>
                {t(($) => $.reentry.resources.search.browseByCategory)}
              </BrowseLabel>
              <BrowseList>
                {subcategoryLinks.map(({ label, to }) => (
                  <li key={label}>
                    <BrowseLink to={to} onClick={handleNavigateAway}>
                      {label}
                    </BrowseLink>
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
