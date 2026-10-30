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
import { useLocation } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { BottomSheet, usePageTitle } from "~@jii/common-ui";
import { useRootStore } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { useResources } from "../../../../hooks/useResources";
import { AppliedFilters } from "../AppliedFilters/AppliedFilters";
import { CollapsibleSection } from "../CollapsibleSection/CollapsibleSection";
import { FilterSheet } from "../FilterSheet/FilterSheet";
import { ResourceCard } from "../ResourceCard/ResourceCard";
import { SearchButton } from "../SearchButton/SearchButton";
import { getResourceChips, groupResourcesBySubcategory } from "../utils";
import {
  AccordionItem,
  AccordionList,
  EmptyState,
  Heading,
  PageHeader,
  PageSubtitle,
  ResourceCount,
  ResourceList as ResourceListWrapper,
  TitleRow,
  Wrapper,
} from "./ResourceList.styles";

export const ResourceList = () => {
  const { t } = useUsMaTranslations();
  usePageTitle(t(($) => $.reentry.resources.list.pageTitle));

  const {
    resources: matchingResources,
    appliedFilters,
    filterGroups,
    applyFilters,
  } = useResources();
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);
  const {
    userStore: { segmentClient },
  } = useRootStore();
  const { category, ...residentParams } = useTypedParams(
    State.Resident.UsMaReentry.Resources.CategoryResults,
  );
  const location = useLocation();

  const sections = groupResourcesBySubcategory(matchingResources, category);
  const resourceCount = new Set(
    sections.flatMap(([, resources]) =>
      resources.map((resource) => resource.organizationId),
    ),
  ).size;

  const categoryResultsPath =
    State.Resident.UsMaReentry.Resources.CategoryResults.buildPath({
      ...residentParams,
      category,
    });

  const listUrlWithFilters = encodeURIComponent(
    `${categoryResultsPath}${location.search}`,
  );

  const detailPath = (resourceId: number) => {
    const path =
      State.Resident.UsMaReentry.Resources.CategoryResults.Detail.buildPath({
        ...residentParams,
        category,
        resourceId,
      });
    return `${path}?backTarget=${listUrlWithFilters}`;
  };

  return (
    <Wrapper>
      <PageHeader>
        <TitleRow>
          <Heading>{t(($) => $.reentry.resources.list.pageTitle)}</Heading>
          <SearchButton />
        </TitleRow>
        <PageSubtitle>
          {t(($) => $.reentry.resources.list.subtitle)}
        </PageSubtitle>
      </PageHeader>

      <AppliedFilters
        groups={filterGroups}
        appliedFilters={appliedFilters}
        onChange={applyFilters}
        onOpenSheet={() => setFilterSheetOpen(true)}
      />

      {sections.length === 0 ? (
        <EmptyState>{t(($) => $.reentry.resources.list.emptyState)}</EmptyState>
      ) : (
        <div>
          <ResourceCount>
            {t(($) => $.reentry.resources.list.resultCount, {
              count: resourceCount,
            })}
          </ResourceCount>
          <AccordionList>
            {sections.map(([subcategory, resources]) => (
              <AccordionItem key={subcategory}>
                <CollapsibleSection
                  title={subcategory}
                  badgeLabel={t(($) => $.reentry.resources.list.sectionCount, {
                    count: resources.length,
                  })}
                  headerBorder
                  onToggle={(isOpen) =>
                    segmentClient.trackCreSubcategorySelected({
                      justiceInvolvedPersonPseudoId:
                        residentParams.personPseudoId,
                      category,
                      subcategory,
                      isOpen,
                    })
                  }
                >
                  <ResourceListWrapper>
                    {resources.map((resource) => (
                      <ResourceCard
                        key={resource.organizationId}
                        name={resource.name}
                        to={detailPath(resource.organizationId)}
                        primaryContact={resource.primaryContactValue}
                        chips={getResourceChips(resource, t)}
                        onClick={() =>
                          segmentClient.trackCreResourceViewed({
                            justiceInvolvedPersonPseudoId:
                              residentParams.personPseudoId,
                            resourceId: resource.organizationId,
                            resourceName: resource.name,
                            source: "category_list",
                          })
                        }
                      />
                    ))}
                  </ResourceListWrapper>
                </CollapsibleSection>
              </AccordionItem>
            ))}
          </AccordionList>
        </div>
      )}

      <BottomSheet
        isOpen={isFilterSheetOpen}
        onRequestClose={() => setFilterSheetOpen(false)}
        ariaLabel={t(($) => $.reentry.resources.filters.sheet.ariaLabel)}
        hideCloseButton
      >
        <FilterSheet
          groups={filterGroups}
          appliedFilters={appliedFilters}
          onApply={applyFilters}
          onClose={() => setFilterSheetOpen(false)}
        />
      </BottomSheet>
    </Wrapper>
  );
};
