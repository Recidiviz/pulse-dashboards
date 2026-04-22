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

import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  onContinue: () => void;
  onDiscard: () => void;
};

export function DiscardUploadModal({ onContinue, onDiscard }: Props) {
  return (
    <Modal visible transparent containerClassName="max-w-[520px] p-6">
      <Typography className="mb-2 text-center text-xl font-semibold text-primary sm:text-left">
        Cancel audio upload?
      </Typography>

      <Typography className="mb-6 text-center text-sm text-secondary sm:text-left">
        You're in the middle of uploading an audio file. Are you sure you want
        to stop the upload?
      </Typography>

      <View className="items-center justify-end gap-3 sm:flex-row">
        <TouchableOpacity
          className="w-full rounded-full bg-secondary px-6 py-3 sm:w-auto"
          onPress={onDiscard}
        >
          <Typography className="text-center text-sm font-medium text-primary">
            Discard and close
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full rounded-full bg-brand px-6 py-3 sm:w-auto"
          onPress={onContinue}
        >
          <Typography className="text-center text-sm font-medium text-on-brand">
            Continue uploading
          </Typography>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
