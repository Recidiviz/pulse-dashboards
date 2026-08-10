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
import { subYears } from "date-fns";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { ParoleConductRecord } from "~datatypes";
import { Icon, IconSVG, palette } from "~design-system";

import { PaletteKey, WorkflowsBadgePill } from "../../BadgePill/BadgePill";
import { SectionCardHeader } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import {
  FactLabel,
  formatDate,
  parseIsoDate,
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

const RecordCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  background: ${palette.marble2};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(6)};
  padding: ${rem(spacing.md)};
`;

const RecordHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RecordTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  font-weight: 600;
  color: ${palette.pine1};
`;

const RecordDate = styled.span`
  color: ${palette.slate70};
`;

// WorkflowsBadgePill doesn't expose a className, so this can't restyle it
// directly -- text-transform is inherited, so wrapping it is enough to force
// its label uppercase without touching the shared component.
const UppercaseBadgeWrapper = styled.span`
  text-transform: uppercase;
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  background: none;
  border: none;
  padding: 0;
  color: ${palette.slate70};
  font-weight: 600;
  cursor: pointer;

  svg {
    transition: transform 150ms;
  }

  &[aria-expanded="true"] svg {
    transform: rotate(180deg);
  }
`;

function isWithinPastYear(dateString: string): boolean {
  return parseIsoDate(dateString) >= subYears(new Date(), 1);
}

function countsBySeverity(
  conductHistory: Array<ParoleConductRecord>,
): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const record of conductHistory) {
    counts.set(record.severity, (counts.get(record.severity) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function ConductTag({
  record,
  conductClassificationColors,
}: {
  record: ParoleConductRecord;
  conductClassificationColors: Record<string, PaletteKey>;
}) {
  const color = conductClassificationColors[record.severity] ?? "SLATE_DARK";

  return (
    <UppercaseBadgeWrapper>
      <WorkflowsBadgePill text={record.severity} palette={color} />
    </UppercaseBadgeWrapper>
  );
}

function ConductRecordCard({
  record,
  conductClassificationColors,
}: {
  record: ParoleConductRecord;
  conductClassificationColors: Record<string, PaletteKey>;
}) {
  return (
    <RecordCard>
      <RecordHeader>
        <RecordTitle>
          <ConductTag
            record={record}
            conductClassificationColors={conductClassificationColors}
          />
          {record.violation}
        </RecordTitle>
        <RecordDate>{formatDate(record.date)}</RecordDate>
      </RecordHeader>
      <div>
        Facility: <FactLabel as="span">{record.facility}</FactLabel>
      </div>
      <div>
        Description: <FactLabel as="span">{record.description}</FactLabel>
      </div>
      <div>
        Disposition: <FactLabel as="span">{record.disposition}</FactLabel>
      </div>
    </RecordCard>
  );
}

export function ConductHistorySection({
  conductHistory,
  conductClassificationColors,
}: {
  conductHistory: Array<ParoleConductRecord>;
  conductClassificationColors: Record<string, PaletteKey>;
}) {
  const [showOlder, setShowOlder] = useState(false);

  if (conductHistory.length === 0) {
    return (
      <SectionCard>
        <SectionCardHeader>Institutional Conduct History</SectionCardHeader>
        <PaddedSectionCardBody>
          <NoInfractionsBanner>
            <Icon
              kind={IconSVG.Success}
              width={20}
              color={palette.signal.highlight}
            />
            <NoInfractionsHeading>
              No Disciplinary Infractions
            </NoInfractionsHeading>
          </NoInfractionsBanner>
        </PaddedSectionCardBody>
      </SectionCard>
    );
  }

  const severityCounts = countsBySeverity(conductHistory);

  const sortedConductHistory = [...conductHistory].sort(
    (a, b) => parseIsoDate(b.date).getTime() - parseIsoDate(a.date).getTime(),
  );
  const recentRecords = sortedConductHistory.filter((record) =>
    isWithinPastYear(record.date),
  );
  const olderRecords = sortedConductHistory.filter(
    (record) => !isWithinPastYear(record.date),
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
          {recentRecords.map((record, idx) => (
            <ConductRecordCard
              // eslint-disable-next-line react/no-array-index-key
              key={`${record.date}-${record.violation}-${idx}`}
              record={record}
              conductClassificationColors={conductClassificationColors}
            />
          ))}
          {olderRecords.length > 0 && (
            <>
              <ToggleButton
                type="button"
                aria-expanded={showOlder}
                onClick={() => setShowOlder((prev) => !prev)}
              >
                <Icon kind={IconSVG.Caret} width={10} />
                See Older Disciplinaries ({olderRecords.length})
              </ToggleButton>
              {showOlder &&
                olderRecords.map((record, idx) => (
                  <ConductRecordCard
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${record.date}-${record.violation}-${idx}`}
                    record={record}
                    conductClassificationColors={conductClassificationColors}
                  />
                ))}
            </>
          )}
        </SectionStack>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
