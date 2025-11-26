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

import { Text, View } from "react-native";

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
      className={`w-full border-separate border-spacing-0 overflow-hidden rounded-[20px] border border-[#35536226] ${className}`}
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
      className={`border-b-2 border-white px-1 first:pl-7 last:pr-7 ${className}`}
    >
      <Text className="inline-block w-full py-3 text-left font-inter text-sm font-medium text-[#355362D9]">
        {children}
      </Text>
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
      className={`group [&:first-child>td>div]:border-none [&:first-child>td]:border-none [&:hover+tr>td>div]:border-transparent [&:hover+tr>td]:border-transparent [&:last-child>td]:border-b-2 [&:last-child>td]:border-transparent ${className}`}
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
      className={`h-[72px] p-0 [&:first-child>div>div]:rounded-l-[20px] [&:first-child>div>div]:pl-4 [&:first-child>div]:ml-3 [&:last-child>div>div]:rounded-r-[20px] [&:last-child>div>div]:pr-4 [&:last-child>div]:mr-3 ${className}`}
    >
      <View className="h-full justify-center border-t border-[#35536226] p-0 group-hover:border-transparent">
        <View className=" h-full justify-center px-1 group-hover:bg-[#3553620A]">
          {typeof children === "string" ? (
            <Text className="font-inter text-base text-[#355362D9]">
              {children}
            </Text>
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
    <td
      {...props}
      className={`border-t border-[#35536226] bg-white ${className}`}
    >
      {children}
    </td>
  );
};
