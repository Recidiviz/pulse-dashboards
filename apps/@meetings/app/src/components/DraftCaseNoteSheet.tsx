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

import BottomSheet, { BottomSheetBackdrop, BottomSheetFooter, BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import Clipboard from "@react-native-clipboard/clipboard";
import { RefObject, useEffect,useMemo, useState } from "react";
import { Image, Keyboard, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import { formatDraftCaseNoteMeetingDate } from "../utils/format";
import { useSnackbar } from "./Snackbar";

type Props = {
  notes: string;
  clientName: string;
  meetingDate?: Date;
  ref: RefObject<BottomSheet>;
}

const DraftCaseNoteSheet = (({ notes, clientName, meetingDate, ref }: Props) => {
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
  }

  const handleCopyNotes = () => {
    Clipboard.setString(text);
    showSnackbar("Notes copied to clipboard");
  }

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
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={1}
          pressBehavior="close"   
          opacity={0.5}
        />
      )}
      footerComponent={(props) => isKeyboardVisible 
        ? null 
        : (<BottomSheetFooter {...props} bottomInset={bottomSafeArea}>
            <View className="self-end p-4 gap-4 w-full flex flex-row items-start bg-white">
            <TouchableOpacity onPress={handleClose} className="border border-[#35536233] rounded-[32px] py-[17px] flex items-center justify-center flex-1">
              <Text className="text-primary font-inter font-semibold text-lg leading-[22px]">CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} className="bg-[#00665F] rounded-[32px] py-[17px] flex items-center justify-center flex-1">
              <Text className="text-white font-inter font-semibold text-lg leading-[22px]">SAVE CHANGES</Text>
            </TouchableOpacity>
            </View>
          </BottomSheetFooter>)
      }
    >
      <BottomSheetView className="flex-1 flex flex-col max-h-full">
        <View className="flex flex-row justify-between items-center border-b border-[#EDF1F1] p-4">
          <TouchableOpacity onPress={handleClose}>
            <Image
              source={Icons.ArrowLeft}
              className="size-6"
              resizeMode="contain"
            />
            
          </TouchableOpacity>
          <View className="flex flex-col items-center">
            <Text className="text-lg leading-[22px] font-semibold font-inter">Edit draft case note</Text>
            <Text className="text-gray-500 text-sm leading-[16px] font-inter">
              {clientName} • Meeting {meetingDate ? formatDraftCaseNoteMeetingDate(meetingDate): ""}
            </Text>
          </View>
          <TouchableOpacity onPress={handleCopyNotes} disabled={isSnackbarShowing}>
            <Image
              source={Icons.Copy}
              className="size-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <BottomSheetTextInput className="p-4 flex-1 min-h-[200px]" multiline value={text} onChangeText={onChangeText} textAlignVertical="top" />
        {!isKeyboardVisible && <View className="w-full" style={{ height: FOOTER_HEIGHT }} />}
      </BottomSheetView>
    </BottomSheet>
  )
});

export default DraftCaseNoteSheet;