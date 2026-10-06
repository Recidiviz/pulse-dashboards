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

import { View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import type { MetaItem } from "../lib/metadata";
import { ExternalLink } from "./ExternalLink";

export function MetadataGrid({ items }: { items: MetaItem[] }) {
  return (
    // A real grid keeps the columns aligned across rows.
    <View className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-6 gap-y-3.5 rounded-lg border border-subtle px-5 py-4">
      {items.map((item) => (
        <View key={item.label} className="min-w-0 gap-0.5">
          <Typography variant="caption-s-medium" className="!text-tertiary">
            {item.label}
          </Typography>
          {item.href ? (
            <ExternalLink label={item.value} href={item.href} />
          ) : (
            <Typography
              variant="body-s-regular"
              className={item.attention ? "!text-attention" : undefined}
            >
              {item.value}
            </Typography>
          )}
        </View>
      ))}
    </View>
  );
}
