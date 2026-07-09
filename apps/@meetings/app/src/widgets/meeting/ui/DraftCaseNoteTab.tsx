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
import { debounce } from "lodash";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import DocumentDuplicateIcon from "react-native-heroicons/solid/DocumentDuplicateIcon";

import { useUpdateNotes } from "~@meetings/app/entities/meeting";
import { useAnalytics } from "~@meetings/app/shared/analytics";
import { trpc } from "~@meetings/app/shared/api";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  meetingId: string;
  caseNote: string;
  personId: string;
  outputVote?: ReactNode;
};

const DraftCaseNoteTab = ({
  meetingId,
  caseNote,
  personId,
  outputVote,
}: Props) => {
  const { track } = useAnalytics();
  const utils = trpc.useUtils();
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();
  const [inputNotes, setInputNotes] = useState(caseNote);
  const [inputHeight, setInputHeight] = useState(0);
  const updateNotesMutation = useUpdateNotes({
    onSuccess: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId });
      showSnackbar("Case note changes saved", 6000);
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((nextValue) => {
      updateNotesMutation.mutate({ meetingId, caseNote: nextValue });
    }, 5000),
    [],
  );

  const handleChange = (newValue: string) => {
    setInputNotes(newValue);
    debouncedSave(newValue);
  };

  const onCopy = () => {
    Clipboard.setString(caseNote);
    showSnackbar("Case note copied to clipboard");
    track("case_notes_copied", { meetingId, personId });
  };

  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  return (
    <View className="flex-1 gap-3 pb-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Typography className="text-xl font-semibold text-primary">
            Draft case note
          </Typography>
          <Typography className="text-sm text-secondary">
            Place your cursor where you want to start typing
          </Typography>
        </View>
        <View className="flex-row items-center gap-4">
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
      <ScrollView className="flex-1">
        <TextInput
          style={{
            outlineColor: "transparent",
            minHeight: inputHeight,
            overflow: "hidden",
          }}
          className="text-base leading-6 tracking-[-0.32px] text-primary"
          value={inputNotes}
          onChangeText={handleChange}
          onContentSizeChange={(e) =>
            setInputHeight(e.nativeEvent.contentSize.height)
          }
          textAlignVertical="top"
          scrollEnabled={false}
          multiline
        />
        {outputVote}
      </ScrollView>
    </View>
  );
};

export default DraftCaseNoteTab;
