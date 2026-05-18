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
  BottomSheetFooter,
} from "@gorhom/bottom-sheet";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import ArrowLeftIcon from "react-native-heroicons/solid/ArrowLeftIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NotesSvg from "~@meetings/app/shared/assets/icons/notes.svg";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useAudioUploadStore } from "../model/store";

type Props = {
  onClose: () => void;
};

export function NotesSheet({ onClose }: Props) {
  const insets = useSafeAreaInsets();
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
    <BottomSheet
      enableDynamicSizing={false}
      snapPoints={["95%"]}
      handleComponent={null}
      enableContentPanningGesture={false}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          pressBehavior="collapse"
          onPress={handleCancel}
        />
      )}
      footerComponent={(props) =>
        inputValue !== userNotepadNotes ? (
          <BottomSheetFooter {...props} bottomInset={insets.bottom}>
            <View className="w-full p-4">
              <TouchableOpacity
                onPress={handleSave}
                className="rounded-full bg-brand px-5 py-3"
              >
                <Typography className="text-center text-sm font-semibold leading-[18px] text-on-brand">
                  Save
                </Typography>
              </TouchableOpacity>
            </View>
          </BottomSheetFooter>
        ) : null
      }
    >
      <View className="flex flex-1 flex-col p-4">
        <View className="w-full py-4">
          <TouchableOpacity onPress={handleCancel} className="w-fit">
            <ArrowLeftIcon className="fill-tertiary" />
          </TouchableOpacity>
        </View>
        <Typography className="mb-4 mt-2 font-libre-baskerville text-[28px] font-semibold leading-10 text-primary">
          Notepad
        </Typography>
        <View className="flex-1">
          <View className="mb-3 flex flex-row gap-2.5">
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
      </View>
      {isConfirmationModalOpen && (
        <ConfirmationModal
          onStay={() => setIsConfirmationModalOpen(false)}
          onDiscardAndExit={handleDiscardAndExit}
        />
      )}
    </BottomSheet>
  );
}

type ConfirmationModalProps = {
  onStay: () => void;
  onDiscardAndExit: () => void;
};

function ConfirmationModal({
  onStay,
  onDiscardAndExit,
}: ConfirmationModalProps) {
  return (
    <Modal visible transparent onClickOutside={onStay}>
      <View className="flex w-[320px] flex-1 flex-col p-5">
        <View className="mb-5 flex w-full flex-col gap-1">
          <Typography className="mb-1 text-center text-xl font-semibold text-primary">
            Leave Notepad?
          </Typography>
          <Typography className="mb-3 text-center text-base font-normal text-secondary">
            You have unsaved notes in your scratchpad. If you leave now, your
            changes will be lost.
          </Typography>
        </View>
        <View className="flex w-full flex-col gap-3">
          <TouchableOpacity
            onPress={onDiscardAndExit}
            className="rounded-full bg-brand px-5 py-3"
          >
            <Typography className="text-center text-base font-semibold leading-[18px] text-on-brand">
              Leave without saving
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onStay}
            className="rounded-full bg-secondary px-5 py-3"
          >
            <Typography className="text-center text-base font-semibold leading-[18px] text-primary">
              Keep editing
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
