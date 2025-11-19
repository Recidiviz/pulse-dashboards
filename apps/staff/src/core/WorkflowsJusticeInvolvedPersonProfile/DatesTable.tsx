// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Sans14 } from "@recidiviz/design-system";
import styled from "styled-components";

import { palette } from "~design-system";

import {
  formatDueDateFromToday,
  formatWorkflowsDate,
} from "../../utils/formatStrings";
import { InfoButton } from "./InfoButton";
import {
  ShadedSidebarTableCell,
  SidebarTable,
  SidebarTableCell,
  SidebarTableRow,
} from "./styles";
import { InfoTooltipWrapper } from "./styles";

const DateExplainer = styled(Sans14)<{ $datePast: boolean }>`
  display: inline;
  color: ${(props) =>
    props.$datePast ? palette.signal.error : palette.slate60};
`;

export type DateInfo = {
  label: string;
  date?: Date;
  tooltip?: string;
  highlight?: boolean;
};

export function DatesTable({
  dates,
  highlightPastDates,
}: {
  dates: DateInfo[];
  highlightPastDates: boolean;
}) {
  const today = new Date();
  return (
    <SidebarTable>
      <tbody>
        {dates.map(({ label, date, tooltip, highlight }) => (
          <SidebarTableRow key={label} $wideLeftColumn={false}>
            <ShadedSidebarTableCell $highlight={highlight}>
              {label}
              {tooltip && (
                <>
                  {" "}
                  <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                    <InfoButton infoUrl={undefined} />
                  </InfoTooltipWrapper>
                </>
              )}
            </ShadedSidebarTableCell>
            <SidebarTableCell>
              {formatWorkflowsDate(date)}
              {date && (
                <>
                  {" "}
                  <DateExplainer
                    $datePast={highlightPastDates && new Date(date) < today}
                  >
                    {`(${formatDueDateFromToday(new Date(date))})`}
                  </DateExplainer>
                </>
              )}
            </SidebarTableCell>
          </SidebarTableRow>
        ))}
      </tbody>
    </SidebarTable>
  );
}
