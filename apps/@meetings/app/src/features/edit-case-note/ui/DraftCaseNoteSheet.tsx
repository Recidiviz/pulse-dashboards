// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import Clipboard from "@react-native-clipboard/clipboard";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Pressable,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import DocumentDuplicateIcon from "react-native-heroicons/outline/DocumentDuplicateIcon";

import {
  formatDraftCaseNoteMeetingDate,
  useUpdateNotes,
} from "~@meetings/app/entities/meeting";
import { useAnalytics } from "~@meetings/app/shared/analytics";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Sheet } from "~@meetings/app/shared/ui/Sheet";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  meetingId: string;
  notes: string;
  clientName: string;
  meetingDate?: Date;
  visible: boolean;
  onClose: () => void;
  canEdit?: boolean;
  personId: string;
};

export const DraftCaseNoteSheet = ({
  meetingId,
  notes,
  clientName,
  meetingDate,
  visible,
  onClose,
  canEdit = false,
  personId,
}: Props) => {
  const { track } = useAnalytics();
  const { height: windowHeight } = useWindowDimensions();
  const updateNotesMutation = useUpdateNotes();
  const [inputNotes, setInputNotes] = useState(notes || "");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  useEffect(() => {
    if (visible) setInputNotes(notes || "");
  }, [visible, notes]);

  const handleSave = () => {
    updateNotesMutation.mutate({
      meetingId,
      caseNote: inputNotes,
    });
    onClose();
    showSnackbar("Case note saved", 6000);
  };

  const handleCopyNotes = () => {
    Clipboard.setString(notes);
    showSnackbar("Case note copied to clipboard");
    track("case_notes_copied", { meetingId, personId });
  };

  // this use effect is used to remove footer while keyboard is active
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Pressable onPress={Keyboard.dismiss} className="cursor-default">
        <View className="flex h-20 flex-row items-center justify-between border-b border-subtle p-4">
          <TouchableOpacity onPress={onClose}>
            <ChevronLeftIcon className="size-5 text-primary" />
          </TouchableOpacity>
          <View className="flex flex-col items-center">
            <Typography className="text-lg font-semibold leading-[22px]">
              Edit draft case note
            </Typography>
            <Typography className="text-sm leading-[16px] text-secondary">
              {clientName} • Meeting{" "}
              {meetingDate ? formatDraftCaseNoteMeetingDate(meetingDate) : ""}
            </Typography>
          </View>
          <TouchableOpacity
            onPress={handleCopyNotes}
            disabled={isSnackbarShowing}
          >
            <DocumentDuplicateIcon className="size-5 text-primary" />
          </TouchableOpacity>
        </View>
      </Pressable>
      <TextInput
        // Short while editing, so the sheet fits above the keyboard.
        style={{
          height: windowHeight * (canEdit ? 0.2 : 0.5),
          outlineColor: "transparent",
        }}
        className="p-4 text-base text-primary"
        multiline
        value={inputNotes}
        onChangeText={setInputNotes}
        textAlignVertical="top"
        readOnly={!canEdit}
      />
      {!isKeyboardVisible && (
        <View className="flex w-full flex-row items-start gap-4 p-4">
          {!canEdit && (
            <Button variant="primary" onPress={onClose} className="flex-1 py-3">
              Close
            </Button>
          )}
          {canEdit && (
            <>
              <TouchableOpacity
                onPress={onClose}
                className="flex flex-1 items-center justify-center rounded-[32px] border border-brand py-3"
              >
                <Typography variant="button-l" className="!text-brand">
                  Cancel
                </Typography>
              </TouchableOpacity>
              <Button
                variant="primary"
                onPress={handleSave}
                className="flex-1 py-3"
              >
                Save changes
              </Button>
            </>
          )}
        </View>
      )}
    </Sheet>
  );
};
