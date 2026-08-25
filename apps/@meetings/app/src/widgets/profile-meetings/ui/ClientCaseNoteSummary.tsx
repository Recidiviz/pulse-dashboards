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
import clsx from "clsx";
import { useRef } from "react";
import { View } from "react-native";
import SparklesIcon from "react-native-heroicons/solid/SparklesIcon";

import { useAgencyConfigs } from "~@meetings/app/entities/agency-config";
import {
  CaseNoteSummaryCard,
  CaseNoteSummarySheet,
  CaseNoteSummaryWithTooltips,
  useCaseNoteSummary,
} from "~@meetings/app/entities/case-note-summary";
import { getPersonType } from "~@meetings/app/entities/person";
import { useStateSelection } from "~@meetings/app/entities/state-code";
import { Person } from "~@meetings/app/shared/api";
import {
  useIsMobileWidth,
  usePlatform,
} from "~@meetings/app/shared/lib/platform";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { CaseNoteSummaryFeedbackButtons } from "./CaseNoteSummaryFeedbackButtons";

type Props = {
  person: Person;
};

export function ClientCaseNoteSummary({ person }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const { isWeb } = usePlatform();
  const isMobileWidth = useIsMobileWidth();
  const { selectedStateCode } = useStateSelection();
  const { agencyConfigs } = useAgencyConfigs();

  const showCNI = agencyConfigs[selectedStateCode].showCNI;
  const isClient = getPersonType(person) === "client";

  const { segments, summaries, enabled } = useCaseNoteSummary({
    person,
    isClient,
    showCNI,
  });

  if (!segments || !summaries || !enabled) return null;

  if (isMobileWidth) {
    return (
      <View className="px-4 pt-3">
        <CaseNoteSummaryCard
          segments={segments}
          onPress={() => sheetRef.current?.present()}
        />
        <CaseNoteSummarySheet
          ref={sheetRef}
          segments={segments}
          footer={
            <CaseNoteSummaryFeedbackButtons
              person={person}
              summaries={summaries}
              segments={segments}
            />
          }
        />
      </View>
    );
  }

  return (
    <View className={clsx("gap-3 px-4 pt-4", isWeb && "md:px-0")}>
      <View className="gap-3 rounded-2xl border border-subtle bg-primary p-4">
        <View className="flex-row items-center justify-between">
          <Typography variant="body-m-medium">Case Note Summary</Typography>
          <View className="flex-row items-center gap-1">
            <SparklesIcon className="size-4 text-brand" />
            <Typography className="text-sm text-brand">AI generated</Typography>
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <CaseNoteSummaryWithTooltips segments={segments} />
          </View>
          <CaseNoteSummaryFeedbackButtons
            person={person}
            summaries={summaries}
            segments={segments}
          />
        </View>
      </View>
    </View>
  );
}
