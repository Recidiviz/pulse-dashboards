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

import { CaseNoteSummarySegment } from "../model/types";
import { CaseNoteSummaryAiGeneratedLabel } from "./CaseNoteSummaryAiGeneratedLabel";
import { CaseNoteSummaryPreview } from "./CaseNoteSummaryPreview";

type Props = {
  segments: CaseNoteSummarySegment[];
  onPress: () => void;
  lastUpdatedAt?: Date;
};

export function CaseNoteSummaryCard({
  segments,
  onPress,
  lastUpdatedAt,
}: Props) {
  return (
    <View className="gap-3 rounded-2xl bg-primary p-3">
      <View className="flex-row items-center justify-between">
        <Typography variant="body-m-medium">Client context</Typography>
        <CaseNoteSummaryAiGeneratedLabel lastUpdatedAt={lastUpdatedAt} />
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <CaseNoteSummaryPreview segments={segments} numberOfLines={2} />
        </View>
        <Button onPress={onPress} variant="secondary">
          Show more
        </Button>
      </View>
    </View>
  );
}
