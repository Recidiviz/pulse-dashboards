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

import { typography } from "@recidiviz/design-system";
import { useState } from "react";
import styled from "styled-components";

import {
  isParoleUnknownDate,
  PAROLE_UNKNOWN_TEXT,
  ParoleConductRecord,
} from "~datatypes";
import { palette } from "~design-system";

import { PaletteKey } from "../../../BadgePill/BadgePill";
import { conductClassificationPalette } from "../ConductRecordCard";
import {
  paroleClickableRecordStyles,
  ParoleSubsection,
  ParoleSubsectionCaption,
  ParoleSubsectionHeading,
  ParoleSubsectionTitle,
} from "../ParoleCaseProfileStyles";
import {
  ParoleDisciplinaryRecordHeader,
  paroleDisciplinaryRecordStyles,
} from "../ParoleDisciplinaryRecord";
import {
  partitionConductHistoryByRecency,
  SectionStack,
  toSafeDate,
} from "../shared";
import {
  dorSeverityLabel,
  UsIdDisciplinaryReportModal,
} from "./UsIdDisciplinaryReportModal";

// Reports older than this are left out entirely; Idaho's design has no "see
// older" affordance, unlike Colorado's conduct history.
export const US_ID_DOR_VISIBLE_YEARS = 3;

const ReportCard = styled.button.attrs({ type: "button" })`
  ${paroleDisciplinaryRecordStyles}
  ${paroleClickableRecordStyles}
`;

/** How many lines of a narrative show before it clips. */
const NARRATIVE_PREVIEW_LINES = 3;

const Narrative = styled.div`
  ${typography.Sans14}
  line-height: 1.6;
  color: ${palette.pine1};
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${NARRATIVE_PREVIEW_LINES};
  overflow: hidden;
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
    <ParoleSubsection>
      <ParoleSubsectionHeading>
        <ParoleSubsectionTitle>
          Disciplinary Offense Reports (DOR)
        </ParoleSubsectionTitle>
        <ParoleSubsectionCaption>
          {recentRecords.length === 0
            ? `No DORs in the last ${US_ID_DOR_VISIBLE_YEARS} years`
            : `Showing all DORs from the last ${US_ID_DOR_VISIBLE_YEARS} years`}
        </ParoleSubsectionCaption>
      </ParoleSubsectionHeading>
      {recentRecords.length > 0 && (
        <SectionStack>
          {recentRecords.map((record, idx) => (
            <ReportCard
              // eslint-disable-next-line react/no-array-index-key
              key={`${record.date}-${record.violation}-${idx}`}
              onClick={() => setSelectedReport(record)}
            >
              <ParoleDisciplinaryRecordHeader
                facts={[
                  {
                    label: "Date",
                    value: isParoleUnknownDate(record.date)
                      ? PAROLE_UNKNOWN_TEXT
                      : formatMonthAndYear(record.date),
                  },
                  { label: "Offense", value: record.violation },
                  { label: "Institution", value: record.facility },
                ]}
                shouldKeepFactsOnOneLine={false}
                badgeText={dorSeverityLabel(record)}
                badgePalette={conductClassificationPalette(
                  conductClassificationColors,
                  record.severity,
                )}
              />
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
    </ParoleSubsection>
  );
}
