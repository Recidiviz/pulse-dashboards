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
import styled from "styled-components";

import { palette } from "~design-system";

import { formatDocId } from "../../../ParoleStore/utils";

// Marks the header so the PDF generator can find and reveal it inside the
// html2canvas clone.
export const REPORT_HEADER_ATTRIBUTE = "data-report-header";

// Hidden in the app; revealed only inside the PDF capture (see
// downloadParoleReport's html2canvas onclone hook), so the name/DOC id appear
// on the downloaded report but not on screen.
const Header = styled.div`
  display: none;
  align-items: baseline;
  gap: 0.5rem;
`;

const Name = styled.div`
  ${typography.Serif24}
  color: ${palette.pine2};
`;

const DocId = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
`;

/**
 * Identifying header for the case-profile report, naming the person and DOC id.
 * Rendered at the top of the captured report content so a downloaded copy
 * stands on its own.
 */
export function ReportHeader({ name, docId }: { name: string; docId: string }) {
  return (
    <Header {...{ [REPORT_HEADER_ATTRIBUTE]: "" }}>
      <Name>{name}</Name>
      <DocId>{formatDocId(docId)}</DocId>
    </Header>
  );
}
