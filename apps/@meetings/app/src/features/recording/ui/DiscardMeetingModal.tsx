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
import { TouchableOpacity, View } from "react-native";

import { Person } from "../../../common/types";
import Modal from "../../../components/Modal";
import { Typography } from "../../../shared/ui/Typography";
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
      <Typography className="mb-3 text-xl font-semibold text-primary">
        Discard meeting?
      </Typography>
      <Typography className="mb-5 w-[350px] text-secondary">
        You’re about to discard the meeting with{" "}
        <Typography className="font-bold text-primary">
          {person.fullName}.
        </Typography>{" "}
        Notes and transcript won't be saved.
      </Typography>
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="w-[170px] items-center rounded-full border border-subtle py-3"
          onPress={onContinue}
        >
          <Typography className="font-semibold text-primary">Cancel</Typography>
        </TouchableOpacity>
        <TouchableOpacity
          className={`w-[170px] items-center rounded-full py-3 ${discardCountdown > 0 ? "bg-disabled" : "bg-attention"}`}
          onPress={onDiscard}
          disabled={discardCountdown > 0}
        >
          <Typography className="font-semibold text-on-brand">
            {discardCountdown > 0
              ? `Discard (0:${discardCountdown.toString().padStart(2, "0")})`
              : "Discard"}
          </Typography>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
