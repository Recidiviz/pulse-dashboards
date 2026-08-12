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

import NotesSvg from "~@meetings/app/shared/assets/icons/notes.svg";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { NOTEPAD_DESCRIPTION } from "../lib/notepad";

type Props = {
  note: string;
  onPress: () => void;
};

export function NotepadCard({ note, onPress }: Props) {
  const hasNote = note.trim().length > 0;

  return (
    <View className="gap-3 rounded-2xl bg-primary p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <NotesSvg className="size-5 stroke-primary" />
          <Typography variant="body-m-medium">Notepad</Typography>
        </View>
        <TouchableOpacity
          onPress={onPress}
          className="rounded-full bg-screen px-3 py-1.5"
        >
          <Typography variant="button-m">
            {hasNote ? "Edit notes" : "Add notes"}
          </Typography>
        </TouchableOpacity>
      </View>

      <Typography
        variant="body-s-regular"
        numberOfLines={3}
        className={hasNote ? "text-primary" : undefined}
      >
        {hasNote ? note : NOTEPAD_DESCRIPTION}
      </Typography>
    </View>
  );
}
