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
import Clipboard from "@react-native-clipboard/clipboard";
import { Link } from "@react-navigation/native";
import clsx from "clsx";
import React, { useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import {
  ChevronDownIcon,
  ChevronRightIcon,
} from "react-native-heroicons/outline";
import {
  DocumentDuplicateIcon,
  PencilIcon,
} from "react-native-heroicons/solid";

import { MeetingTypeTag } from "~@meetings/app/entities/meeting-type";
import { DraftCaseNoteSheet } from "~@meetings/app/features/edit-case-note";
import { Person, PersonType } from "~@meetings/app/shared/api";
import ProcessingSvg from "~@meetings/app/shared/assets/icons/processing.svg";
import ProcessingErrorBanner from "~@meetings/app/shared/ui/ProcessingErrorBanner";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import { isMeetingProcessing } from "~@meetings/app/utils/isMeetingProcessing";
import type { PostMeetingProcessingStatus } from "~@meetings/trpc-types";

import { useProcessingText } from "../lib/useProcessingText";

type MeetingCardItemProps = {
  meeting: {
    id: string;
    meetingType: string | null;
    meetingTypeCategory: string | null;
    date: string;
    time: string;
    duration: string | null;
    content: string;
    status: PostMeetingProcessingStatus;
    validationErrorType: string | null;
    start: Date;
    end: Date | null;
    caseNote: string | null;
  };
  person: Person;
  personType: PersonType;
};

const MeetingCardItem = ({
  meeting,
  person,
  personType,
}: MeetingCardItemProps) => {
  const { title: processingTitle, subtitle: processingSubtitle } =
    useProcessingText();
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();
  const draftCaseNoteSheetRef = useRef<BottomSheetModal>(null);
  const [canEditNote, setCanEditNote] = useState(false);
  const isProcessing = isMeetingProcessing(meeting.status);
  const isError = !!meeting.validationErrorType;
  const isFinishedWithoutNote = !isProcessing && !isError && !meeting.caseNote;
  const isFinishedWithNote = !isProcessing && !isError && !!meeting.caseNote;

  const linkProps =
    meeting.status === "NOT_STARTED"
      ? {
          screen:
            personType === "client" ? "ClientNewMeeting" : "ResidentNewMeeting",
          params: {
            personId: person.personId,
            fullName: person.fullName,
            displayPersonExternalId: person.displayPersonExternalId,
            primaryMetadata: person.primaryMetadata,
            meetingId: meeting.id,
          },
        }
      : {
          screen: personType === "client" ? "ClientMeeting" : "ResidentMeeting",
          params: {
            meetingId: meeting.id,
            personId: person.personId.toString(),
          },
        };

  const handleCopyNotes = () => {
    if (meeting.caseNote) {
      Clipboard.setString(meeting.caseNote);
      showSnackbar("Case note copied to clipboard");
    }
  };

  const handleDraftCaseNoteEdit = () => {
    draftCaseNoteSheetRef.current?.present();
    setCanEditNote(true);
  };

  const handleDraftCaseNoteShow = () => {
    draftCaseNoteSheetRef.current?.present();
    setCanEditNote(false);
  };

  return (
    <View key={meeting.id} className="mb-2 w-full px-4">
      <View className="w-full flex-1 rounded-[20px] bg-primary p-3">
        {isError ? (
          <View className="w-full flex-row items-center justify-between border-b border-subtle pb-3">
            <View className="flex flex-col gap-1">
              <View className="flex flex-row items-center gap-1">
                <Typography className="mr-1 flex flex-row items-center gap-2 text-base font-medium text-primary">
                  {meeting.date}
                </Typography>
                <MeetingTypeTag
                  type={meeting.meetingType}
                  typeCategory={meeting.meetingTypeCategory}
                />
              </View>
              <Typography className="text-sm leading-4 text-secondary">
                {meeting.time}
                {meeting.duration && ` • ${meeting.duration}`}
              </Typography>
            </View>
          </View>
        ) : (
          <Link {...linkProps}>
            <View
              className={clsx(
                "w-full flex-row items-center justify-between",
                isFinishedWithoutNote
                  ? "border-b-0 pb-0"
                  : "border-b border-subtle pb-3",
              )}
            >
              <View className="flex flex-col gap-1">
                <View className="flex flex-row items-center gap-2">
                  <View className="flex flex-row items-center gap-1">
                    <Typography className="mr-1 flex flex-row items-center gap-2 text-base font-medium text-primary">
                      {meeting.date}
                    </Typography>
                    <MeetingTypeTag
                      type={meeting.meetingType}
                      typeCategory={meeting.meetingTypeCategory}
                    />
                  </View>
                </View>
                <Typography className="text-sm leading-4 text-secondary">
                  {meeting.time}
                  {meeting.duration && ` • ${meeting.duration}`}
                </Typography>
              </View>
              <ChevronRightIcon className="!size-6 stroke-tertiary stroke-[2px]" />
            </View>
          </Link>
        )}
        {isError && (
          <ProcessingErrorBanner
            validationErrorType={meeting.validationErrorType}
            className="mt-3"
          />
        )}
        {isProcessing && (
          <View className="mt-3 rounded-xl bg-brand-light px-3 py-2">
            <View className="flex-row items-center">
              <ProcessingSvg />

              <View className="ml-3 flex-1">
                <Typography className="text-sm font-medium text-brand">
                  {processingTitle}
                </Typography>
                <Typography className="text-xs text-secondary">
                  {processingSubtitle}
                </Typography>
              </View>
            </View>
          </View>
        )}
        {/* TODO(#12879): Implement "add notes" functionality once we know how it should work */}
        {/* {isFinishedWithoutNote && (
          <TouchableOpacity onPress={() => console.log("add notes")}>
            <View className="mt-3 flex flex-row items-center justify-center gap-1.5 rounded-full bg-secondary py-4">
              <PlusIcon className="!size-4 stroke-tertiary stroke-[3px]" />
              <Typography className="text-base font-semibold leading-[18px] text-primary">
                Add notes
              </Typography>
            </View>
          </TouchableOpacity>
        )} */}
        {isFinishedWithNote && (
          <View className="mt-3 flex w-full flex-1 flex-col gap-3">
            <Typography
              className="flex-1 text-sm text-secondary"
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {meeting.caseNote}
            </Typography>
            <View className="flex w-full flex-row items-center justify-end gap-2">
              <TouchableOpacity
                className="mr-auto"
                onPress={handleDraftCaseNoteShow}
              >
                <View className="flex flex-row items-center justify-center gap-1 rounded-full bg-secondary px-4 py-2">
                  <Typography className="text-sm font-semibold leading-4 text-primary">
                    Show more
                  </Typography>
                  <ChevronDownIcon className="!size-3 stroke-tertiary stroke-[3px]" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDraftCaseNoteEdit}>
                <View className="flex flex-row items-center justify-center gap-1 rounded-full bg-secondary px-4 py-2">
                  <PencilIcon className="!size-4 fill-tertiary" />
                  <Typography className="text-sm font-semibold leading-4 text-primary">
                    Edit
                  </Typography>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCopyNotes}
                disabled={isSnackbarShowing}
              >
                <View className="flex flex-row items-center justify-center gap-1 rounded-full bg-secondary px-4 py-2">
                  <DocumentDuplicateIcon className="!size-4 text-tertiary" />
                  <Typography className="text-sm font-semibold leading-4 text-primary">
                    Copy
                  </Typography>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      <DraftCaseNoteSheet
        meetingId={meeting.id}
        notes={meeting?.caseNote || ""}
        clientName={person.fullName}
        meetingDate={meeting?.start}
        ref={draftCaseNoteSheetRef}
        canEdit={canEditNote}
      />
    </View>
  );
};

export default MeetingCardItem;
