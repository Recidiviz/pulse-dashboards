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

import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { View } from "react-native";

import { useAgencyConfigs } from "~@meetings/app/entities/agency-config";
import {
  CaseNoteSummaryCard,
  CaseNoteSummarySheet,
  useCaseNoteSummary,
} from "~@meetings/app/entities/case-note-summary";
import { getPersonType } from "~@meetings/app/entities/person";
import { useStateSelection } from "~@meetings/app/entities/state-code";
import { Person } from "~@meetings/app/shared/api";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  person: Person;
};

export function MeetingCaseNoteSummary({ person }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const { selectedStateCode } = useStateSelection();
  const { agencyConfigs } = useAgencyConfigs();

  const showCNI = agencyConfigs[selectedStateCode].showCNI;
  const isClient = getPersonType(person) === "client";

  const { segments, enabled } = useCaseNoteSummary({
    person,
    isClient,
    showCNI,
  });

  if (!enabled) return null;

  if (!segments)
    return (
      <View className="gap-3 rounded-2xl bg-primary p-3">
        <View className="flex-row items-center justify-between">
          <Typography variant="body-m-medium">No client context yet</Typography>
        </View>
        <Typography variant="body-s-regular">
          Client context will appear here when it’s available.
        </Typography>
      </View>
    );

  return (
    <>
      <CaseNoteSummaryCard
        segments={segments}
        onPress={() => sheetRef.current?.present()}
      />
      <CaseNoteSummarySheet ref={sheetRef} segments={segments} />
    </>
  );
}
