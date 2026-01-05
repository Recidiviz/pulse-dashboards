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
import { Image, Keyboard, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import { formatDraftCaseNoteMeetingDate } from "../utils/format";
import { useSnackbar } from "./Snackbar";

type Props = {
  notes: string;
  clientName: string;
  meetingDate?: Date;
  ref: RefObject<BottomSheet | null>;
};

const DraftCaseNoteSheet = ({ notes, clientName, meetingDate, ref }: Props) => {
  const { bottom: bottomSafeArea } = useSafeAreaInsets();
  const [text, onChangeText] = useState(notes);
  const snapPoints = useMemo(() => ["70%", "90%"], []);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  // 88px is height of button plus paddings from figma
  const FOOTER_HEIGHT = bottomSafeArea + 88;

  const handleClose = () => {
    onChangeText("");
    if (ref.current) {
      ref.current.close();
    }
  };

  const handleSave = () => {
    console.log(text);
    if (ref.current) {
      ref.current.close();
    }
  };

  const handleCopyNotes = () => {
    Clipboard.setString(text);
    showSnackbar("Notes copied to clipboard");
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
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      handleIndicatorStyle={{ backgroundColor: "#00000099" }}
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
            <View className="flex w-full flex-row items-start gap-4 self-end bg-white p-4">
              <TouchableOpacity
                onPress={handleClose}
                className="flex flex-1 items-center justify-center rounded-[32px] border border-[#35536233] py-[17px]"
              >
                <Text className="font-inter text-lg font-semibold leading-[22px] text-primary">
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex flex-1 items-center justify-center rounded-[32px] bg-[#00665F] py-[17px]"
              >
                <Text className="font-inter text-lg font-semibold leading-[22px] text-white">
                  SAVE CHANGES
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheetFooter>
        )
      }
    >
      <BottomSheetView className="flex max-h-full flex-1 flex-col">
        <View className="flex flex-row items-center justify-between border-b border-[#EDF1F1] p-4">
          <TouchableOpacity onPress={handleClose}>
            <Image
              source={Icons.ArrowLeft}
              className="!size-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View className="flex flex-col items-center">
            <Text className="font-inter text-lg font-semibold leading-[22px]">
              Edit draft case note
            </Text>
            <Text className="font-inter text-sm leading-[16px] text-gray-500">
              {clientName} • Meeting{" "}
              {meetingDate ? formatDraftCaseNoteMeetingDate(meetingDate) : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCopyNotes}
            disabled={isSnackbarShowing}
          >
            <Image
              source={Icons.Copy}
              className="!size-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <BottomSheetTextInput
          className="min-h-[200px] flex-1 p-4"
          multiline
          value={text}
          onChangeText={onChangeText}
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
