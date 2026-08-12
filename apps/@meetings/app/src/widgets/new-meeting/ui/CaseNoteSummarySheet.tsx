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

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { RefObject, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import LightBulbIcon from "react-native-heroicons/outline/LightBulbIcon";
import XIcon from "react-native-heroicons/outline/XIcon";
import SparklesIcon from "react-native-heroicons/solid/SparklesIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CaseNoteInsightsSummary,
  CaseNoteSummarySelectable,
  CitationCard,
  useCaseNoteSummary,
} from "~@meetings/app/entities/case-note-summary";
import { Person } from "~@meetings/app/shared/api";
import { BackgroundPressable } from "~@meetings/app/shared/ui/BackgroundPressable";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  summaries: CaseNoteInsightsSummary[];
  person: Person;
  ref: RefObject<BottomSheetModal | null>;
};

export function CaseNoteSummarySheet({ summaries, person, ref }: Props) {
  const { top: topSafeArea, bottom: bottomSafeArea } = useSafeAreaInsets();
  const [selectedIndex, setSelectedIndex] = useState<number>();

  const segments = useCaseNoteSummary(summaries, person);

  const handleClose = () => ref.current?.dismiss();

  if (!segments) return null;

  const citation =
    selectedIndex === undefined ? undefined : segments[selectedIndex]?.citation;

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      topInset={topSafeArea}
      handleComponent={null}
      enablePanDownToClose
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetScrollView
        contentContainerClassName="p-6"
        contentContainerStyle={{ paddingBottom: bottomSafeArea }}
      >
        <BackgroundPressable
          onBackgroundPress={() => setSelectedIndex(undefined)}
          className="gap-4"
        >
          <View className="gap-2">
            <View className="flex-row items-start justify-between gap-4">
              <Typography variant="heading-4">Client context</Typography>
              <TouchableOpacity
                onPress={handleClose}
                className="rounded-full bg-screen p-1.5"
              >
                <XIcon className="size-4 text-secondary" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-1">
              <SparklesIcon className="size-4 text-brand" />
              <Typography className="text-sm font-medium text-brand">
                AI generated
              </Typography>
            </View>
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

          <TouchableOpacity
            onPress={handleClose}
            className="items-center rounded-full bg-brand py-4"
          >
            <Typography className="text-base font-semibold leading-[18px] tracking-[-0.32px] text-on-brand">
              Close
            </Typography>
          </TouchableOpacity>
        </BackgroundPressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
