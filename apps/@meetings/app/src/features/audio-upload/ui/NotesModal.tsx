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

import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import XIcon from "react-native-heroicons/outline/XIcon";

import NotesSvg from "~@meetings/app/shared/assets/icons/notes.svg";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useAudioUploadStore } from "../model/store";

type Props = {
  onClose: () => void;
};

export function NotesModal({ onClose }: Props) {
  const { userNotepadNotes, setUserNotepadNotes } = useAudioUploadStore();
  const [inputValue, setInputValue] = useState(userNotepadNotes);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const handleSave = () => {
    setUserNotepadNotes(inputValue);
    onClose();
  };

  const handleCancel = () => {
    if (inputValue !== userNotepadNotes) {
      setIsConfirmationModalOpen(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndExit = () => {
    setUserNotepadNotes(inputValue);
    setIsConfirmationModalOpen(false);
    onClose();
  };

  const handleDiscardAndExit = () => {
    setIsConfirmationModalOpen(false);
    onClose();
  };

  useEffect(() => {
    return () => {
      setInputValue(null);
    };
  }, []);

  return (
    <Modal visible transparent onClickOutside={handleCancel}>
      <View className="flex w-[960px] flex-1 flex-col px-6 py-5">
        <View className="relative flex w-full flex-col gap-1">
          <Typography className="text-xl font-semibold text-primary">
            Notes from this meeting (optional)
          </Typography>
          <Typography className="text-base font-normal text-secondary">
            Add any notes you took during the meeting
          </Typography>
          <TouchableOpacity
            onPress={handleCancel}
            className="absolute right-0 top-0"
          >
            <XIcon className="size-4 stroke-tertiary" />
          </TouchableOpacity>
        </View>
        <View className="flex h-[500px] w-full flex-col gap-4 py-4">
          <View className="flex flex-row gap-2.5">
            <NotesSvg className="size-6 stroke-secondary" />
            <Typography className="text-base text-primary">Notepad</Typography>
          </View>
          <TextInput
            style={{ flex: 1, outlineColor: "transparent" }}
            className="text-base text-primary"
            value={inputValue || ""}
            onChangeText={setInputValue}
            placeholder="Add any notes you took during the meeting — these will be used to generate your draft case note. (optional)"
            textAlignVertical="top"
            multiline
          />
        </View>
        <View className="flex flex-row items-center justify-end gap-2 pt-3">
          <TouchableOpacity
            onPress={handleCancel}
            className="rounded-full bg-secondary px-5 py-3"
          >
            <Typography className="text-base font-semibold leading-[18px] text-primary">
              Cancel
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            className="rounded-full bg-brand px-5 py-3"
          >
            <Typography className="text-base font-semibold leading-[18px] text-on-brand">
              Save
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
      {isConfirmationModalOpen && (
        <ConfirmationModal
          onStay={() => setIsConfirmationModalOpen(false)}
          onSaveAndExit={handleSaveAndExit}
          onDiscardAndExit={handleDiscardAndExit}
        />
      )}
    </Modal>
  );
}

type ConfirmationModalProps = {
  onStay: () => void;
  onSaveAndExit: () => void;
  onDiscardAndExit: () => void;
};

function ConfirmationModal({
  onStay,
  onSaveAndExit,
  onDiscardAndExit,
}: ConfirmationModalProps) {
  return (
    <Modal visible transparent onClickOutside={onStay}>
      <View className="flex w-[520px] flex-1 flex-col px-6 py-5">
        <View className="relative mb-3 flex w-full flex-col gap-1">
          <Typography className="mb-1 text-xl font-semibold text-primary">
            Leave Notepad?
          </Typography>
          <Typography className="mb-3 text-base font-normal text-secondary">
            You have unsaved notes in your scratchpad. If you leave now, your
            changes will be lost.
          </Typography>
          <TouchableOpacity
            onPress={onStay}
            className="z-2 absolute right-0 top-0"
          >
            <XIcon className="size-4 stroke-tertiary" />
          </TouchableOpacity>
        </View>
        <View className="flex w-full flex-row items-center justify-end gap-2">
          <TouchableOpacity
            onPress={onStay}
            className="mr-auto rounded-full border border-subtle px-5 py-3"
          >
            <Typography className="text-base font-semibold leading-[18px] text-primary">
              Keep editing
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSaveAndExit}
            className="rounded-full bg-secondary px-5 py-3"
          >
            <Typography className="text-base font-semibold leading-[18px] text-primary">
              Save
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDiscardAndExit}
            className="rounded-full bg-brand px-5 py-3"
          >
            <Typography className="text-base font-semibold leading-[18px] text-on-brand">
              Leave without saving
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
