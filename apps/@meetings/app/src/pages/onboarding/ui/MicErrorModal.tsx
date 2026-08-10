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
import { XIcon } from "react-native-heroicons/solid";

import MicrophoneMutedSvg from "~@meetings/app/shared/assets/icons/microphone-muted.svg";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { MIC_ERROR_MESSAGES } from "../config";
import { MicErrorType } from "../model/types";

type Props = {
  onClose: () => void;
  errorType: MicErrorType;
};

export function MicErrorModal({ onClose, errorType }: Props) {
  const { title, message } = MIC_ERROR_MESSAGES[errorType];

  return (
    <Modal
      containerClassName="flex max-w-[520px] flex-col px-6 py-4"
      transparent
    >
      <View className="mb-3 flex w-full flex-row justify-between">
        <MicrophoneMutedSvg className="size-8 fill-attention" />
        <TouchableOpacity onPress={onClose}>
          <XIcon className="size-4 text-tertiary" />
        </TouchableOpacity>
      </View>
      <Typography className="mb-1 text-xl font-semibold text-primary">
        {title}
      </Typography>
      <Typography className="mb-6 text-base font-normal text-secondary">
        {message}
      </Typography>
      <View className="flex w-full flex-row justify-end">
        <TouchableOpacity
          className="w-fit rounded-full bg-brand px-5 py-3"
          onPress={onClose}
        >
          <Typography className="text-center text-base font-semibold leading-[18px] text-on-brand">
            Try Again
          </Typography>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
