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

import { ReactNode, useState } from "react";
import { View } from "react-native";
import LightBulbIcon from "react-native-heroicons/outline/LightBulbIcon";
import XIcon from "react-native-heroicons/outline/XIcon";

import { BackgroundPressable } from "~@meetings/app/shared/ui/BackgroundPressable";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Sheet, SheetScrollView } from "~@meetings/app/shared/ui/Sheet";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { CaseNoteSummarySegment } from "../model/types";
import { CaseNoteSummaryAiGeneratedLabel } from "./CaseNoteSummaryAiGeneratedLabel";
import { CaseNoteSummarySelectable } from "./CaseNoteSummarySelectable";
import { CitationCard } from "./CitationCard";

type Props = {
  segments: CaseNoteSummarySegment[];
  visible: boolean;
  onClose: () => void;
  /** Rendered above the close button, e.g. the feedback controls. */
  footer?: ReactNode;
  lastUpdatedAt?: Date;
};

export function CaseNoteSummarySheet({
  segments,
  visible,
  onClose,
  footer,
  lastUpdatedAt,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number>();

  const citation =
    selectedIndex === undefined ? undefined : segments[selectedIndex]?.citation;

  return (
    <Sheet visible={visible} onClose={onClose} showDragIndicator={false}>
      <SheetScrollView contentContainerClassName="p-6">
        <BackgroundPressable
          onBackgroundPress={() => setSelectedIndex(undefined)}
          className="gap-4"
        >
          <View className="gap-2">
            <View className="flex-row items-start justify-between gap-4">
              <Typography variant="heading-4">Client context</Typography>
              <Button
                onPress={onClose}
                variant="secondary"
                shape="circle"
                icon={{
                  icon: () => <XIcon className="size-4 text-secondary" />,
                }}
              />
            </View>
            <CaseNoteSummaryAiGeneratedLabel lastUpdatedAt={lastUpdatedAt} />
          </View>

          <CaseNoteSummarySelectable
            segments={segments}
            selectedIndex={selectedIndex}
            onSelectedIndexChange={setSelectedIndex}
          />

          {citation ? (
            <CitationCard citation={citation} />
          ) : (
            <View className="gap-1 rounded-2xl bg-secondary p-4">
              <View className="flex-row items-center gap-1.5">
                <LightBulbIcon className="size-5 text-tertiary" />
                <Typography variant="body-s-regular">Tip</Typography>
              </View>
              <Typography variant="body-m-medium">
                Tap highlighted text to see more details
              </Typography>
            </View>
          )}

          {footer}

          <Button variant="primary" className="py-4" onPress={onClose}>
            Close
          </Button>
        </BackgroundPressable>
      </SheetScrollView>
    </Sheet>
  );
}
