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

import { TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";
import ExclamationCircleIcon from "react-native-heroicons/solid/ExclamationCircleIcon";

import { Button } from "~@meetings/app/shared/ui/Button";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

const COPY = {
  send: {
    title: "Send 120-Day Check-In?",
    body: "Send the 120-Day Check-In to the resident to complete before their 120-day pre-release meeting.",
    error: "Couldn't send the 120-Day Check-In. Please try again.",
    action: "Send",
  },
  resend: {
    title: "Resend 120-Day Check-In?",
    body: "Send a new 120-Day Check-In to the resident's tablet. Their previous responses will no longer show here.",
    error: "Couldn't resend the 120-Day Check-In. Please try again.",
    action: "Resend",
  },
};

type Props = {
  onCancel: () => void;
  onSend: () => void;
  isSending: boolean;
  isError: boolean;
  isResend?: boolean;
};

export function SendSuccessPlannerModal({
  onCancel,
  onSend,
  isSending,
  isError,
  isResend = false,
}: Props) {
  const copy = COPY[isResend ? "resend" : "send"];

  return (
    <Modal
      visible
      transparent
      containerClassName="px-6 py-5 max-w-[400px]"
      onClickOutside={onCancel}
    >
      <View className="gap-3">
        <View className="flex-row justify-between">
          <Modal.Title>{copy.title}</Modal.Title>
          <TouchableOpacity onPress={onCancel}>
            <XIcon className="stroke-tertiary" />
          </TouchableOpacity>
        </View>
        <Modal.Body className="!text-left">{copy.body}</Modal.Body>
        {isError && (
          <View className="flex-row items-center gap-1.5">
            <ExclamationCircleIcon className="size-4 fill-attention" />
            <Typography variant="caption-s-regular" className="!text-attention">
              {copy.error}
            </Typography>
          </View>
        )}
        <Modal.Actions className="mt-2">
          <Button variant="secondary" onPress={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" loading={isSending} onPress={onSend}>
            {copy.action}
          </Button>
        </Modal.Actions>
      </View>
    </Modal>
  );
}
