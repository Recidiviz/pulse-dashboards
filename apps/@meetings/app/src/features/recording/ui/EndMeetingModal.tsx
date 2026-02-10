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

import { Text, TouchableOpacity, View } from "react-native";

import { Person } from "~@meetings/app/common/types";
import Modal from "~@meetings/app/components/Modal";

import { ModalConfirmationBackdrop } from "./ModalConfirmationBackdrop";

type Props = {
  person: Person;
  onContinue: () => void;
  onFinishAndSave: () => void;
};

export function EndMeetingModal({
  person,
  onContinue,
  onFinishAndSave,
}: Props) {
  return (
    <Modal
      visible
      transparent
      containerClassName="px-6 py-5"
      onClickOutside={onContinue}
      backdrop={ModalConfirmationBackdrop}
    >
      <Text className="mb-3 font-inter text-xl font-semibold text-primary">
        End this meeting?
      </Text>
      <Text className="mb-5 w-[350px] font-inter text-[#355362D9]">
        You’re about to finish the meeting with{" "}
        <Text className="font-bold">{person.fullName}</Text> and save the notes
        for processing.
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="w-[170px] items-center rounded-full border border-[#35536233] py-3"
          onPress={onContinue}
        >
          <Text className="font-inter font-semibold text-primary">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-[170px] items-center rounded-full bg-primary py-3"
          onPress={onFinishAndSave}
        >
          <Text className="font-inter font-semibold text-white">
            Finish & Save
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
