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

import { View } from "react-native";

import { Button } from "~@meetings/app/shared/ui/Button";
import Modal from "~@meetings/app/shared/ui/Modal";

type Props = {
  onClose: () => void;
};

export function UseMobileAppModal({ onClose }: Props) {
  return (
    <Modal
      visible
      transparent
      onClickOutside={onClose}
      containerClassName="w-full max-w-[500px] p-6"
    >
      <Modal.Title>Use the Recidiviz app to record</Modal.Title>
      <Modal.Body className="mt-2">
        Recording meetings isn’t available in a mobile browser. Open the
        Recidiviz app on your device to record, or upload an audio file here
        instead.
      </Modal.Body>
      <View className="mt-6">
        <Button variant="primary" onPress={onClose} className="py-3">
          Got it
        </Button>
      </View>
    </Modal>
  );
}
