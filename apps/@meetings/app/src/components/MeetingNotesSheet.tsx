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
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { RefObject, useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import DocumentDuplicateIcon from "react-native-heroicons/outline/DocumentDuplicateIcon";

import { theme } from "../common/theme";
import { MeetingDetails } from "../common/types";
import { useUpdateNotes } from "../hooks/useUpdateNotesMutation";
import { useSnackbar } from "../shared/ui/Snackbar";
import { Typography } from "../shared/ui/Typography";
import { copyMeetingNotes } from "../utils/copyMeetingNotes";
import { formatDraftCaseNoteMeetingDate } from "../utils/format";

type Props = {
  meetingDetails: MeetingDetails;
  clientName: string;
  bottomSheetRef: RefObject<BottomSheet | null>;
};

const MeetingNotesSheet = ({
  meetingDetails,
  clientName,
  bottomSheetRef,
}: Props) => {
  const [actionItems, setActionItems] = useState(
    meetingDetails.actionItems || [],
  );
  const [criticalUpdates, setCriticalUpdates] = useState(
    meetingDetails.criticalUpdates || [],
  );
  const snapPoints = useMemo(() => ["70%", "90%"], []);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  const updateNotesMutation = useUpdateNotes({
    onSuccess: () => {
      showSnackbar("Changes saved");
      bottomSheetRef.current?.close();
    },
    onError: () => showSnackbar("Failed to save changes"),
  });

  const FOOTER_HEIGHT = 88;

  const handleClose = () => {
    setActionItems(meetingDetails.actionItems || []);
    setCriticalUpdates(meetingDetails.criticalUpdates || []);
    bottomSheetRef.current?.close();
  };

  const handleSave = () => {
    updateNotesMutation.mutate({
      meetingId: meetingDetails.id,
      userNotepadNotes: meetingDetails.userNotepadNotes || "",
      actionItems,
      criticalUpdates,
      caseNote: meetingDetails.caseNote || "",
    });
  };

  const handleCopyNotes = () => {
    copyMeetingNotes({
      userNotepadNotes: meetingDetails.userNotepadNotes,
      actionItems: meetingDetails.actionItems,
      criticalUpdates: meetingDetails.criticalUpdates,
      meetingSummary: meetingDetails.meetingSummary,
    });
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

  const TextInput = Platform.OS === "web" ? RNTextInput : BottomSheetTextInput;
  const ScrollableContainer =
    Platform.OS === "web" ? ScrollView : BottomSheetScrollView;

  return (
    <BottomSheet
      ref={bottomSheetRef}
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
          <BottomSheetFooter {...props}>
            <View className="flex w-full flex-row items-start gap-4 self-end bg-white p-4">
              <TouchableOpacity
                onPress={handleClose}
                className="flex flex-1 items-center justify-center rounded-[32px] border border-[#35536233] py-[17px]"
              >
                <Typography className="text-lg font-semibold leading-[22px] text-primary">
                  CANCEL
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex flex-1 items-center justify-center rounded-[32px] bg-[#00665F] py-[17px]"
              >
                <Typography className="text-lg font-semibold leading-[22px] text-white">
                  SAVE CHANGES
                </Typography>
              </TouchableOpacity>
            </View>
          </BottomSheetFooter>
        )
      }
    >
      <ScrollableContainer className="flex max-h-full flex-1 flex-col">
        <View className="flex flex-row items-center justify-between border-b border-[#EDF1F1] p-4">
          <TouchableOpacity onPress={handleClose}>
            <ChevronLeftIcon className="text-muted size-5" />
          </TouchableOpacity>
          <View className="flex flex-col items-center">
            <Typography className="text-lg font-semibold leading-[22px]">
              Edit draft case note
            </Typography>
            <Typography className="text-sm leading-[16px] text-gray-500">
              {clientName} • Meeting{" "}
              {meetingDetails.startTime
                ? formatDraftCaseNoteMeetingDate(meetingDetails.startTime)
                : ""}
            </Typography>
          </View>
          <TouchableOpacity
            onPress={handleCopyNotes}
            disabled={isSnackbarShowing}
          >
            <DocumentDuplicateIcon className="stroke-muted size-4 stroke-[3px]" />
          </TouchableOpacity>
        </View>
        <View className="p-2">
          <Typography className="text-left text-base font-semibold text-primary">
            Action Items:
          </Typography>
          <TextInput
            className="p-2"
            scrollEnabled={false}
            multiline
            value={actionItems.join("\n")}
            onChangeText={(text) => setActionItems(text.split("\n"))}
            textAlignVertical="top"
          />
          <Typography className="text-left text-base font-semibold text-primary">
            Critical Updates:
          </Typography>
          <TextInput
            className="p-2"
            scrollEnabled={false}
            multiline
            value={criticalUpdates.join("\n")}
            onChangeText={(text) => setCriticalUpdates(text.split("\n"))}
            textAlignVertical="top"
          />
        </View>
        {!isKeyboardVisible && (
          <View className="w-full" style={{ height: FOOTER_HEIGHT }} />
        )}
      </ScrollableContainer>
    </BottomSheet>
  );
};

export default MeetingNotesSheet;
