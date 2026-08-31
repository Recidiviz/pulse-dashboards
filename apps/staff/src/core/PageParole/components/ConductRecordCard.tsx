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
import styled from "styled-components";

import { ParoleConductRecord } from "~datatypes";
import { palette } from "~design-system";

import { PaletteKey, WorkflowsBadgePill } from "../../BadgePill/BadgePill";
import { FactLabel, formatDate } from "./shared";

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

// Shared between ConductHistorySection's own (recent) records and any
// tenant-specific older-records slot (e.g. US_CO's "See Older
// Disciplinaries" toggle), so a disciplinary record renders identically
// wherever it's shown.
//
// Kept in its own file rather than shared.tsx: tenant-config-owned
// components import this, which puts whatever module holds it on the tenant
// config's import path. shared.tsx is deliberately kept small for that
// reason -- see the note in SectionAnchor.tsx for the import cycle that path
// can close.
export function ConductRecordCard({
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
