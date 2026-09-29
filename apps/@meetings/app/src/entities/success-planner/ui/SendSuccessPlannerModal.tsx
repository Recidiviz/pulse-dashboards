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

import { Button } from "~@meetings/app/shared/ui/Button";
import Modal from "~@meetings/app/shared/ui/Modal";

type Props = {
  onCancel: () => void;
  onSend: () => void;
};

export function SendSuccessPlannerModal({ onCancel, onSend }: Props) {
  return (
    <Modal
      visible
      transparent
      containerClassName="px-6 py-5 max-w-[400px]"
      onClickOutside={onCancel}
    >
      <View className="gap-3">
        <View className="flex-row justify-between">
          <Modal.Title>Send Success Planner?</Modal.Title>
          <TouchableOpacity onPress={onCancel}>
            <XIcon className="stroke-tertiary" />
          </TouchableOpacity>
        </View>
        <Modal.Body className="!text-left">
          Send the Success Planner to the resident to complete before their
          120-day pre-release meeting.
        </Modal.Body>
        <Modal.Actions className="mt-2">
          <Button variant="secondary" onPress={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onPress={onSend}>
            Send
          </Button>
        </Modal.Actions>
      </View>
    </Modal>
  );
}
