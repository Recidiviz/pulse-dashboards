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

import { useState } from "react";
import { Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { StatusBadge } from "~@meetings/app/admin/ui/StatusBadge";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { GRADING_CLARIFICATIONS, GRADING_SCALE } from "../lib/gradingScale";

function GradingScaleModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      visible
      transparent
      onClickOutside={onClose}
      containerClassName="w-[720px] max-w-full max-h-[84vh]"
    >
      <View className="gap-4 px-6 py-5">
        <View className="flex-row items-start justify-between gap-3">
          <Typography variant="heading-4">Grading scale</Typography>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
          >
            <XIcon className="size-4 stroke-tertiary" />
          </TouchableOpacity>
        </View>
        <ScrollView className="max-h-[70vh]">
          <View className="gap-3.5">
            {GRADING_SCALE.map(({ grade, tone, text }) => (
              <View key={grade} className="gap-1.5">
                <StatusBadge tone={tone} className="self-start">
                  {grade}
                </StatusBadge>
                <Typography variant="body-s-regular">{text}</Typography>
              </View>
            ))}
            <View className="gap-2 border-t border-subtle pt-3.5">
              <Typography variant="body-s-medium">
                Specific notes and clarifications
              </Typography>
              {GRADING_CLARIFICATIONS.map((item) => (
                <View key={item} className="flex-row gap-2">
                  <Typography variant="body-s-regular">•</Typography>
                  <Typography variant="body-s-regular" className="flex-1">
                    {item}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** A link that opens the Label Studio grading scale in a modal. */
export function GradingScaleLink({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className="self-start"
      >
        <Typography variant="body-s-medium" className="!text-brand">
          {label}
        </Typography>
      </Pressable>
      {open && <GradingScaleModal onClose={() => setOpen(false)} />}
    </>
  );
}
