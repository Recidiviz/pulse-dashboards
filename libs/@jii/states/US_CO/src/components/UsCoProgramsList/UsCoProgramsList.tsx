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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, useState } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components";

import {
  ButtonLink,
  HomepageSectionHeading,
  PageContainer,
} from "~@jii/common-ui";
import { useRootStore } from "~@jii/data";
import { FullWidthBanner, MainContentHydrator } from "~@jii/layout";
import { State } from "~@jii/paths";
import { useUsCoTranslations } from "~@jii/translation";
import { Icon, palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import {
  UsCoProgram,
  UsCoProgramsPresenter,
} from "../../presenters/UsCoProgramsPresenter";
import { CategorySection } from "./CategorySection";
import { FilterPanel } from "./FilterPanel";
import { ProgramCard } from "./ProgramCard";
import { ProgramDetailModal } from "./ProgramDetailModal";

const Header = styled.header`
  margin-top: ${rem(spacing.lg)};
  margin-bottom: ${rem(spacing.lg)};
`;

const Description = styled.p`
  ${typography.Sans14};
  color: ${palette.slate85};
  margin: 0 0 ${rem(spacing.md)} 0;
  line-height: 1.4;
`;

const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.md)};
  padding: ${rem(spacing.md)};
  border-top: 1px solid ${palette.slate20};
  border-bottom: 1px solid ${palette.slate20};
`;

const ResultsText = styled.p`
  ${typography.Sans14};
  color: ${palette.slate70};
`;

const HighlightedText = styled.span`
  color: ${palette.opportunitiesAppGreen};
`;

const CategoriesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(36)};
  padding-bottom: ${rem(spacing.lg)};
`;

const ManagedComponent: FC<{ presenter: UsCoProgramsPresenter }> = observer(
  function UsCoProgramsList({ presenter }) {
    const { t } = useUsCoTranslations();
    const pathParams = useTypedParams(State.Resident);

    const [selectedProgram, setSelectedProgram] = useState<
      UsCoProgram | undefined
    >(undefined);

    const handleToggleStar = (programId: string) => {
      presenter.toggleStarred(programId);
    };

    return (
      <PageContainer>
        <FullWidthBanner>
          {t(($) => $.programs.lastUpdated, {
            date: presenter.lastUpdatedDate,
          })}
        </FullWidthBanner>

        <Header>
          <HomepageSectionHeading>
            {t(($) => $.programs.pageTitle)}
          </HomepageSectionHeading>
          <Description>{t(($) => $.programs.pageDescription)}</Description>
          <ButtonLink
            to={State.Resident.UsCoMoreInformation.EarnedTime.buildPath(
              pathParams,
            )}
          >
            {t(($) => $.programs.learnMoreLink)}
            <Icon kind="Arrow" size={12} />
          </ButtonLink>
        </Header>

        <FilterSection>
          <ResultsText>
            <HighlightedText>
              {t(($) => $.programs.resultsCount, {
                count: presenter.filteredProgramCount,
              })}
            </HighlightedText>{" "}
            {t(($) => $.programs.resultsHint)}
          </ResultsText>
          <FilterPanel presenter={presenter} />
        </FilterSection>

        <CategoriesList>
          {/* Array.from() because react doesn't like iterators as children */}
          {Array.from(presenter.programsByCategory.entries()).map(
            ([category, programs]) => (
              <CategorySection
                key={category}
                categoryName={category}
                programCount={programs.length}
                totalCount={presenter.totalProgramsByCategory.get(category)}
              >
                {programs.map((program) => (
                  <ProgramCard
                    key={`${program.programId}-${program.title}`}
                    program={program}
                    isStarred={presenter.starredProgramIds.has(
                      program.programId,
                    )}
                    onToggleStar={handleToggleStar}
                    onClick={setSelectedProgram}
                  />
                ))}
              </CategorySection>
            ),
          )}
        </CategoriesList>

        <ProgramDetailModal
          program={selectedProgram}
          isOpen={!!selectedProgram}
          onClose={() => setSelectedProgram(undefined)}
          isStarred={
            !!selectedProgram &&
            presenter.starredProgramIds.has(selectedProgram.programId)
          }
          onToggleStar={handleToggleStar}
        />
      </PageContainer>
    );
  },
);

function usePresenter() {
  const rootStore = useRootStore();
  return new UsCoProgramsPresenter(rootStore);
}

export const UsCoProgramsList = withPresenterManager({
  usePresenter,
  managerIsObserver: false,
  ManagedComponent,
  HydratorComponent: MainContentHydrator,
});
