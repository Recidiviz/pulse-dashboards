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
  useTypedParams,
  useTypedSearchParams,
} from "react-router-typesafe-routes/dom";

import { ResourceExplorer } from "~@jii/paths";

import { ResourceSummary } from "../types";
import { useCreAnalytics } from "./useCreAnalytics";
import { groupResourcesBySubcategory, toggleFilterSelection } from "./utils";

export function useResourceFilters(resources: ResourceSummary[]) {
  const { trackFiltersUpdated, trackFilterCleared } = useCreAnalytics();
  const { category } = useTypedParams(ResourceExplorer.CategoryResults);

  const [
    { subcategories: selectedSubcategories, tags: selectedTags },
    setSearchParams,
  ] = useTypedSearchParams(ResourceExplorer.CategoryResults);

  const categoryResources = resources.filter((resource) =>
    resource.categories.some((cat) => cat.category === category),
  );

  const filteredCategoryResources = categoryResources.filter((resource) => {
    const resourceSubcategories = new Set(
      resource.categories
        .filter((cat) => cat.category === category)
        .map((cat) => cat.subcategory),
    );
    const matchesSubcategories = selectedSubcategories.every((subcategory) =>
      resourceSubcategories.has(subcategory),
    );
    const matchesTags = selectedTags.every((tag) =>
      resource.tags.includes(tag),
    );
    return matchesSubcategories && matchesTags;
  });

  const availableSubcategories = [
    ...new Set(
      categoryResources.flatMap((resource) =>
        resource.categories
          .filter((cat) => cat.category === category)
          .map((cat) => cat.subcategory),
      ),
    ),
  ].sort();

  const availableTags = [
    ...new Set(categoryResources.flatMap((resource) => resource.tags)),
  ].sort();

  const subcategoryGroupEntries = [
    ...groupResourcesBySubcategory(
      filteredCategoryResources,
      category,
    ).entries(),
  ].sort(([a], [b]) => a.localeCompare(b));

  return {
    filteredCategoryResources,
    subcategoryGroupEntries,

    availableSubcategories,
    availableTags,

    selectedSubcategories,
    selectedTags,
    activeFilterCount: selectedSubcategories.length + selectedTags.length,
    hasActiveFilters:
      selectedSubcategories.length > 0 || selectedTags.length > 0,

    toggleSubcategory: (subcategory: string) => {
      const newSubcategories = toggleFilterSelection(
        selectedSubcategories,
        subcategory,
      );
      setSearchParams(({ tags }) => ({
        subcategories: newSubcategories,
        tags,
      }));
      trackFiltersUpdated(category, newSubcategories, selectedTags);
    },
    toggleTag: (tag: string) => {
      const newTags = toggleFilterSelection(selectedTags, tag);
      setSearchParams(({ subcategories }) => ({
        subcategories,
        tags: newTags,
      }));
      trackFiltersUpdated(category, selectedSubcategories, newTags);
    },
    clearFilters: () => {
      setSearchParams({ subcategories: [], tags: [] });
      trackFilterCleared(category);
    },
  };
}
