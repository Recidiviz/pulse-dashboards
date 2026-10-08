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

import Clipboard from "@react-native-clipboard/clipboard";
import { View } from "react-native";
import LockClosedIcon from "react-native-heroicons/outline/LockClosedIcon";
import DocumentDuplicateIcon from "react-native-heroicons/solid/DocumentDuplicateIcon";

import { Button } from "~@meetings/app/shared/ui/Button";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Tooltip } from "~@meetings/app/shared/ui/Tooltip";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  notes: string;
};

export const NotepadNotesSection = ({ notes }: Props) => {
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  const onCopy = () => {
    Clipboard.setString(notes);
    showSnackbar("Notepad notes copied to clipboard");
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Typography variant="heading-4">Your notepad notes</Typography>
          <Tooltip
            content={
              <Typography variant="body-s-regular" className="!text-on-brand">
                The notes you took during the session can't be edited here — the
                draft case note is generated from them, so changing them after
                the fact could make the two fall out of sync.
              </Typography>
            }
          >
            <LockClosedIcon className="stroke-tertiary" size={16} />
          </Tooltip>
        </View>
        <Button
          variant="secondary"
          icon={{
            icon: DocumentDuplicateIcon,
            className: "size-4 stroke-none",
          }}
          disabled={isSnackbarShowing}
          onPress={onCopy}
        >
          Copy
        </Button>
      </View>
      <Typography variant="body-m-regular" className="leading-6">
        {notes}
      </Typography>
    </View>
  );
};
