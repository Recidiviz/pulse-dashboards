// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { IncarcerationOpportunityId } from "../../configs/types";
import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { useRootStore } from "../StoreProvider/useRootStore";
import { AboutSection } from "./AboutSection";
import { ButtonLink } from "./ButtonLink";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";
import { RequirementsSection } from "./RequirementsSection";
import { Section, SectionHeading } from "./styles";

const Header = styled.header`
  margin: ${rem(spacing.xl)} 0;
`;

const Headline = styled.h1`
  ${typography.Sans24}

  color: ${palette.pine2};
  font-size: ${rem(34)};
  margin-bottom: ${rem(spacing.lg)};
`;

const Subheading = styled.h2`
  ${typography.Sans18}

  color: ${palette.slate85};
`;

const OpportunityEligibilityWithPresenter: FC<{
  presenter: OpportunityEligibilityPresenter;
}> = observer(function OpportunityEligibilityWithPresenter({ presenter }) {
  return (
    <article>
      <Header>
        <Headline>{presenter.headline}</Headline>
        {presenter.subheading && (
          <Subheading>{presenter.subheading}</Subheading>
        )}
      </Header>

      <AboutSection presenter={presenter} />

      <RequirementsSection presenter={presenter} />

      {presenter.nextStepsContent && (
        <Section>
          <SectionHeading>Next steps</SectionHeading>
          <CopyWrapper>{presenter.nextStepsContent.body}</CopyWrapper>
          <ButtonLink to={presenter.nextStepsContent.linkUrl}>
            {presenter.nextStepsContent.linkText}
          </ButtonLink>
        </Section>
      )}
    </article>
  );
});

export const OpportunityEligibility: FC<{
  opportunityId: IncarcerationOpportunityId;
  residentExternalId: string;
}> = observer(function OpportunityEligibility({
  opportunityId,
  residentExternalId,
}) {
  const { residentsStore } = useRootStore();
  if (!residentsStore) return null;

  const config =
    residentsStore.config.incarcerationOpportunities[opportunityId];
  if (!config) {
    throw new Error(`Missing configuration for ${opportunityId}`);
  }

  const presenter = new OpportunityEligibilityPresenter(
    residentsStore,
    residentExternalId,
    opportunityId,
    config,
  );
  return (
    <PageHydrator hydratable={presenter}>
      <OpportunityEligibilityWithPresenter presenter={presenter} />
    </PageHydrator>
  );
});
