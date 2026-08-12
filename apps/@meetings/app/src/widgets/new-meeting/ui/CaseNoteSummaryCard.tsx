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

import { TouchableOpacity, View } from "react-native";
import SparklesIcon from "react-native-heroicons/solid/SparklesIcon";

import {
  CaseNoteInsightsSummary,
  CaseNoteSummaryPreview,
  useCaseNoteSummary,
} from "~@meetings/app/entities/case-note-summary";
import { Person } from "~@meetings/app/shared/api";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  summaries?: CaseNoteInsightsSummary[];
  person: Person;
  onPress: () => void;
};

export function CaseNoteSummaryCard({ summaries, person, onPress }: Props) {
  const segments = useCaseNoteSummary(summaries, person);

  if (segments) {
    return (
      <View className="gap-3 rounded-2xl bg-primary p-3">
        <View className="flex-row items-center justify-between">
          <Typography variant="body-m-medium">Client context</Typography>
          <View className="flex-row items-center gap-1">
            <SparklesIcon className="size-4 text-brand" />
            <Typography className="text-sm text-brand">AI generated</Typography>
          </View>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <CaseNoteSummaryPreview segments={segments} numberOfLines={2} />
          </View>
          <TouchableOpacity
            onPress={onPress}
            className="shrink-0 self-center rounded-full bg-screen px-3 py-2"
          >
            <Typography variant="button-m">Show more</Typography>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
}
