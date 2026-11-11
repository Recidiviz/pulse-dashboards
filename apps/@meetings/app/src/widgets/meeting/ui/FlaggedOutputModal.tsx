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
import ExclamationIcon from "react-native-heroicons/solid/ExclamationIcon";

import type { FlaggedSections } from "~@meetings/app/entities/meeting";
import { Button } from "~@meetings/app/shared/ui/Button";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  flaggedSections: FlaggedSections;
  onAcknowledge: () => void;
};

function getFlaggedSectionsLabel({ caseNote, actionItems }: FlaggedSections) {
  if (caseNote.needsEdit && actionItems.needsEdit)
    return "the draft case note and action items";
  if (actionItems.needsEdit) return "the action items";
  return "the draft case note";
}

export function FlaggedOutputModal({ flaggedSections, onAcknowledge }: Props) {
  return (
    <Modal
      visible
      transparent
      onClickOutside={onAcknowledge}
      containerClassName="w-full max-w-[540px] p-8"
    >
      <TouchableOpacity
        onPress={onAcknowledge}
        accessibilityLabel="Close"
        className="absolute right-3.5 top-3.5 size-7 items-center justify-center"
      >
        <XIcon className="size-5 stroke-tertiary" />
      </TouchableOpacity>

      <View className="mb-3 mr-3 flex-row items-start gap-2.5">
        <ExclamationIcon className="mt-1 size-6 fill-warning" />
        <Typography variant="heading-5">
          This meeting's output could be inaccurate
        </Typography>
      </View>
      <Typography variant="body-s-regular" className="mb-6 mr-9">
        Our systems indicated that {getFlaggedSectionsLabel(flaggedSections)}{" "}
        could have inaccuracies.
      </Typography>

      <Button variant="primary" onPress={onAcknowledge} className="self-center">
        I acknowledge this
      </Button>
    </Modal>
  );
}
