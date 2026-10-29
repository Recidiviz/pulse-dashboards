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

import { useState } from "react";
import { ImageBackground, Platform, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";
import MicrophoneIcon from "react-native-heroicons/solid/MicrophoneIcon";

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
import { isMobileBrowser } from "~@meetings/app/shared/lib/platform";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { Button } from "~@meetings/app/shared/ui/Button";
import {
  DropdownContainer,
  DropdownOptionList,
  DropdownSheet,
} from "~@meetings/app/shared/ui/Dropdown";
import { OfflineIndicator } from "~@meetings/app/shared/ui/OfflineIndicator";
import { Sheet, SheetScrollView } from "~@meetings/app/shared/ui/Sheet";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import { AgencyConfig } from "~@meetings/config";

import { UseMobileAppModal } from "./UseMobileAppModal";

type NewMeetingRecordingSheetProps = {
  visible: boolean;
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

type DropdownKind = "type" | "category";

export function NewMeetingRecordingSheet({
  visible,
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
  const { isOnline } = useIsOnline();
  const [isUseMobileAppModalOpen, setIsUseMobileAppModalOpen] = useState(false);
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
  const selectedMeetingType =
    meetingTypesOptions.find(
      (option) =>
        option.replace(HIDDEN_MEETING_TYPE_SUFFIX, "") === meetingTypeValue,
    ) ??
    meetingTypeValue ??
    meetingTypesOptions[0];

  const [dropdownSheet, setDropdownSheet] = useState<{
    kind: DropdownKind;
    isClosing: boolean;
  } | null>(null);
  const isIOS = Platform.OS === "ios";

  const isDropdownOpen = (kind: DropdownKind) =>
    dropdownSheet?.kind === kind && !dropdownSheet.isClosing;

  const closeDropdown = () =>
    setDropdownSheet((sheet) =>
      sheet && isIOS ? { ...sheet, isClosing: true } : null,
    );

  const handleDropdownDismissed = (kind: DropdownKind) =>
    setDropdownSheet((sheet) => (sheet?.kind === kind ? null : sheet));

  const dropdownControls = (kind: DropdownKind) => ({
    open: isDropdownOpen(kind),
    onOpenChange: (open: boolean) =>
      open ? setDropdownSheet({ kind, isClosing: false }) : closeDropdown(),
  });

  const meetingTypeOptionList = (close: () => void) => (
    <DropdownOptionList
      options={meetingTypesOptions}
      value={selectedMeetingType}
      onSelect={(v) =>
        setMeetingType(v.replace(HIDDEN_MEETING_TYPE_SUFFIX, ""))
      }
      close={close}
    />
  );

  const categoryOptionList = (close: () => void) =>
    meetingTypeCategoriesOptions && (
      <DropdownOptionList
        options={meetingTypeCategoriesOptions}
        value={meetingTypeCategory}
        onSelect={setMeetingTypeCategory}
        close={close}
        hasFreeTextOption
      />
    );

  return (
    <>
      <Sheet
        // The mobile-app modal only opens on web, where the sheet is a modal
        // Radix dialog that blocks clicks outside itself, so the modal (portaled
        // to <body>) would be dead. Hide the sheet behind it and bring it back afterwards
        // can be fixed in https://github.com/expo/expo/issues/51576
        visible={
          visible &&
          !isUseMobileAppModalOpen &&
          !(isIOS && dropdownSheet !== null)
        }
        onClose={onClose}
        showDragIndicator={false}
      >
        <SheetScrollView>
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
              <DropdownContainer
                className="z-20 mb-4 w-full"
                variant="outline"
                buttonText={selectedMeetingType}
                {...dropdownControls("type")}
              >
                {({ close }) => meetingTypeOptionList(close)}
              </DropdownContainer>
            )}
            {meetingTypeCategoriesOptions && (
              <DropdownContainer
                className="z-10 mb-4 w-full"
                variant="outline"
                buttonText={meetingTypeCategory}
                placeholder={getCategoryTypePlaceholder(categoryType)}
                errorMessage={meetingTypeCategoryError}
                {...dropdownControls("category")}
              >
                {({ close }) => categoryOptionList(close)}
              </DropdownContainer>
            )}
            <Button
              variant="primary"
              className="mb-3 h-14 w-full"
              icon={{ icon: PlaySvg, className: "size-4" }}
              loading={isMeetingCreating}
              onPress={
                isMobileBrowser()
                  ? () => setIsUseMobileAppModalOpen(true)
                  : onStartMeeting
              }
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
        </SheetScrollView>
      </Sheet>
      {Platform.OS !== "web" && (
        <>
          <DropdownSheet
            visible={isDropdownOpen("type")}
            onClose={closeDropdown}
            onDismissed={() => handleDropdownDismissed("type")}
          >
            {meetingTypeOptionList(closeDropdown)}
          </DropdownSheet>
          <DropdownSheet
            visible={isDropdownOpen("category")}
            onClose={closeDropdown}
            onDismissed={() => handleDropdownDismissed("category")}
          >
            {categoryOptionList(closeDropdown)}
          </DropdownSheet>
        </>
      )}
      {isUseMobileAppModalOpen && (
        <UseMobileAppModal onClose={() => setIsUseMobileAppModalOpen(false)} />
      )}
    </>
  );
}
