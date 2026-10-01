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

import { TextInput, View } from "react-native";
import MicrophoneIcon from "react-native-heroicons/solid/MicrophoneIcon";
import UploadIcon from "react-native-heroicons/solid/UploadIcon";

import {
  getCategoryType,
  getCategoryTypePlaceholder,
  getMeetingTypeCategoriesOptions,
  getMeetingTypesOptions,
  HIDDEN_MEETING_TYPE_SUFFIX,
} from "~@meetings/app/entities/meeting-type";
import { useUserContext } from "~@meetings/app/entities/user";
import { MeetingModalLayout } from "~@meetings/app/features/recording";
import { Person } from "~@meetings/app/shared/api";
import PlaySvg from "~@meetings/app/shared/assets/icons/play.svg";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { Button } from "~@meetings/app/shared/ui/Button";
import Dropdown from "~@meetings/app/shared/ui/Dropdown";
import { OfflineIndicator } from "~@meetings/app/shared/ui/OfflineIndicator";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import { AgencyConfig } from "~@meetings/config";

type NewMeetingOptionsModalProps = {
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
  note: string;
  setNote: (note: string) => void;
};

export function NewMeetingOptionsModal({
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
  note,
  setNote,
}: NewMeetingOptionsModalProps) {
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
    <MeetingModalLayout
      onClose={onClose}
      sidebarProps={{ person, onNavigateAway: onClose }}
    >
      <View className="z-10 flex-1 grow items-center justify-center gap-4 px-8 py-10">
        <View className="relative mb-2 size-20 items-center justify-center rounded-full bg-screen">
          <MicrophoneIcon className="size-8 fill-tertiary" />
          <OfflineIndicator
            rootClassName="absolute -right-3 -top-3"
            triggerClassName="size-9 rounded-full border-2 border-on-brand bg-warning-light"
            iconClassName="!size-5"
          />
        </View>
        <Typography variant="heading-2" className="text-center">
          {isOnline ? "New Meeting Recording" : "Offline Meeting Recording"}
        </Typography>
        <Typography
          variant="body-m-regular"
          className="max-w-[560px] text-center !text-secondary"
        >
          {isOnline
            ? "Choose how to add a meeting: record new or upload audio. Be sure to confirm that everyone present is aware and has agreed to recording."
            : "Your meeting is being recorded locally and will upload automatically upon reconnection. Be sure to confirm that everyone present is aware and has agreed to recording."}
        </Typography>
        <Typography
          variant="body-s-regular"
          className="mb-2 max-w-[560px] text-center italic"
        >
          Please note: Summaries and other notes are generated for meetings
          containing 50 words or more.
        </Typography>
        {meetingTypesOptions?.length > 0 && (
          <Dropdown
            className="z-20"
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
            className="z-10"
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
        <View className="flex-row gap-6">
          <Button
            variant="secondary"
            className="h-14 min-w-[200px]"
            icon={{ icon: UploadIcon, className: "size-5" }}
            onPress={onUploadFile}
          >
            Upload audio
          </Button>
          <Button
            variant="primary"
            className="h-14 min-w-[200px]"
            icon={{ icon: PlaySvg, className: "size-4" }}
            loading={isMeetingCreating}
            onPress={onStartMeeting}
          >
            Start Meeting
          </Button>
        </View>
      </View>

      <View className="gap-2 border-t border-subtle px-12 pb-8 pt-6">
        <Typography variant="body-m-medium">
          Notepad{" "}
          <Typography variant="body-m-regular" className="!text-secondary">
            (notes will transfer to the next page)
          </Typography>
        </Typography>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          placeholder="Start typing here... Try adding discussion topics."
          className="min-h-[88px] rounded-lg border border-subtle bg-secondary px-4 py-3 text-base leading-[22px] text-primary outline-none"
        />
      </View>
    </MeetingModalLayout>
  );
}
