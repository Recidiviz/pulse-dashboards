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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";

import { Banner } from "../../components/Banner/Banner";
import { CategoryTile } from "../../components/CategoryTile/CategoryTile";
import { useResources } from "../../hooks/useResources";
import {
  EmptyState,
  GridSection,
  PageContainer,
  PageHeader,
  PageSubtitle,
  PageTitle,
  SectionHeading,
  TileGrid,
} from "./PageUsNycCRELanding.styles";

const COPY = {
  title: "Find community resources",
  subtitle:
    "Browse organizations in NYC that help with housing, jobs, food, health care, and more. Look up addresses and contact information so you can reach the support you need.",
  helpSection: "I need help with:",
  demographicSection: "I need resources for:",
  emptyState: "No resources are available yet. Check back soon.",
};

export function PageUsNycCRELanding() {
  const { hasResources, helpCategories, demographicCategories } =
    useResources();

  const residentParams = useTypedParams(State.Resident);
  const categoryPath = (name: string) =>
    State.Resident.ResourceExplorer.CategoryResults.buildPath({
      ...residentParams,
      category: name,
    });

  return (
    <PageContainer>
      <Banner />
      <PageHeader>
        <PageTitle>{COPY.title}</PageTitle>
        <PageSubtitle>{COPY.subtitle}</PageSubtitle>
      </PageHeader>

      {!hasResources ? (
        <EmptyState>{COPY.emptyState}</EmptyState>
      ) : (
        <>
          {helpCategories.length > 0 && (
            <GridSection>
              <SectionHeading>{COPY.helpSection}</SectionHeading>
              <TileGrid>
                {helpCategories.map((category) => (
                  <CategoryTile
                    key={category.name}
                    label={category.name}
                    count={category.resourceCount}
                    to={categoryPath(category.name)}
                  />
                ))}
              </TileGrid>
            </GridSection>
          )}

          {demographicCategories.length > 0 && (
            <GridSection>
              <SectionHeading>{COPY.demographicSection}</SectionHeading>
              <TileGrid>
                {demographicCategories.map((category) => (
                  <CategoryTile
                    key={category.name}
                    label={category.name}
                    count={category.resourceCount}
                    to={categoryPath(category.name)}
                  />
                ))}
              </TileGrid>
            </GridSection>
          )}
        </>
      )}
    </PageContainer>
  );
}
