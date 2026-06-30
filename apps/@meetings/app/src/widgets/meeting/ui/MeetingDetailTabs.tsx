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

import { isEmpty } from "lodash";
import { ReactNode } from "react";
import { View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  items?: string[] | null;
  outputVote?: ReactNode;
};

export const BulletListTab = ({ items, outputVote }: Props) => (
  <View className="flex-1 gap-4 pb-4">
    {items?.map((item, index) => (
      <View key={index} className="flex-row gap-2 px-4">
        <Typography className="mt-0.5 text-primary">•</Typography>
        <Typography className="flex-1 text-base leading-6 tracking-[-0.32px] text-primary">
          {item}
        </Typography>
      </View>
    ))}
    {!isEmpty(items) && outputVote}
  </View>
);
