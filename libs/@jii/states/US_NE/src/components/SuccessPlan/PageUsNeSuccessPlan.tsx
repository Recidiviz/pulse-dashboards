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

import { BackLink } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { State } from "~@jii/paths";
import { useCommonTranslations } from "~@jii/translation";

import { UsNeTraitList } from "./UsNeTraitList";

const SuccessPlanPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(64)};
`;

export const UsNeSuccessPlanPage = () => {
  const { successPlan } = useResidentMetadata("US_NE");
  const pathParams = useTypedParams(State.Resident);
  const { t } = useCommonTranslations();

  if (!successPlan) {
    return null;
  }

  return (
    <SuccessPlanPageContainer>
      <BackLink to={State.Resident.buildPath(pathParams)}>
        {t(($) => $.backLinks.home)}
      </BackLink>
      <UsNeTraitList kind={"strengths"} traits={successPlan.strengths} />
      <UsNeTraitList kind={"skills"} traits={successPlan.skills} />
    </SuccessPlanPageContainer>
  );
};
