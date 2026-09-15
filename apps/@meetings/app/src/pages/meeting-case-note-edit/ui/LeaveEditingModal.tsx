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
  onLeave: () => void;
  onStay: () => void;
};

export function LeaveEditingModal({ onLeave, onStay }: Props) {
  return (
    <Modal
      visible
      transparent
      onClickOutside={onStay}
      containerClassName="w-full max-w-[500px] p-6"
    >
      <Modal.Title>Leave editing mode?</Modal.Title>
      <Modal.Body className="mt-2">
        You haven’t saved your changes yet. Leaving now will discard them.
      </Modal.Body>
      <View className="mt-6 gap-2">
        <Button variant="primary" onPress={onLeave} className="py-3">
          Leave without saving
        </Button>
        <Button variant="secondary" onPress={onStay} className="py-3">
          Stay
        </Button>
      </View>
    </Modal>
  );
}
