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
import { rem } from "polished";
import { ReactNode } from "react";
import styled from "styled-components";

import { ParoleConductRecord } from "~datatypes";
import { Icon, IconSVG, palette } from "~design-system";

import { PaletteKey } from "../../BadgePill/BadgePill";
import { SectionCardHeader } from "../../SectionCard";
import { ConductRecordCard } from "./ConductRecordCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import {
  FactLabel,
  partitionConductHistoryByRecency,
  SectionCard,
  SectionStack,
} from "./shared";

const SummaryRow = styled.div`
  display: flex;
  gap: ${rem(spacing.lg)};
  color: ${palette.slate70};
`;

const NoInfractionsBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

const NoInfractionsHeading = styled.div`
  ${typography.Sans14}
  font-weight: 600;
  color: ${palette.pine1};
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

export function ConductHistorySection({
  conductHistory,
  conductClassificationColors,
  visibleYears,
  children,
}: {
  conductHistory: Array<ParoleConductRecord>;
  conductClassificationColors: Record<string, PaletteKey>;
  visibleYears: number;
  children?: ReactNode;
}) {
  if (conductHistory.length === 0) {
    return (
      <SectionCard>
        <SectionCardHeader>Institutional Conduct History</SectionCardHeader>
        <PaddedSectionCardBody>
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
        </PaddedSectionCardBody>
      </SectionCard>
    );
  }

  const severityCounts = countsBySeverity(conductHistory);
  const { recentRecords } = partitionConductHistoryByRecency(
    conductHistory,
    visibleYears,
  );

  return (
    <SectionCard>
      <SectionCardHeader>Institutional Conduct History</SectionCardHeader>
      <PaddedSectionCardBody>
        <SectionStack>
          <SummaryRow>
            <span>
              Total Violations:{" "}
              <FactLabel as="span">{conductHistory.length}</FactLabel>
            </span>
            {severityCounts.map(([severity, count]) => (
              <span key={severity}>
                {severity}: <FactLabel as="span">{count}</FactLabel>
              </span>
            ))}
          </SummaryRow>
          {recentRecords.map((record, _) => (
            <ConductRecordCard
              key={`${record.date}-${record.violation}-${record.facility}-${record.severity}`}
              record={record}
              conductClassificationColors={conductClassificationColors}
            />
          ))}
          {children}
        </SectionStack>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
