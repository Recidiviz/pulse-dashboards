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
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState } from "react";
import { Platform, TextInput, TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { trpc } from "~@meetings/app/shared/api";
import Modal from "~@meetings/app/shared/ui/Modal";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import type { OutputVoteTab } from "~@meetings/trpc-types";

type OutputVoteMessageModalProps = {
  visible: boolean;
  onClose: () => void;
  meetingId: string;
  tab: OutputVoteTab;
};

const OutputVoteMessageModal = ({
  visible,
  onClose,
  meetingId,
  tab,
}: OutputVoteMessageModalProps) => {
  const [message, setMessage] = useState("");
  const utils = trpc.useUtils();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { showSnackbar } = useSnackbar();

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  const submitOutputVoteMessage =
    trpc.v1.meeting.submitOutputVoteMessage.useMutation({
      onSuccess: () => {
        utils.v1.meeting.getDetails.invalidate({ meetingId });
        handleClose();
        showSnackbar(
          "Thanks for your feedback! You’re helping us make the product better",
        );
      },
      onError: () => {
        showSnackbar(
          "Something went wrong while submitting your feedback. Please try again.",
        );
      },
    });

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!message.trim() || submitOutputVoteMessage.isPending) return;
    submitOutputVoteMessage.mutate({
      meetingId,
      tab,
      message: message.trim(),
    });
  };

  const hasText = message.trim().length > 0;

  const FeedbackTextInput =
    Platform.OS === "web" ? TextInput : BottomSheetTextInput;

  const innerContent = (
    <View className="gap-4 px-6 pb-6">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-1 pr-4">
          <Typography className="text-xl font-bold text-primary">
            Anything else you'd like to tell us?
          </Typography>
          <Typography className="text-sm text-secondary">
            Let us know why this insight is incorrect or incomplete.
          </Typography>
          <Typography className="text-sm text-secondary">
            Your feedback helps us improve AI accuracy
          </Typography>
        </View>
        <TouchableOpacity onPress={handleClose} accessibilityLabel="Close">
          <XIcon className="size-5 stroke-tertiary" />
        </TouchableOpacity>
      </View>

      <FeedbackTextInput
        className="min-h-[72px] rounded-lg border border-subtle bg-primary p-3 text-base text-primary"
        placeholder="Type your feedback here..."
        multiline
        value={message}
        onChangeText={setMessage}
        textAlignVertical="top"
      />

      {Platform.OS === "web" ? (
        <View className="flex-row justify-end gap-3">
          <TouchableOpacity
            onPress={handleClose}
            className="items-center justify-center rounded-full bg-secondary px-6 py-3"
          >
            <Typography className="font-semibold text-primary">
              Cancel
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!hasText}
            className={`items-center justify-center rounded-full px-6 py-3 ${
              hasText ? "bg-brand" : "bg-disabled"
            }`}
          >
            <Typography
              className={`font-semibold ${hasText ? "text-on-brand" : "text-on-disabled"}`}
            >
              Submit
            </Typography>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!hasText}
          className={`items-center justify-center rounded-full py-4 ${
            hasText ? "bg-brand" : "bg-disabled"
          }`}
        >
          <Typography
            className={`font-semibold ${hasText ? "text-on-brand" : "text-on-disabled"}`}
          >
            Submit
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <Modal
        visible={visible}
        transparent
        onClickOutside={handleClose}
        containerClassName="w-full max-w-[520px]"
      >
        <View className="pt-6">{innerContent}</View>
      </Modal>
    );
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={handleClose}
      keyboardBehavior="extend"
      handleIndicatorStyle={{ opacity: 0 }}
      containerStyle={{ flex: 1 }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.5}
        />
      )}
    >
      <BottomSheetView>{innerContent}</BottomSheetView>
    </BottomSheetModal>
  );
};

export default OutputVoteMessageModal;
