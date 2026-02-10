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

import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { Person } from "~@meetings/app/common/types";
import Modal from "~@meetings/app/components/Modal";

import { ModalConfirmationBackdrop } from "./ModalConfirmationBackdrop";

type Props = {
  person: Person;
  onContinue: () => void;
  onDiscard: () => void;
};

export function DiscardMeetingModal({ person, onContinue, onDiscard }: Props) {
  const [discardCountdown, setDiscardCountdown] = useState(3);

  useEffect(() => {
    setDiscardCountdown(3);

    const interval = setInterval(() => {
      setDiscardCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Modal
      visible
      transparent
      containerClassName="px-6 py-5"
      onClickOutside={onContinue}
      backdrop={ModalConfirmationBackdrop}
    >
      <Text className="mb-3 font-inter text-xl font-semibold text-primary">
        Discard meeting?
      </Text>
      <Text className="mb-5 w-[350px] font-inter text-[#355362D9]">
        You’re about to discard the meeting with{" "}
        <Text className="font-bold">{person.fullName}.</Text> Notes and
        transcript won't be saved.
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="w-[170px] items-center rounded-full border border-[#35536233] py-3"
          onPress={onContinue}
        >
          <Text className="font-inter font-semibold text-primary">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`w-[170px] items-center rounded-full py-3 ${discardCountdown > 0 ? "bg-[#4D5255] opacity-30" : "bg-[#B42D2D]"}`}
          onPress={onDiscard}
          disabled={discardCountdown > 0}
        >
          <Text className="font-inter font-semibold text-white">
            {discardCountdown > 0
              ? `Discard (0:${discardCountdown.toString().padStart(2, "0")})`
              : "Discard"}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
