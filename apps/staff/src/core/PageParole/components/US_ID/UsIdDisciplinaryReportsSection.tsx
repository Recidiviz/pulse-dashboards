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
import { useState } from "react";
import styled from "styled-components";

import {
  isParoleUnknownDate,
  PAROLE_UNKNOWN_TEXT,
  ParoleConductRecord,
} from "~datatypes";
import { palette } from "~design-system";

import { PaletteKey, WorkflowsBadgePill } from "../../../BadgePill/BadgePill";
import { conductClassificationPalette } from "../ConductRecordCard";
import {
  FactRow,
  FactRowStack,
  FactValue,
  MutedText,
  partitionConductHistoryByRecency,
  SectionStack,
  SubsectionCaption,
  SubsectionTitle,
  toSafeDate,
} from "../shared";
import { UsIdDisciplinaryReportModal } from "./UsIdDisciplinaryReportModal";

// Reports older than this are left out entirely; Idaho's design has no "see
// older" affordance, unlike Colorado's conduct history.
export const US_ID_DOR_VISIBLE_YEARS = 3;

const ReportCard = styled.button.attrs({ type: "button" })`
  cursor: pointer;
  text-align: left;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  background: ${palette.marble2};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  padding: ${rem(spacing.lg)};
  transition:
    background 0.1s ease,
    border-color 0.1s ease;

  &:hover,
  &:focus-visible {
    background: ${palette.marble1};
    border-color: ${palette.slate60};
  }
`;

const ReportHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
`;

/** How many lines of a narrative show before it clips. */
const NARRATIVE_PREVIEW_LINES = 3;

const Narrative = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${NARRATIVE_PREVIEW_LINES};
  overflow: hidden;
`;

const ReportFacts = styled(FactRow)`
  flex: 1;
`;

const ReportFact = styled(FactRowStack)`
  flex: 0 1 ${rem(220)};
`;

const formatMonthAndYear = (date: string): string =>
  toSafeDate(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

/**
 * US_ID's Disciplinary Offense Reports subsection. Each report is a card
 * headed by its date, offense and institution, with its severity class badged
 * on the right and the narrative below.
 *
 * @param conductHistory - Every disciplinary record on the resident.
 * @param conductClassificationColors - Badge palette per severity, from the
 *   tenant's config.
 */
export function UsIdDisciplinaryReportsSection({
  conductHistory,
  conductClassificationColors,
}: {
  conductHistory: Array<ParoleConductRecord>;
  conductClassificationColors: Record<string, PaletteKey>;
}) {
  const [selectedReport, setSelectedReport] = useState<
    ParoleConductRecord | undefined
  >(undefined);

  const { recentRecords } = partitionConductHistoryByRecency(
    conductHistory,
    US_ID_DOR_VISIBLE_YEARS,
  );

  return (
    <div>
      <SubsectionTitle>Disciplinary Offense Reports (DOR)</SubsectionTitle>
      <SubsectionCaption>
        {recentRecords.length === 0
          ? `No DORs in the last ${US_ID_DOR_VISIBLE_YEARS} years`
          : `Showing all DORs from the last ${US_ID_DOR_VISIBLE_YEARS} years`}
      </SubsectionCaption>
      {recentRecords.length > 0 && (
        <SectionStack>
          {recentRecords.map((record, idx) => (
            <ReportCard
              // eslint-disable-next-line react/no-array-index-key
              key={`${record.date}-${record.violation}-${idx}`}
              onClick={() => setSelectedReport(record)}
            >
              <ReportHeader>
                <ReportFacts>
                  <ReportFact>
                    <MutedText>Date</MutedText>
                    <FactValue>
                      {isParoleUnknownDate(record.date)
                        ? PAROLE_UNKNOWN_TEXT
                        : formatMonthAndYear(record.date)}
                    </FactValue>
                  </ReportFact>
                  <ReportFact>
                    <MutedText>Offense</MutedText>
                    <FactValue>{record.violation}</FactValue>
                  </ReportFact>
                  <ReportFact>
                    <MutedText>Institution</MutedText>
                    <FactValue>{record.facility}</FactValue>
                  </ReportFact>
                </ReportFacts>
                <WorkflowsBadgePill
                  text={record.severity}
                  palette={conductClassificationPalette(
                    conductClassificationColors,
                    record.severity,
                  )}
                />
              </ReportHeader>
              <Narrative>{record.description}</Narrative>
            </ReportCard>
          ))}
        </SectionStack>
      )}

      <UsIdDisciplinaryReportModal
        report={selectedReport}
        conductClassificationColors={conductClassificationColors}
        onRequestClose={() => setSelectedReport(undefined)}
      />
    </div>
  );
}
