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

import { View } from "react-native";

import { Typography } from "../shared/ui/Typography";

export const TABLE_HEAD_CELL_HEIGHT = 44;
export const TABLE_CELL_HEIGHT = 72;

type Props = {
  children?: React.ReactNode;
};

export const Table = ({
  children,
  className = "",
  ...props
}: Props & React.TableHTMLAttributes<HTMLTableElement>) => {
  return (
    <table
      {...props}
      className={`w-full border-separate border-spacing-0 overflow-hidden rounded-[20px] border border-gray/15 ${className}`}
    >
      {children}
    </table>
  );
};

export const TableHead = ({
  children,
  className = "",
  ...props
}: Props & React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <thead {...props} className={`bg-[#3553620A] ${className}`}>
      {children}
    </thead>
  );
};

export const TableHeadRow = ({
  children,
  className = "",
  ...props
}: Props & React.HTMLAttributes<HTMLTableRowElement>) => {
  return (
    <tr {...props} className={className}>
      {children}
    </tr>
  );
};

export const TableHeadCell = ({
  children,
  className = "",
  ...props
}: Props & React.ThHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <th
      {...props}
      className={`px-1 first:pl-7 last:pr-7 ${className}`}
      style={{ height: TABLE_HEAD_CELL_HEIGHT }}
    >
      <Typography className="inline-block w-full py-3 text-left text-sm font-medium text-gray/85">
        {children}
      </Typography>
    </th>
  );
};

export const TableBody = ({
  children,
  className = "",
  ...props
}: Props & React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <tbody {...props} className={`bg-white ${className}`}>
      {children}
    </tbody>
  );
};

export const TableRow = ({
  children,
  className = "",
  ...props
}: Props & React.HTMLAttributes<HTMLTableRowElement>) => {
  return (
    <tr
      {...props}
      className={`group hover:cursor-pointer [&:first-child>td>div]:border-none [&:first-child>td]:border-none [&:hover+tr>td>div]:border-transparent [&:hover+tr>td]:border-transparent ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableCell = ({
  children,
  className = "",
  ...props
}: Props & React.TdHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td
      {...props}
      className={`p-0 [&:first-child>div>div]:pl-4 [&:last-child>div>div]:pr-4 ${className}`}
      style={{ height: TABLE_CELL_HEIGHT }}
    >
      <View className="h-full justify-center border-t border-gray/15 p-0 group-hover:border-transparent">
        <View className="h-full justify-center px-1 group-hover:bg-[#3553620A]">
          {typeof children === "string" ? (
            <Typography className="text-base text-gray/85">
              {children}
            </Typography>
          ) : (
            children
          )}
        </View>
      </View>
    </td>
  );
};

export const TableFooter = ({
  children,
  className = "",
  ...props
}: Props & React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <tfoot {...props} className={className}>
      {children}
    </tfoot>
  );
};

export const TableFooterRow = ({
  children,
  className = "",
  ...props
}: Props & React.HTMLAttributes<HTMLTableRowElement>) => {
  return (
    <tr {...props} className={className}>
      {children}
    </tr>
  );
};

export const TableFooterCell = ({
  children,
  className = "",
  ...props
}: Props & React.TdHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td {...props} className={`bg-white ${className}`}>
      {children}
    </td>
  );
};
