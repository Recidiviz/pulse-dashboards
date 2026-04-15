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
import { ColumnDef } from "@tanstack/react-table";
import { rem } from "polished";
import styled from "styled-components";

import { Icon, IconSVG, palette } from "~design-system";

import { downloadTableCSV } from "../../utils/downloads/tableToCSV";

const Button = styled.button`
  ${typography.Sans14};
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  color: ${palette.slate85};
  background: none;
  border: none;
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: ${palette.slate};
  }
`;

type DownloadTableButtonProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  fileName: string;
};

export function DownloadTableButton<TData>({
  data,
  columns,
  fileName,
}: DownloadTableButtonProps<TData>) {
  return (
    <Button onClick={() => downloadTableCSV(data, columns, fileName)}>
      <Icon kind={IconSVG.Download} size={16} />
      Download
    </Button>
  );
}

type DownloadCaseloadButtonProps = {
  onDownload: () => void;
};

export function DownloadCaseloadButton({
  onDownload,
}: DownloadCaseloadButtonProps) {
  return (
    <Button onClick={onDownload}>
      <Icon kind={IconSVG.Download} size={16} />
      Download
    </Button>
  );
}
