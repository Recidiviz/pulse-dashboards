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

import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import MicrophoneIcon from "react-native-heroicons/solid/MicrophoneIcon";
import UploadIcon from "react-native-heroicons/solid/UploadIcon";

import MinimizeSvg from "~@meetings/app/assets/icons/arrows-pointing-in.svg";
import PlaySvg from "~@meetings/app/assets/icons/play.svg";
import { Person } from "~@meetings/app/common/types";
import Modal from "~@meetings/app/components/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type NewMeetingOptionsModalProps = {
  person: Person;
  onClose: () => void;
  onStartMeeting: () => void;
  onUploadFile: () => void;
  isMeetingCreating: boolean;
};

export function NewMeetingOptionsModal({
  person,
  onClose,
  onStartMeeting,
  onUploadFile,
  isMeetingCreating,
}: NewMeetingOptionsModalProps) {
  return (
    <Modal
      visible
      transparent
      onClickOutside={onClose}
      containerClassName="max-w-[960px] md:h-[658px] size-full"
    >
      <View className="h-full flex-1 grow md:h-auto">
        <View className="w-full flex-row items-center justify-between border-b border-subtle px-8 pb-3 pt-5">
          <View className="gap-1">
            <Typography className="text-xl font-semibold text-primary">
              New Meeting
            </Typography>
            <Typography className="text-base font-medium text-primary">
              {person.fullName}{" "}
              <Typography className="text-xs font-normal text-secondary md:text-base">
                {person.primaryMetadata} • ID: {person.displayPersonExternalId}
              </Typography>
            </Typography>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="rounded-full bg-screen p-1.5"
          >
            <MinimizeSvg className="size-5 text-secondary" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 grow items-center justify-center gap-4 px-8 py-10">
          <View className="mb-2 size-16 items-center justify-center rounded-xl border border-subtle bg-secondary">
            <MicrophoneIcon className="size-8 fill-tertiary" />
          </View>
          <Typography className="text-center font-libre-baskerville text-3xl font-bold text-primary">
            Meeting Recording
          </Typography>
          <Typography className="mb-2 max-w-[530px] text-center text-sm text-secondary">
            This meeting will be recorded and transcribed for note-taking. Be
            sure to confirm that everyone present is aware and has agreed to
            recording.
          </Typography>
          <Typography className="mb-2 max-w-[530px] text-center text-sm italic text-secondary">
            Please note: Summaries and other notes are generated for meetings
            containing 50 words or more.
          </Typography>

          <TouchableOpacity
            className="h-14 w-full max-w-[240px] flex-row items-center justify-center gap-2 rounded-full bg-brand aria-disabled:opacity-40"
            onPress={onStartMeeting}
            disabled={isMeetingCreating}
          >
            {isMeetingCreating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <PlaySvg className="size-4 fill-on-brand" />
                <Typography className="text-base font-semibold text-on-brand">
                  Start Meeting
                </Typography>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="h-14 w-full max-w-[240px] flex-row items-center justify-center gap-2 rounded-full bg-secondary"
            onPress={onUploadFile}
          >
            <UploadIcon className="size-5 fill-tertiary" />
            <Typography className="text-base font-medium text-primary">
              Upload audio
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
