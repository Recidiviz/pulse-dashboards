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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

type TableColumnDescription<ColumnKeys extends string> = {
  key: ColumnKeys;
  label: string;
};

type OpenTableProps<ColumnKeys extends string> = {
  columns: readonly TableColumnDescription<ColumnKeys>[];
  data: Record<ColumnKeys, React.ReactNode>[];
  footer?: Partial<Record<ColumnKeys, React.ReactNode>>;
};

const Table = styled.table`
  border-collapse: collapse;
  table-layout: fixed;

  margin: 0 auto;
  width: 100%;

  tr {
    border-top: 1px solid ${palette.slate20};
  }

  th,
  td {
    padding: ${rem(spacing.md)} 0;
    text-align: left;
  }

  thead,
  tfoot {
    font-weight: 700;
  }
`;

export function OpenTable<ColumnKeys extends string>({
  columns,
  data,
  footer,
}: OpenTableProps<ColumnKeys>) {
  return (
    <Table>
      <thead>
        <tr>
          {Object.values<TableColumnDescription<ColumnKeys>>(columns).map(
            ({ key, label }) => (
              <th key={key} scope="col">
                {label}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={index}>
              {columns.map(({ key }) => (
                <td key={key}>{row[key]}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
      {footer && (
        <tfoot>
          <tr>
            <th scope="row">{footer[columns[0].key]}</th>
            {columns.slice(1).map(({ key }) => (
              <td key={key}>{footer[key]}</td>
            ))}
          </tr>
        </tfoot>
      )}
    </Table>
  );
}
