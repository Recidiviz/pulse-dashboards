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

import { useState } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { BottomSheet } from "~@jii/common-ui";
import { ResourceExplorer, State } from "~@jii/paths";
import { Button } from "~design-system";
import { pluralize } from "~utils";

import { Chip } from "../../components/Chip/Chip";
import { CollapsibleSection } from "../../components/CollapsibleSection/CollapsibleSection";
import { EmptyFilterState } from "../../components/EmptyFilterState/EmptyFilterState";
import { ResourceCard } from "../../components/ResourceCard/ResourceCard";
import { useResourceFilters } from "../../hooks/useResourceFilters";
import { useResources } from "../../hooks/useResources";
import { FilterGroup } from "./FilterGroup";
import {
  AccordionItem,
  AccordionList,
  ActiveChipsRow,
  DismissIcon,
  FilterBar,
  PageContainer,
  PageHeader,
  PageSubtitle,
  PageTitle,
  ResourceCount,
  ResourceList,
  SheetComingSoon,
  SheetSubtitle,
  SheetTitle,
} from "./PageUsNycResourceList.styles";

const COPY = {
  pageTitle: (category: string) => `${category} Resources`,
  pageSubtitle: (category: string) =>
    `Browse ${category.toLowerCase()} programs by topic. Use Filters to narrow the list.`,
  filtersButton: (activeCount: number) =>
    activeCount > 0 ? `Filters (${activeCount})` : "Filters",
  resourceCount: (count: number, sectionCount: number) =>
    sectionCount > 1
      ? `Showing ${pluralize(count, "resource")} (some may appear in multiple sections)`
      : `Showing ${pluralize(count, "resource")}`,
  badgeLabel: (count: number) => pluralize(count, "resource"),
  filterSheet: {
    title: "Filters",
    subtitle:
      "Tap options below to narrow the list. Selected filters apply together.",
    labelsGroup: "Labels",
    typeGroup: "Type",
    closeLabel: "Done",
    ariaLabel: "Filter resources",
    comingSoon: "Sort by distance coming soon",
  },
};

export function PageUsNycResourceList() {
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);

  const residentParams = useTypedParams(State.Resident);
  const { category } = useTypedParams(ResourceExplorer.CategoryResults);

  const { data, helpCategories, demographicCategories } = useResources();

  const {
    filteredCategoryResources,
    subcategoryGroupEntries,
    availableSubcategories,
    availableTags,
    activeFilterCount,
    hasActiveFilters,
    selectedSubcategories,
    selectedTags,
    toggleSubcategory,
    toggleTag,
    clearFilters,
  } = useResourceFilters(data);

  const detailPath = (resourceId: number) =>
    State.Resident.ResourceExplorer.CategoryResults.Detail.buildPath({
      ...residentParams,
      category,
      resourceId,
    });

  const categoryPath = (name: string) =>
    State.Resident.ResourceExplorer.CategoryResults.buildPath({
      ...residentParams,
      category: name,
    });

  const categoryLinks = [...helpCategories, ...demographicCategories]
    .filter((c) => c.name !== category)
    .map((c) => ({ label: c.name, to: categoryPath(c.name) }));

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>{COPY.pageTitle(category)}</PageTitle>
        <PageSubtitle>{COPY.pageSubtitle(category)}</PageSubtitle>
      </PageHeader>

      <FilterBar>
        <Button
          kind="secondary"
          shape="block"
          onClick={() => setFilterSheetOpen(true)}
        >
          {COPY.filtersButton(activeFilterCount)}
        </Button>
        {hasActiveFilters && (
          <ActiveChipsRow>
            {selectedSubcategories.map((sub) => (
              <Chip
                key={sub}
                selected
                onClick={() => toggleSubcategory(sub)}
                inverted
              >
                {sub} <DismissIcon />
              </Chip>
            ))}
            {selectedTags.map((tag) => (
              <Chip key={tag} selected onClick={() => toggleTag(tag)} inverted>
                {tag} <DismissIcon />
              </Chip>
            ))}
          </ActiveChipsRow>
        )}
      </FilterBar>

      {filteredCategoryResources.length > 0 && (
        <ResourceCount>
          {COPY.resourceCount(
            filteredCategoryResources.length,
            subcategoryGroupEntries.length,
          )}
        </ResourceCount>
      )}

      {filteredCategoryResources.length === 0 ? (
        <EmptyFilterState
          onClearFilters={clearFilters}
          categoryLinks={categoryLinks}
        />
      ) : (
        <AccordionList>
          {subcategoryGroupEntries.map(([subcategory, resources]) => (
            <AccordionItem key={subcategory}>
              <CollapsibleSection
                title={subcategory}
                badgeLabel={COPY.badgeLabel(resources.length)}
                stickyHeader
                headerBorder
              >
                <ResourceList>
                  {resources.map((resource) => (
                    <ResourceCard
                      key={resource.organizationId}
                      name={resource.name}
                      to={detailPath(resource.organizationId)}
                      description={resource.description}
                      primaryContact={resource.primaryContactValue}
                      chips={resource.tags}
                    />
                  ))}
                </ResourceList>
              </CollapsibleSection>
            </AccordionItem>
          ))}
        </AccordionList>
      )}

      <BottomSheet
        isOpen={isFilterSheetOpen}
        onRequestClose={() => setFilterSheetOpen(false)}
        closeLabel={COPY.filterSheet.closeLabel}
        ariaLabel={COPY.filterSheet.ariaLabel}
      >
        <SheetTitle>{COPY.filterSheet.title}</SheetTitle>
        <SheetSubtitle>{COPY.filterSheet.subtitle}</SheetSubtitle>

        <FilterGroup
          label={COPY.filterSheet.labelsGroup}
          items={availableTags}
          selectedItems={selectedTags}
          onToggle={toggleTag}
        />
        <FilterGroup
          label={COPY.filterSheet.typeGroup}
          items={availableSubcategories}
          selectedItems={selectedSubcategories}
          onToggle={toggleSubcategory}
        />
        <SheetComingSoon>{COPY.filterSheet.comingSoon}</SheetComingSoon>
      </BottomSheet>
    </PageContainer>
  );
}
