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

import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Action = "copy" | "share";

type Props = {
  onClose: () => void;
  onConfirm: () => void;
  isMeetingCreator: boolean;
  action: Action;
};

export function ReviewBeforeCopyModal({
  onClose,
  onConfirm,
  isMeetingCreator,
  action,
}: Props) {
  const actionLabel = action === "share" ? "Share anyway" : "Copy anyway";
  const subject = isMeetingCreator
    ? "You haven’t reviewed this yet."
    : "This content has not been reviewed yet.";

  return (
    <Modal
      visible
      transparent
      onClickOutside={onClose}
      containerClassName="max-w-[500px] p-6"
    >
      <View className="mb-6 w-full flex-row items-start justify-between gap-3">
        <Typography className="flex-1 text-base font-medium text-primary">
          {subject} {actionLabel}?
        </Typography>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
          <XIcon className="size-5 stroke-tertiary" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-end gap-3">
        <TouchableOpacity
          className="rounded-full bg-secondary px-6 py-3"
          onPress={onClose}
        >
          <Typography className="text-center text-sm font-medium text-primary">
            Review first
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-full bg-brand px-6 py-3"
          onPress={onConfirm}
        >
          <Typography className="text-center text-sm font-medium text-on-brand">
            {actionLabel}
          </Typography>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
