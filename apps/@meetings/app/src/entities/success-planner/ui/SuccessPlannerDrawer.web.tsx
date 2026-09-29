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

import { ScrollView, TouchableOpacity, View } from "react-native";
import PrinterIcon from "react-native-heroicons/outline/PrinterIcon";

import { Person } from "~@meetings/app/shared/api";
import { usePlatform } from "~@meetings/app/shared/lib/platform";
import { Drawer } from "~@meetings/app/shared/ui/Drawer.web";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { getSuccessPlannerSummary } from "../lib/getSuccessPlannerSummary";
import { usePrintSuccessPlanner } from "../lib/usePrintSuccessPlanner.web";
import { SuccessPlanner } from "../model/successPlanner";
import { SuccessPlannerSectionNav } from "./SuccessPlannerSectionNav";
import { SuccessPlannerSections } from "./SuccessPlannerSections";
import { SuccessPlannerStatusBadge } from "./SuccessPlannerStatusBadge";

type Props = {
  person: Person;
  planner: SuccessPlanner;
  onClose: () => void;
};

export function SuccessPlannerDrawer({ person, planner, onClose }: Props) {
  const { status, statusLabel, subtitle } = getSuccessPlannerSummary(planner);
  const print = usePrintSuccessPlanner({ person, planner });
  const { isWeb } = usePlatform();

  return (
    <Drawer
      onClose={onClose}
      header={
        <>
          <View className="flex-row items-center gap-2">
            <Typography variant="heading-5">Success Planner</Typography>
            <SuccessPlannerStatusBadge status={status} label={statusLabel} />
          </View>
          <Typography variant="caption-s-regular">{subtitle}</Typography>
        </>
      }
      headerRight={
        status === "COMPLETED" && isWeb ? (
          <TouchableOpacity
            onPress={print}
            className="cursor-pointer flex-row items-center gap-1.5 rounded-full border border-subtle px-3 py-1.5"
          >
            <PrinterIcon className="size-4 stroke-secondary stroke-2" />
            <Typography variant="caption-s-medium">Print</Typography>
          </TouchableOpacity>
        ) : undefined
      }
    >
      <View className="flex-1 flex-row">
        <View className="w-[240px] border-r border-subtle p-6">
          <SuccessPlannerSectionNav answers={planner.answers} />
        </View>
        <ScrollView className="flex-1" contentContainerClassName="px-8 py-6">
          <SuccessPlannerSections answers={planner.answers} />
        </ScrollView>
      </View>
    </Drawer>
  );
}
