// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardWrapper,
} from "../OutliersSupervisorPage/OutliersStaffCard";
import OutliersLegend, { defaultLegendItems } from "./OutliersLegend";

const LegendNote = styled.div`
  max-width: ${rem(400)};
`;

type OutliersStaffLegendType = {
  note?: string;
};

const OutliersStaffLegend: React.FC<OutliersStaffLegendType> = ({ note }) => {
  const { isLaptop } = useIsMobile(true);

  return (
    <CardWrapper noFlex isSticky={!isLaptop}>
      <CardHeader hasBorder={false}>
        <CardTitle>Legend</CardTitle>
        <CardContent noFlex={!note}>
          <OutliersLegend items={defaultLegendItems} />
          {note && <LegendNote>Note: {note}</LegendNote>}
        </CardContent>
      </CardHeader>
    </CardWrapper>
  );
};

export default OutliersStaffLegend;
