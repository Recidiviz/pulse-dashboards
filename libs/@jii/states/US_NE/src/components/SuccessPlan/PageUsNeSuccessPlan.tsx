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

import { rem } from "polished";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components";

import { BackLink, CopyWrapper } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { State } from "~@jii/paths";
import { useCommonTranslations, useUsNeTranslations } from "~@jii/translation";
import { spacing, typography } from "~design-system";

import { UsNeTraitList } from "./UsNeTraitList";

const SuccessPlanPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(64)};
`;

const PageHeading = styled.h1`
  ${typography.Serif34}
  margin-top: -${rem(spacing.md)};
  margin-bottom: ${rem(spacing.md)};
`;

export const UsNeSuccessPlanPage = () => {
  const { successPlan } = useResidentMetadata("US_NE");
  const pathParams = useTypedParams(State.Resident);
  const commonT = useCommonTranslations().t;
  const { t } = useUsNeTranslations();

  if (!successPlan) {
    return null;
  }

  const { title, description } = t(($) => $.successPlan.header, {
    returnObjects: true,
  });

  return (
    <SuccessPlanPageContainer>
      <header>
        <BackLink to={State.Resident.buildPath(pathParams)}>
          {commonT(($) => $.backLinks.home)}
        </BackLink>
        <PageHeading>{title}</PageHeading>
        <CopyWrapper>{description}</CopyWrapper>
      </header>
      <UsNeTraitList kind={"strengths"} traits={successPlan.strengths} />
      <UsNeTraitList kind={"skills"} traits={successPlan.skills} />
    </SuccessPlanPageContainer>
  );
};
