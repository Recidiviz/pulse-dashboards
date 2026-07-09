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

import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
  TouchableWithoutFeedback,
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

import { useUpdateNotes } from "~@meetings/app/entities/meeting";
import { useAnalytics } from "~@meetings/app/shared/analytics";
import { theme } from "~@meetings/app/shared/config";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import { formatDraftCaseNoteMeetingDate } from "~@meetings/app/utils/format";

type Props = {
  meetingId: string;
  notes: string;
  clientName: string;
  meetingDate?: Date;
  ref: RefObject<BottomSheetModal | null>;
  canEdit?: boolean;
  personId: string;
};

export const DraftCaseNoteSheet = ({
  meetingId,
  notes,
  clientName,
  meetingDate,
  ref,
  canEdit = true,
  personId,
}: Props) => {
  const { track } = useAnalytics();
  const { bottom: bottomSafeArea } = useSafeAreaInsets();
  const updateNotesMutation = useUpdateNotes();
  const [inputNotes, setInputNotes] = useState(notes || "");
  const snapPoints = useMemo(() => ["90%"], []);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  // 88px is height of button plus paddings from figma
  const FOOTER_HEIGHT = 88;

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

  const TextInput = Platform.OS === "web" ? RNTextInput : BottomSheetTextInput;

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={false}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="extend"
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
            <View className="flex w-full flex-row items-start gap-4 self-end bg-primary p-4 transition-all duration-300">
              {!canEdit && (
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex flex-1 items-center justify-center rounded-[32px] border border-brand bg-brand py-3"
                >
                  <Typography className="text-base font-semibold leading-[18px] text-on-brand">
                    Close
                  </Typography>
                </TouchableOpacity>
              )}
              {canEdit && (
                <>
                  <TouchableOpacity
                    onPress={handleClose}
                    className="flex flex-1 items-center justify-center rounded-[32px] border border-brand py-3"
                  >
                    <Typography className="text-base font-semibold leading-[18px] text-brand">
                      Cancel
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    className="flex flex-1 items-center justify-center rounded-[32px] border border-brand bg-brand py-3"
                  >
                    <Typography className="text-base font-semibold leading-[18px] text-on-brand">
                      Save changes
                    </Typography>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </BottomSheetFooter>
        )
      }
    >
      <BottomSheetView className="flex max-h-full flex-1 flex-col">
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          className="flex-1 cursor-default"
        >
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
        </TouchableWithoutFeedback>
        <TextInput
          className="min-h-80 flex-1 p-4 outline-none"
          multiline
          value={inputNotes}
          onChangeText={setInputNotes}
          textAlignVertical="top"
          readOnly={!canEdit}
        />
        {!isKeyboardVisible && (
          <View className="w-full" style={{ height: FOOTER_HEIGHT }} />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};
