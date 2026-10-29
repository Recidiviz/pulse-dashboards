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

import clsx from "clsx";
import { useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { Sheet } from "~@meetings/app/shared/ui/Sheet";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { NOTEPAD_DESCRIPTION } from "../lib/notepad";

type Props = {
  note: string;
  onConfirm: (note: string) => void;
  visible: boolean;
  onClose: () => void;
};

export function NotepadSheet({ note, onConfirm, visible, onClose }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [newNote, setNewNote] = useState<string | null>(null);

  const text = newNote ?? note;
  const isDirty = text !== note;

  const handleConfirm = () => {
    onConfirm(text);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      onDismissed={() => setNewNote(null)}
      showDragIndicator={false}
    >
      <View className="gap-3 p-6">
        <View className="flex-row items-start justify-between gap-4">
          <Typography variant="heading-3">Notepad</Typography>
          <TouchableOpacity
            onPress={onClose}
            className="rounded-full bg-screen p-1.5"
          >
            <XIcon className="size-4 text-secondary" />
          </TouchableOpacity>
        </View>

        <Typography variant="body-m-regular" className="text-secondary">
          {NOTEPAD_DESCRIPTION}
        </Typography>

        <TextInput
          value={text}
          onChangeText={setNewNote}
          multiline
          scrollEnabled
          autoFocus
          textAlignVertical="top"
          maxLength={100000}
          // Short, so the sheet fits above the keyboard.
          style={{ height: windowHeight * 0.2 }}
          className="text-base text-primary outline-none"
        />

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!isDirty}
          className={clsx(
            "items-center rounded-full py-4",
            isDirty ? "bg-brand" : "bg-disabled",
          )}
        >
          <Typography className="font-semibold text-on-brand">
            Confirm
          </Typography>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
