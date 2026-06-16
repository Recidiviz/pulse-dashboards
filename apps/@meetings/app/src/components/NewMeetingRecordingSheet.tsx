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

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";
import MicrophoneIcon from "react-native-heroicons/solid/MicrophoneIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Person } from "~@meetings/app/shared/api";
import { AgencyConfig } from "~@meetings/config";

import {
  getCategoryType,
  getCategoryTypePlaceholder,
  getMeetingTypeCategoriesOptions,
  getMeetingTypesOptions,
} from "../entities/meeting-type/lib";
import PlaySvg from "../shared/assets/icons/play.svg";
import BgAvatarImage from "../shared/assets/images/bg-avatar.png";
import { getInitials, humanReadableTitleCase } from "../shared/lib/format";
import useIsOnline from "../shared/lib/useIsOnline";
import Dropdown from "../shared/ui/Dropdown";
import { OfflineIndicator } from "../shared/ui/OfflineIndicator";
import { Typography } from "../shared/ui/Typography";

type NewMeetingRecordingSheetProps = {
  person: Person;
  onClose: () => void;
  onStartMeeting: () => void;
  onUploadFile: () => void;
  isMeetingCreating: boolean;
  meetingTypeValue: string | null;
  meetingTypes: AgencyConfig["meetingTypes"];
  setMeetingType: (meetingType: string) => void;
  meetingTypeCategory: string | null;
  setMeetingTypeCategory: (meetingTypeCategory: string) => void;
  meetingTypeCategoryError: string | null;
};

export function NewMeetingRecordingSheet({
  person,
  onClose,
  onStartMeeting,
  onUploadFile,
  isMeetingCreating,
  meetingTypeValue,
  meetingTypes,
  setMeetingType,
  meetingTypeCategory,
  setMeetingTypeCategory,
  meetingTypeCategoryError,
}: NewMeetingRecordingSheetProps) {
  const insets = useSafeAreaInsets();
  const { isOnline } = useIsOnline();
  const meetingTypesOptions = getMeetingTypesOptions(meetingTypes);
  const meetingTypeCategoriesOptions = getMeetingTypeCategoriesOptions(
    meetingTypes,
    meetingTypeValue,
  );
  const categoryType = getCategoryType(meetingTypes, meetingTypeValue);
  return (
    <BottomSheet
      enableDynamicSizing
      enableContentPanningGesture={Platform.OS !== "web"}
      enablePanDownToClose={Platform.OS !== "web"}
      onClose={onClose}
      handleComponent={null}
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
      <BottomSheetView style={{ paddingBottom: insets.bottom }}>
        <View className="items-center p-6">
          <View className="absolute right-4 top-4 z-10">
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full bg-secondary p-3"
            >
              <XIcon className="size-5 stroke-tertiary" />
            </TouchableOpacity>
          </View>
          <View className="relative mb-4 size-11 items-center justify-center rounded-xl border border-subtle bg-secondary">
            <MicrophoneIcon className="size-6 fill-tertiary" />
            <OfflineIndicator
              rootClassName="absolute right-[-14px] top-[-14px]"
              triggerClassName="size-7 rounded-full border-2 border-on-brand bg-warning-light"
              iconClassName="!size-3"
            />
          </View>
          <Typography className="mb-2 text-center text-xl font-bold text-primary">
            {isOnline ? "New Meeting Recording" : "Offline Meeting Recording"}
          </Typography>
          <Typography className="mb-6 px-4 text-center text-sm leading-5 text-secondary">
            {isOnline
              ? "Record a new meeting or upload an audio file. Be sure to confirm that everyone present is aware and has agreed to recording."
              : "Your meeting is being recorded locally and will upload automatically upon reconnection. Be sure to confirm that everyone present is aware and has agreed to recording."}
          </Typography>
          <View className="mb-6 w-full flex-row items-center gap-3 rounded-2xl bg-secondary p-4">
            <ImageBackground
              source={BgAvatarImage}
              className="!size-11 items-center justify-center overflow-hidden rounded-full"
              imageClassName="!size-11"
            >
              <Typography className="text-sm font-semibold text-on-strong">
                {getInitials(person.fullName)}
              </Typography>
            </ImageBackground>
            <View>
              <Typography className="text-base font-semibold uppercase text-primary">
                {person.fullName}
              </Typography>
              <Typography className="text-sm text-secondary">
                ID: {person.displayPersonExternalId} •{" "}
                {humanReadableTitleCase(person.primaryMetadata)}
              </Typography>
            </View>
          </View>
          {meetingTypesOptions?.length > 1 && (
            <Dropdown
              className="z-20 mb-4 w-full"
              variant="outline"
              value={meetingTypeValue}
              options={meetingTypesOptions}
              onSelect={setMeetingType}
            />
          )}
          {meetingTypeCategoriesOptions && (
            <Dropdown
              className="z-10 mb-4 w-full"
              variant="outline"
              value={meetingTypeCategory}
              options={meetingTypeCategoriesOptions}
              onSelect={setMeetingTypeCategory}
              defaultEmptyValue
              placeholder={getCategoryTypePlaceholder(categoryType)}
              hasFreeTextOption
              errorMessage={meetingTypeCategoryError}
            />
          )}
          <TouchableOpacity
            className="mb-3 h-14 w-full flex-row items-center justify-center gap-2 rounded-full bg-brand p-4"
            onPress={onStartMeeting}
            disabled={isMeetingCreating}
          >
            {isMeetingCreating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <PlaySvg className="size-4 fill-on-brand" />
                <Typography className="text-base font-semibold text-on-brand">
                  Start meeting
                </Typography>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="h-14 w-full items-center rounded-full bg-secondary py-3"
            onPress={onUploadFile}
          >
            <Typography className="text-base font-medium text-primary">
              Upload file
            </Typography>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
