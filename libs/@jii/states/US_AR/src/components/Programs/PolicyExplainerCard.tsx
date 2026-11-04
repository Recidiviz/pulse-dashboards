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

import { FC } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components";

import { Card, SlateCopy } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsArTranslations } from "~@jii/translation";

const TightSlateCopy = styled(SlateCopy)`
  margin-bottom: 0;

  p {
    margin-bottom: 0;
  }
`;

export const PolicyExplainerCard: FC = () => {
  const { t } = useUsArTranslations();
  const params = useTypedParams(State.Resident.UsArMoreInformation);

  const policyUrl =
    State.Resident.UsArMoreInformation.EarnedReleaseCredits.buildPath(params);
  const coursesUrl = policyUrl + "#courses";
  const resourcesUrl = policyUrl + "#resources";

  return (
    <Card>
      <TightSlateCopy options={{ forceBlock: true }}>
        {t(($) => $.programs.onMyTablet.progressExplainer, {
          coursesUrl,
          resourcesUrl,
        })}
      </TightSlateCopy>
    </Card>
  );
};
