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

import { Button } from "~@meetings/app/shared/ui/Button";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { getSuccessPlannerSummary } from "../lib/getSuccessPlannerSummary";
import { SuccessPlanner } from "../model/successPlanner";
import { SuccessPlannerStatusBadge } from "./SuccessPlannerStatusBadge";

type Props = {
  planner: SuccessPlanner;
  onOpen: () => void;
};

export function SuccessPlannerCard({ planner, onOpen }: Props) {
  const { status, statusLabel, title, subtitle, actionLabel } =
    getSuccessPlannerSummary(planner);

  return (
    <View className="flex-row items-center justify-between gap-4 rounded-2xl border border-subtle bg-primary p-4">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Typography variant="body-m-medium">{title}</Typography>
          <SuccessPlannerStatusBadge status={status} label={statusLabel} />
        </View>
        <Typography variant="caption-s-regular">{subtitle}</Typography>
      </View>
      <Button variant="secondary" onPress={onOpen}>
        {actionLabel}
      </Button>
    </View>
  );
}
