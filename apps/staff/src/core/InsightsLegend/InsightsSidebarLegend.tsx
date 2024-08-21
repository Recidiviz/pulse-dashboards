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

import { palette } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardWrapper,
} from "../InsightsSupervisorPage/InsightsStaffCard";
import InsightsLegend from "./InsightsLegend";

const LegendNote = styled.div`
  max-width: ${rem(400)};
`;

const MethodologyLinkContainer = styled.div`
  flex-basis: 100%;

  a {
    color: ${palette.signal.links} !important;
    border-bottom: 1px solid transparent;
    &:hover {
      border-bottom: 1px solid ${palette.signal.links};
    }
  }
`;

type InsightsSidebarLegendType = {
  outcomeType: "FAVORABLE" | "ADVERSE";
  note?: string;
};

const InsightsSidebarLegend: React.FC<InsightsSidebarLegendType> = ({
  outcomeType,
  note,
}) => {
  const { isLaptop } = useIsMobile(true);

  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  const methodologyUrl = supervisionStore?.methodologyUrl;

  return (
    <CardWrapper noFlex isSticky={!isLaptop}>
      <CardHeader hasBorder={false}>
        <CardTitle>Legend</CardTitle>
        <CardContent noFlex={!note && !methodologyUrl}>
          <InsightsLegend outcomeType={outcomeType} />
          {note && <LegendNote>Note: {note}</LegendNote>}
          {methodologyUrl && (
            <MethodologyLinkContainer>
              <a
                href={methodologyUrl}
                target="_blank"
                rel="noreferrer noopener"
                data-intercom-target="Methodology Link"
              >
                Methodology
              </a>
            </MethodologyLinkContainer>
          )}
        </CardContent>
      </CardHeader>
    </CardWrapper>
  );
};

export default InsightsSidebarLegend;
