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

import { ScrollView, View } from "react-native";

import { StatusBadge } from "~@meetings/app/admin/ui/StatusBadge";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import {
  COMBINE_NOTE,
  type RatingCell,
  type RatingsTable,
} from "../lib/ratings";

const DIMENSION_WIDTH = 120;
const COLUMN_WIDTH = 160;

function Cell({ cell }: { cell: RatingCell }) {
  if (cell.kind === "text") {
    return (
      <Typography variant="body-s-regular" className="!text-tertiary">
        {cell.label}
      </Typography>
    );
  }
  return (
    <View className="gap-1">
      <StatusBadge dot tone={cell.tone}>
        {cell.label}
      </StatusBadge>
      {cell.sub && (
        <Typography variant="caption-s-regular" className="!text-tertiary">
          {cell.sub}
        </Typography>
      )}
    </View>
  );
}

export function RatingsTableView({ table }: { table: RatingsTable }) {
  const minWidth = DIMENSION_WIDTH + (table.headers.length - 1) * COLUMN_WIDTH;
  const columnStyle = (index: number) =>
    index === 0 ? { width: DIMENSION_WIDTH } : { width: COLUMN_WIDTH };

  return (
    <View className="gap-3">
      <View className="overflow-hidden rounded-lg border border-subtle">
        <ScrollView horizontal contentContainerClassName="min-w-full">
          <View className="flex-1" style={{ minWidth }}>
            <View className="flex-row gap-4 border-b border-subtle bg-secondary px-4 py-2.5">
              {table.headers.map((header, index) => (
                <Typography
                  key={header}
                  variant="caption-s-medium"
                  numberOfLines={1}
                  className="!text-secondary"
                  style={columnStyle(index)}
                >
                  {header}
                </Typography>
              ))}
            </View>
            {table.rows.map((row) => (
              <View
                key={row.dimension}
                className="flex-row items-start gap-4 border-b border-subtle px-4 py-3 last:border-b-0"
              >
                <Typography variant="body-s-medium" style={columnStyle(0)}>
                  {row.dimension}
                </Typography>
                {row.cells.map((cell, index) => (
                  <View key={index} style={columnStyle(index + 1)}>
                    <Cell cell={cell} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      {table.showCombineNote && (
        <Typography variant="caption-s-regular" className="!text-tertiary">
          {COMBINE_NOTE}
        </Typography>
      )}
    </View>
  );
}
