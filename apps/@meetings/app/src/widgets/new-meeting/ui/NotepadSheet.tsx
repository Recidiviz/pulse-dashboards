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

import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import clsx from "clsx";
import { RefObject, useState } from "react";
import {
  Platform,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { NOTEPAD_DESCRIPTION } from "../lib/notepad";

type Props = {
  note: string;
  onConfirm: (note: string) => void;
  ref: RefObject<BottomSheetModal | null>;
};

export function NotepadSheet({ note, onConfirm, ref }: Props) {
  const { bottom: bottomSafeArea } = useSafeAreaInsets();
  const [newNote, setNewNote] = useState<string | null>(null);

  const text = newNote ?? note;
  const isDirty = text !== note;

  const handleClose = () => ref.current?.dismiss();

  const handleConfirm = () => {
    onConfirm(text);
    ref.current?.dismiss();
  };

  const TextInput = Platform.OS === "web" ? RNTextInput : BottomSheetTextInput;

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={false}
      snapPoints={["90%"]}
      handleComponent={null}
      keyboardBehavior="extend"
      containerStyle={{ flex: 1 }}
      onDismiss={() => setNewNote(null)}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          pressBehavior="close"
        />
      )}
      footerComponent={(props) => (
        <BottomSheetFooter {...props}>
          <View
            className="bg-primary px-4 pt-4"
            style={{ paddingBottom: bottomSafeArea }}
          >
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
        </BottomSheetFooter>
      )}
    >
      <BottomSheetView
        enableFooterMarginAdjustment
        className="max-h-full flex-1 flex-col gap-3 px-6 pt-6"
      >
        <View className="flex-row items-start justify-between gap-4">
          <Typography variant="heading-3">Notepad</Typography>
          <TouchableOpacity
            onPress={handleClose}
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
          className="flex-1 text-base text-primary outline-none"
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
}
