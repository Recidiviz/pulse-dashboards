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
import { TextInput, TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { useUpdateNotes } from "../hooks/useUpdateNotesMutation";
import { Typography } from "../shared/ui/Typography";
import { trpc } from "../trpc/client";
import Modal from "./Modal";

type Props = {
  meetingId: string;
  caseNote: string;
  onClose: () => void;
};

export function EditDraftCaseNoteModal({
  meetingId,
  caseNote,
  onClose,
}: Props) {
  const utils = trpc.useUtils();
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [inputNotes, setInputNotes] = useState(caseNote);

  const updateNotesMutation = useUpdateNotes({
    onSuccess: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId });
      onClose();
      setIsDiscarding(false);
    },
  });

  const hasChanges = inputNotes !== caseNote;

  const handleClose = () => {
    if (hasChanges) {
      setIsDiscarding(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    updateNotesMutation.mutate({ meetingId, caseNote: inputNotes });
  };

  return (
    <>
      <Modal
        visible
        onClickOutside={handleClose}
        onRequestClose={handleClose}
        transparent
        containerClassName="p-6 w-full max-w-[960px] gap-5"
      >
        <View className="mb-5 flex-row items-center justify-between">
          <Typography className="text-xl font-semibold text-primary">
            Edit Draft Case Note
          </Typography>
          <TouchableOpacity onPress={handleClose}>
            <XIcon className="size-5 stroke-primary" />
          </TouchableOpacity>
        </View>
        <TextInput
          className="h-[400px] rounded-lg border border-subtle bg-secondary p-3 outline-none color-secondary"
          value={inputNotes}
          onChangeText={setInputNotes}
          multiline
        />
        <View className="flex-row justify-end gap-2">
          <TouchableOpacity
            className="rounded-full bg-secondary px-3 py-2"
            onPress={handleClose}
          >
            <Typography className="text-sm font-medium text-primary">
              Back
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            className="rounded-full bg-brand px-3 py-2"
            onPress={handleSave}
          >
            <Typography className="text-sm font-medium text-on-brand">
              Save
            </Typography>
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal
        visible={isDiscarding}
        transparent
        containerClassName="p-6 w-[520px] gap-4"
      >
        <View className="flex-row items-center justify-between">
          <Typography className="text-base font-semibold text-primary">
            Discard changes?
          </Typography>
          <TouchableOpacity onPress={() => setIsDiscarding(false)}>
            <XIcon className="size-5 stroke-primary" />
          </TouchableOpacity>
        </View>
        <Typography className="text-sm text-secondary">
          You have unsaved changes.
        </Typography>
        <View className="flex-row justify-between gap-2">
          <TouchableOpacity
            className="rounded-full border border-primary px-3 py-2"
            onPress={() => setIsDiscarding(false)}
          >
            <Typography className="text-sm font-medium text-primary">
              Cancel
            </Typography>
          </TouchableOpacity>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="rounded-full bg-secondary px-3 py-2"
              onPress={onClose}
            >
              <Typography className="text-sm font-medium text-primary">
                Discard
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-full bg-brand px-3 py-2"
              onPress={handleSave}
            >
              <Typography className="text-sm font-medium text-on-brand">
                Save & Exit
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
