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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { ReactNode } from "react";
import styled from "styled-components";

import { ParoleConductRecord } from "~datatypes";
import { Icon, IconSVG, palette } from "~design-system";

import { PaletteKey } from "../../../BadgePill/BadgePill";
import {
  conductClassificationPalette,
  conductClassificationTextColor,
  ConductRecordCard,
} from "../ConductRecordCard";
import {
  ParoleSectionCard,
  ParoleSectionTitle,
  ParoleSmallFactValue,
  ParoleSubsectionCaption,
} from "../ParoleCaseProfileStyles";
import { partitionConductHistoryByRecency, SectionStack } from "../shared";

const SummaryRow = styled(ParoleSubsectionCaption)`
  display: flex;
  gap: ${rem(spacing.lg)};
`;

// The per-record pills are already colored by classification; without this the
// summary counts are the only place the three classes look identical.
const SeverityCount = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
`;

const NoInfractionsBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

const NoInfractionsHeading = styled(ParoleSmallFactValue)`
  font-weight: 600;
`;

function countsBySeverity(
  conductHistory: Array<ParoleConductRecord>,
): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const record of conductHistory) {
    counts.set(record.severity, (counts.get(record.severity) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function UsCoConductHistorySection({
  conductHistory,
  conductClassificationColors,
  visibleYears,
  title,
  children,
}: {
  conductHistory: Array<ParoleConductRecord>;
  conductClassificationColors: Record<string, PaletteKey>;
  visibleYears: number;
  title: string;
  children?: ReactNode;
}) {
  if (conductHistory.length === 0) {
    return (
      <ParoleSectionCard>
        <ParoleSectionTitle>{title}</ParoleSectionTitle>
        <SectionStack>
          <NoInfractionsBanner>
            <Icon
              kind={IconSVG.Success}
              width={20}
              color={palette.signal.highlight}
              aria-hidden="true"
            />
            <NoInfractionsHeading>
              No Disciplinary Infractions
            </NoInfractionsHeading>
          </NoInfractionsBanner>
          {children}
        </SectionStack>
      </ParoleSectionCard>
    );
  }

  const severityCounts = countsBySeverity(conductHistory);
  const { recentRecords } = partitionConductHistoryByRecency(
    conductHistory,
    visibleYears,
  );

  return (
    <ParoleSectionCard>
      <ParoleSectionTitle>{title}</ParoleSectionTitle>
      <SectionStack>
        <SummaryRow>
          <span>
            Total Violations:{" "}
            <ParoleSmallFactValue as="span">
              {conductHistory.length}
            </ParoleSmallFactValue>
          </span>
          {severityCounts.map(([severity, count]) => (
            <SeverityCount
              key={severity}
              $color={conductClassificationTextColor(
                conductClassificationPalette(
                  conductClassificationColors,
                  severity,
                ),
              )}
            >
              {severity}:{" "}
              <ParoleSmallFactValue as="span">{count}</ParoleSmallFactValue>
            </SeverityCount>
          ))}
        </SummaryRow>
        {recentRecords.map((record) => (
          <ConductRecordCard
            key={`${record.date}-${record.violation}-${record.facility}-${record.severity}`}
            record={record}
            conductClassificationColors={conductClassificationColors}
          />
        ))}
        {children}
      </SectionStack>
    </ParoleSectionCard>
  );
}
