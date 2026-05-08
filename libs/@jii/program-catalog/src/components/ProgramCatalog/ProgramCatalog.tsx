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
import { FC } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import {
  BackLink,
  ButtonLink,
  CopyWrapper,
  HomepageSectionHeading,
  PageContainer,
} from "~@jii/common-ui";
import { useRootStore, useSingleResidentContext } from "~@jii/data";
import {
  LastUpdatedBanner,
  MainContentHydratorWithErrorLogging,
} from "~@jii/layout";
import { Icon, palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { ProgramCatalogPresenter } from "../../presenter/ProgramCatalogPresenter";
import type { Program } from "../../types";
import { ProgramCatalogProps } from "../../types";
import { CategorySection } from "../CategorySection/CategorySection";
import { FilterSection } from "../FilterSection/FilterSection";
import { ProgramCard } from "../ProgramCard/ProgramCard";
import { ProgramDetailModal } from "../ProgramDetailModal/ProgramDetailModal";

const Header = styled.header`
  margin-top: ${rem(spacing.lg)};
  margin-bottom: ${rem(spacing.lg)};
`;

const Description = styled(CopyWrapper)`
  ${typography.Sans14};
  color: ${palette.slate85};
  margin: 0 0 ${rem(spacing.md)} 0;
  line-height: 1.4;
`;

const CategoriesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(36)};
  padding-bottom: ${rem(spacing.lg)};
`;

const ManagedComponent: FC<{ presenter: ProgramCatalogPresenter }> = observer(
  function ProgramCatalogManaged({ presenter }) {
    const { t } = useTranslation([presenter.config.stateCode, "common"]);

    const { showCredits, learnMoreHref, backHref } = presenter.config;

    const handleToggleStar = (program: Program) => {
      presenter.toggleStarred(program);
    };

    return (
      <PageContainer>
        <LastUpdatedBanner
          overrideCopy={t(($) => $.programs.lastUpdated, {
            date: presenter.lastUpdatedDate,
          })}
        />

        <Header>
          {backHref && (
            <BackLink to={backHref}>{t(($) => $.programs.backLink)}</BackLink>
          )}
          <HomepageSectionHeading>
            {t(($) => $.programs.pageTitle)}
          </HomepageSectionHeading>
          <Description options={{ forceBlock: true }}>
            {t(($) => $.programs.pageDescription)}
          </Description>
          <ButtonLink to={learnMoreHref}>
            {t(($) => $.programs.learnMoreLink)}
            <Icon kind="Arrow" size={12} />
          </ButtonLink>
        </Header>

        <FilterSection presenter={presenter} showCredits={showCredits} t={t} />

        <CategoriesList>
          {presenter.categories.map(({ name, programs }) => (
            <CategorySection
              key={name}
              categoryName={name}
              programCount={programs.length}
              totalCount={presenter.totalProgramsByCategory.get(name)}
              t={t}
            >
              {programs.map((program) => (
                <ProgramCard
                  key={`${program.programId}-${program.title}`}
                  program={program}
                  onToggleStar={handleToggleStar}
                  onClick={presenter.setSelectedProgram}
                  showCredits={showCredits}
                  t={t}
                />
              ))}
            </CategorySection>
          ))}
        </CategoriesList>

        <ProgramDetailModal
          program={presenter.selectedProgram}
          isOpen={!!presenter.selectedProgram}
          onClose={() => presenter.setSelectedProgram(undefined)}
          onToggleStar={handleToggleStar}
          showCredits={showCredits}
          t={t}
        />
      </PageContainer>
    );
  },
);

function usePresenter(props: ProgramCatalogProps): ProgramCatalogPresenter {
  const rootStore = useRootStore();
  const { resident } = useSingleResidentContext();
  return new ProgramCatalogPresenter(resident, rootStore.apiClient, props);
}

export const ProgramCatalog = withPresenterManager({
  usePresenter,
  managerIsObserver: false,
  ManagedComponent,
  HydratorComponent: MainContentHydratorWithErrorLogging,
});
