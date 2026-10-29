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
import {
  Platform,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ArrowLeftIcon from "react-native-heroicons/solid/ArrowLeftIcon";

import NotesSvg from "~@meetings/app/shared/assets/icons/notes.svg";
import { Button } from "~@meetings/app/shared/ui/Button";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Sheet } from "~@meetings/app/shared/ui/Sheet";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useAudioUploadStore } from "../model/store";

type Props = {
  visible: boolean;
  onClose: () => void;
  onDismissed: () => void;
};

export function NotesSheet({ visible, onClose, onDismissed }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const { userNotepadNotes, setUserNotepadNotes } = useAudioUploadStore();
  const [inputValue, setInputValue] = useState(userNotepadNotes);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

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

  const handleDiscardAndExit = () => {
    setIsConfirmationModalOpen(false);
    // iOS ignores dismissing the sheet while the confirmation over it is
    // still being dismissed, so leave once the confirmation is gone.
    if (Platform.OS === "ios") setIsLeaving(true);
    else onClose();
  };

  const handleConfirmationDismissed = () => {
    if (!isLeaving) return;
    setIsLeaving(false);
    onClose();
  };

  useEffect(() => {
    if (visible) setInputValue(userNotepadNotes);
  }, [visible, userNotepadNotes]);

  // On web the sheet blocks clicks outside itself, so the confirmation opens
  // next to it while the sheet steps aside. Natively it opens over the sheet.
  const isWeb = Platform.OS === "web";
  const confirmationModal = (
    <ConfirmationModal
      visible={isConfirmationModalOpen}
      onStay={() => setIsConfirmationModalOpen(false)}
      onDiscardAndExit={handleDiscardAndExit}
      onDismiss={handleConfirmationDismissed}
    />
  );

  return (
    <>
      <Sheet
        visible={visible && !(isWeb && isConfirmationModalOpen)}
        onClose={handleCancel}
        onDismissed={() => {
          if (!visible) onDismissed();
        }}
        showDragIndicator={false}
        dismissible={false}
      >
        <View className="flex flex-col p-4">
          <View className="w-full py-4">
            <TouchableOpacity onPress={handleCancel} className="w-fit">
              <ArrowLeftIcon className="fill-tertiary" />
            </TouchableOpacity>
          </View>
          <Typography className="mb-4 mt-2 font-libre-baskerville text-[28px] font-semibold leading-10 text-primary">
            Notepad
          </Typography>
          <View>
            <View className="mb-3 flex flex-row gap-2.5">
              <NotesSvg className="size-6 stroke-secondary" />
              <Typography variant="body-m-regular">Notepad</Typography>
            </View>
            <TextInput
              style={{
                height: windowHeight * 0.2,
                outlineColor: "transparent",
              }}
              className="text-base text-primary"
              value={inputValue || ""}
              onChangeText={setInputValue}
              placeholder="Add any notes you took during the meeting — these will be used to generate your draft case note. (optional)"
              textAlignVertical="top"
              multiline
            />
          </View>
          {inputValue !== userNotepadNotes && (
            <View className="w-full pt-4">
              <Button
                variant="primary"
                className="px-5 py-3"
                onPress={handleSave}
              >
                Save
              </Button>
            </View>
          )}
        </View>
        {!isWeb && confirmationModal}
      </Sheet>
      {isWeb && confirmationModal}
    </>
  );
}

type ConfirmationModalProps = {
  visible: boolean;
  onStay: () => void;
  onDiscardAndExit: () => void;
  onDismiss: () => void;
};

function ConfirmationModal({
  visible,
  onStay,
  onDiscardAndExit,
  onDismiss,
}: ConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      onClickOutside={onStay}
      onDismiss={onDismiss}
    >
      <View className="flex w-[320px] flex-col p-5">
        <View className="mb-5 flex w-full flex-col gap-1">
          <Typography variant="heading-4" className="mb-1 text-center">
            Leave Notepad?
          </Typography>
          <Typography
            variant="body-m-regular"
            className="mb-3 text-center text-secondary"
          >
            You have unsaved notes in your scratchpad. If you leave now, your
            changes will be lost.
          </Typography>
        </View>
        <View className="flex w-full flex-col gap-3">
          <Button
            variant="primary"
            className="px-5 py-3"
            onPress={onDiscardAndExit}
          >
            Leave without saving
          </Button>
          <Button variant="secondary" className="px-5 py-3" onPress={onStay}>
            Keep editing
          </Button>
        </View>
      </View>
    </Modal>
  );
}
