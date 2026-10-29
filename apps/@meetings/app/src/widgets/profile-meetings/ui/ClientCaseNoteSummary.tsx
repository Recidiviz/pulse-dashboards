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

import clsx from "clsx";
import { useState } from "react";
import { View } from "react-native";

import { useAgencyConfigs } from "~@meetings/app/entities/agency-config";
import {
  CaseNoteSummaryAiGeneratedLabel,
  CaseNoteSummaryCard,
  CaseNoteSummarySheet,
  CaseNoteSummaryWithTooltips,
  useCaseNoteSummary,
} from "~@meetings/app/entities/case-note-summary";
import { getPersonType } from "~@meetings/app/entities/person";
import { useStateSelection } from "~@meetings/app/entities/state-code";
import { useFeatureVariants } from "~@meetings/app/entities/user";
import { Person } from "~@meetings/app/shared/api";
import {
  useIsMobileWidth,
  usePlatform,
} from "~@meetings/app/shared/lib/platform";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useCaseNoteSummaryFeedback } from "../model/useCaseNoteSummaryFeedback";
import {
  CaseNoteSummaryFeedbackButtons,
  CaseNoteSummaryFeedbackForm,
} from "./CaseNoteSummaryFeedbackButtons";

type Props = {
  person: Person;
};

export function ClientCaseNoteSummary({ person }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { isWeb } = usePlatform();
  const isMobileWidth = useIsMobileWidth();
  const { stateCode } = useStateSelection();
  const { agencyConfigs } = useAgencyConfigs();
  const { isVariantActive } = useFeatureVariants();

  const showCNI =
    agencyConfigs[stateCode].showCNI || isVariantActive("showCNI");
  const isClient = getPersonType(person) === "client";

  const { segments, summaries, enabled, lastUpdatedAt } = useCaseNoteSummary({
    person,
    isClient,
    showCNI,
  });
  const feedback = useCaseNoteSummaryFeedback({ person, summaries, segments });

  if (!segments || !summaries || !enabled) return null;

  if (isMobileWidth) {
    return (
      <View className="px-4 pt-3">
        <CaseNoteSummaryCard
          segments={segments}
          onPress={() => setIsSheetOpen(true)}
          lastUpdatedAt={lastUpdatedAt}
        />
        <CaseNoteSummarySheet
          visible={isSheetOpen && !feedback.isMessageFormVisible}
          onClose={() => setIsSheetOpen(false)}
          segments={segments}
          lastUpdatedAt={lastUpdatedAt}
          footer={<CaseNoteSummaryFeedbackButtons feedback={feedback} />}
        />
        <CaseNoteSummaryFeedbackForm feedback={feedback} />
      </View>
    );
  }

  return (
    <View className={clsx("gap-3 px-4 pt-4", isWeb && "md:px-0")}>
      <View className="gap-3 rounded-2xl border border-subtle bg-primary p-4">
        <View className="flex-row items-center justify-between">
          <Typography variant="body-m-medium">Client Context</Typography>
          <CaseNoteSummaryAiGeneratedLabel lastUpdatedAt={lastUpdatedAt} />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <CaseNoteSummaryWithTooltips segments={segments} person={person} />
          </View>
          <CaseNoteSummaryFeedbackButtons feedback={feedback} />
        </View>
      </View>
      <CaseNoteSummaryFeedbackForm feedback={feedback} />
    </View>
  );
}
