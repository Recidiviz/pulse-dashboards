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

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import Clipboard from "@react-native-clipboard/clipboard";
import { RefObject, useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Platform,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import DocumentDuplicateIcon from "react-native-heroicons/outline/DocumentDuplicateIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../common/theme";
import { useUpdateNotes } from "../hooks/useUpdateNotesMutation";
import { Typography } from "../shared/ui/Typography";
import { formatDraftCaseNoteMeetingDate } from "../utils/format";
import { useSnackbar } from "./Snackbar";

type Props = {
  meetingId: string;
  notes: string;
  clientName: string;
  meetingDate?: Date;
  ref: RefObject<BottomSheet | null>;
};

const DraftCaseNoteSheet = ({
  meetingId,
  notes,
  clientName,
  meetingDate,
  ref,
}: Props) => {
  const { bottom: bottomSafeArea } = useSafeAreaInsets();
  const updateNotesMutation = useUpdateNotes();
  const [inputNotes, setInputNotes] = useState(notes || "");
  const snapPoints = useMemo(() => ["70%", "90%"], []);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  // 88px is height of button plus paddings from figma
  const FOOTER_HEIGHT = bottomSafeArea + 88;

  const handleClose = () => {
    setInputNotes(notes);
    if (ref.current) {
      ref.current.close();
    }
  };

  const handleSave = () => {
    updateNotesMutation.mutate({
      meetingId,
      caseNote: inputNotes,
    });
    if (ref.current) {
      ref.current.close();
    }
    showSnackbar("Case note saved");
  };

  const handleCopyNotes = () => {
    Clipboard.setString(notes);
    showSnackbar("Case note copied to clipboard");
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

  const TextInput = Platform.OS === "web" ? RNTextInput : BottomSheetTextInput;

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      handleIndicatorStyle={{
        backgroundColor: theme["backgroundColor"]["strong"],
      }}
      containerStyle={{ flex: 1 }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={1}
          pressBehavior="close"
          opacity={0.5}
        />
      )}
      footerComponent={(props) =>
        isKeyboardVisible ? null : (
          <BottomSheetFooter {...props} bottomInset={bottomSafeArea}>
            <View className="flex w-full flex-row items-start gap-4 self-end bg-primary p-4">
              <TouchableOpacity
                onPress={handleClose}
                className="flex flex-1 items-center justify-center rounded-[32px] border border-brand py-[17px]"
              >
                <Typography className="text-lg font-semibold leading-[22px] text-brand">
                  CANCEL
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex flex-1 items-center justify-center rounded-[32px] bg-brand py-[17px]"
              >
                <Typography className="text-lg font-semibold leading-[22px] text-on-brand">
                  SAVE CHANGES
                </Typography>
              </TouchableOpacity>
            </View>
          </BottomSheetFooter>
        )
      }
    >
      <BottomSheetView className="flex max-h-full flex-1 flex-col">
        <View className="flex h-20 flex-row items-center justify-between border-b border-subtle p-4">
          <TouchableOpacity onPress={handleClose}>
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
        <TextInput
          className="min-h-[200px] flex-1 p-4"
          multiline
          value={inputNotes}
          onChangeText={setInputNotes}
          textAlignVertical="top"
        />
        {!isKeyboardVisible && (
          <View className="w-full" style={{ height: FOOTER_HEIGHT }} />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};

export default DraftCaseNoteSheet;
