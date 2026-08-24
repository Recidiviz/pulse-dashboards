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
import { ImageBackground, Platform, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";
import MicrophoneIcon from "react-native-heroicons/solid/MicrophoneIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getCategoryType,
  getCategoryTypePlaceholder,
  getMeetingTypeCategoriesOptions,
  getMeetingTypesOptions,
  HIDDEN_MEETING_TYPE_SUFFIX,
} from "~@meetings/app/entities/meeting-type";
import { useUserContext } from "~@meetings/app/entities/user";
import { Person } from "~@meetings/app/shared/api";
import PlaySvg from "~@meetings/app/shared/assets/icons/play.svg";
import BgAvatarImage from "~@meetings/app/shared/assets/images/bg-avatar.png";
import {
  getInitials,
  humanReadableTitleCase,
} from "~@meetings/app/shared/lib/format";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { Button } from "~@meetings/app/shared/ui/Button";
import Dropdown from "~@meetings/app/shared/ui/Dropdown";
import { OfflineIndicator } from "~@meetings/app/shared/ui/OfflineIndicator";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import { AgencyConfig } from "~@meetings/config";

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
  const { isRecidivizUser } = useUserContext();
  const meetingTypesOptions = getMeetingTypesOptions(
    meetingTypes,
    isRecidivizUser,
  );
  const meetingTypeCategoriesOptions = getMeetingTypeCategoriesOptions(
    meetingTypes,
    meetingTypeValue,
    isRecidivizUser,
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
            <Button
              variant="secondary"
              shape="circle"
              icon={{ icon: XIcon, className: "size-5" }}
              onPress={onClose}
            />
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
          <Typography
            variant="body-s-regular"
            className="mb-6 px-4 text-center leading-5"
          >
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
              <Typography variant="button-l" className="uppercase">
                {person.fullName}
              </Typography>
              <Typography variant="body-s-regular">
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
              onSelect={(v) =>
                setMeetingType(v.replace(HIDDEN_MEETING_TYPE_SUFFIX, ""))
              }
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
          <Button
            variant="primary"
            className="mb-3 h-14 w-full"
            icon={{ icon: PlaySvg, className: "size-4" }}
            loading={isMeetingCreating}
            onPress={onStartMeeting}
          >
            Start meeting
          </Button>

          <Button
            variant="secondary"
            className="h-14 w-full"
            onPress={onUploadFile}
          >
            Upload file
          </Button>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
