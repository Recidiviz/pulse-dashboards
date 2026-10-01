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

import { ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { MeetingSidebar, MeetingSidebarProps } from "./MeetingSidebar";

type Props = {
  titleAccessory?: ReactNode;
  onClose: () => void;
  sidebarProps: MeetingSidebarProps;
  children: ReactNode;
};

export function MeetingModalLayout({
  titleAccessory,
  onClose,
  sidebarProps,
  children,
}: Props) {
  return (
    <Modal
      visible
      transparent
      onClickOutside={onClose}
      containerClassName="max-w-[1080px] md:h-[720px] size-full"
    >
      <View className="h-full flex-1 grow md:h-auto">
        <View className="w-full flex-row items-center justify-between border-b border-subtle px-8 py-5">
          <View className="flex-row items-center gap-3">
            <Typography variant="heading-2">New Meeting</Typography>
            {titleAccessory}
          </View>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
            <XIcon className="size-6 stroke-secondary" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 grow flex-row">
          <MeetingSidebar {...sidebarProps} />
          <View className="flex-1">{children}</View>
        </View>
      </View>
    </Modal>
  );
}
