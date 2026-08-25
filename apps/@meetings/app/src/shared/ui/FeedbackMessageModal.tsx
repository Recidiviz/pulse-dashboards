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
import { Platform, TextInput, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { Button } from "./Button";
import Modal from "./Modal";
import { Typography } from "./Typography";

type FeedbackMessageModalProps = {
  title: string;
  description: string;
  visible: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  isSubmitting?: boolean;
};

export function FeedbackMessageModal({
  title,
  description,
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
}: FeedbackMessageModalProps) {
  const [message, setMessage] = useState("");
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (!visible) setMessage("");
    if (Platform.OS === "web") return;
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!message.trim() || isSubmitting) return;
    onSubmit(message.trim());
  };

  const hasText = message.trim().length > 0;

  const FeedbackTextInput =
    Platform.OS === "web" ? TextInput : BottomSheetTextInput;

  const innerContent = (
    <View className="gap-4 px-6 pb-6">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-1 pr-4">
          <Typography className="text-xl font-bold text-primary">
            {title}
          </Typography>
          <Typography variant="body-s-regular">{description}</Typography>
        </View>
        <Button
          onPress={onClose}
          variant="secondary"
          shape="circle"
          className={`${Platform.OS === "web" ? "bg-transparent" : ""}`}
          icon={{ icon: () => <XIcon className="size-5 stroke-tertiary" /> }}
        />
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
          <Button onPress={onClose} variant="secondary" className="px-6 py-3">
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            variant="primary"
            disabled={!hasText}
            className="px-6 py-3"
            loading={isSubmitting}
          >
            Submit
          </Button>
        </View>
      ) : (
        <Button
          onPress={handleSubmit}
          variant="primary"
          disabled={!hasText}
          className="py-4"
          loading={isSubmitting}
        >
          Submit
        </Button>
      )}
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <Modal
        visible={visible}
        transparent
        onClickOutside={onClose}
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
      onDismiss={onClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
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
}
