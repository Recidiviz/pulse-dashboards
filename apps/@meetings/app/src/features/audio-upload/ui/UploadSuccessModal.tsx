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
import CheckCircleIcon from "react-native-heroicons/solid/CheckCircleIcon";

import Modal from "~@meetings/app/components/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  onClose: () => void;
};

export function UploadSuccessModal({ onClose }: Props) {
  return (
    <Modal
      visible
      transparent
      onClickOutside={onClose}
      containerClassName="max-w-[520px] items-center p-6"
    >
      <View className="mb-5 w-full flex-row items-center sm:justify-between">
        <CheckCircleIcon className="m-auto size-7 fill-brand" />
        <TouchableOpacity onPress={onClose} className="hidden sm:block">
          <XIcon className="stroke-muted size-5" />
        </TouchableOpacity>
      </View>

      <Typography className="mb-2 w-full text-center text-xl font-semibold text-primary sm:text-left">
        Upload complete
      </Typography>

      <Typography className="mb-6 text-center text-sm text-secondary">
        Your audio file has been uploaded. Processing will begin shortly
      </Typography>

      <View className="w-full items-center sm:items-end">
        <TouchableOpacity
          className="w-full rounded-full bg-brand px-6 py-3 sm:w-auto"
          onPress={onClose}
        >
          <Typography className="text-center text-sm font-medium text-on-brand">
            Close
          </Typography>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
