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
import { useEffect, useState } from "react";
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import DocumentDuplicateIcon from "react-native-heroicons/solid/DocumentDuplicateIcon";
import PencilIcon from "react-native-heroicons/solid/PencilIcon";

import { theme } from "../common/theme";
import { useSnackbar } from "../shared/ui/Snackbar";
import { Typography } from "../shared/ui/Typography";
import { EditDraftCaseNoteModal } from "./EditDraftCaseNoteModal";

type Props = {
  meetingId: string;
  caseNote: string;
};

const DraftCaseNoteTab = ({ meetingId, caseNote }: Props) => {
  const { width } = useWindowDimensions();
  const [isEditing, setIsEditing] = useState(false);
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  const lgBreakpoint = parseInt(theme["screens"]["lg"]);
  const isDesktop = width >= lgBreakpoint;

  useEffect(() => {
    setIsEditing(false);
  }, [isDesktop]);

  const onCopy = () => {
    Clipboard.setString(caseNote);
    showSnackbar("Case note copied to clipboard");
  };

  return (
    <>
      <View className="flex-1 gap-3 pb-4">
        <View className="flex-row items-center justify-between">
          <Typography className="text-xl font-semibold text-primary">
            Draft case note
          </Typography>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="hidden flex-row items-center gap-1 rounded-full bg-secondary px-3 py-2 lg:flex"
            >
              <PencilIcon className="size-4 fill-tertiary stroke-[2px]" />
              <Typography className="text-sm font-medium text-primary">
                Edit
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCopy}
              disabled={isSnackbarShowing}
              className="flex-row items-center gap-1 rounded-full bg-secondary px-3 py-2"
            >
              <DocumentDuplicateIcon className="size-4 fill-tertiary stroke-[3px]" />
              <Typography className="text-sm font-medium text-primary">
                Copy
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
        <Typography className="text-base leading-6 tracking-[-0.32px] text-primary">
          {caseNote}
        </Typography>
      </View>
      {isEditing && (
        <EditDraftCaseNoteModal
          caseNote={caseNote}
          meetingId={meetingId}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
};

export default DraftCaseNoteTab;
