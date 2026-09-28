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
import Skeleton from "react-loading-skeleton";
import styled from "styled-components";

import { Card, CardHeading, CardValue } from "~@jii/common-ui";
import { useUsAzTranslations } from "~@jii/translation";
import { palette, spacing } from "~design-system";

import { useUsAzSingleResidentContext } from "../../UsAzSingleResidentContext/UsAzSingleResidentContext";

const ValuesGrid = styled.div`
  display: grid;
  // keeps columns equal width
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: auto auto;
  grid-auto-flow: column;
  column-gap: ${rem(spacing.xxl)};
  row-gap: ${rem(spacing.lg)};
  column-rule: 1px solid ${palette.slate10};
`;

const Cell = ({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) => {
  return (
    <div>
      <CardHeading>{label}</CardHeading>
      <CardValue>{value === undefined ? <Skeleton /> : value}</CardValue>
    </div>
  );
};

export const ValuesCard = () => {
  const {
    metadata: {
      cuAssessmentScore,
      cuAssignedCustodyLevel,
      cuAssignedCustodyLevelNumeric,
      irAssessmentScore,
      irAssignedRiskLevelNumeric,
    },
  } = useUsAzSingleResidentContext();
  const { t } = useUsAzTranslations();

  let custodyLevelValue;
  // don't make a composite string if values are missing (in practice they should always be present or missing together)
  if (cuAssignedCustodyLevel && cuAssignedCustodyLevelNumeric) {
    custodyLevelValue = `${cuAssignedCustodyLevel}-${cuAssignedCustodyLevelNumeric}`;
  }
  const { cuLevel, cuPoints, irLevel, irPoints } = t(
    ($) => $.classificationPoints.page.values,
    { returnObjects: true },
  );

  return (
    <Card>
      <ValuesGrid>
        <Cell label={cuLevel} value={custodyLevelValue} />
        <Cell label={cuPoints} value={cuAssessmentScore} />
        <Cell label={irLevel} value={irAssignedRiskLevelNumeric} />
        <Cell label={irPoints} value={irAssessmentScore} />
      </ValuesGrid>
    </Card>
  );
};
