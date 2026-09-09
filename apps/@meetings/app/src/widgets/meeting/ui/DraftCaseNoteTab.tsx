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
import { TextInput, View } from "react-native";
import DocumentDuplicateIcon from "react-native-heroicons/solid/DocumentDuplicateIcon";

import { useUpdateNotes } from "~@meetings/app/entities/meeting";
import { ReviewBeforeCopyModal } from "~@meetings/app/features/meeting-section-approval";
import { useAnalytics } from "~@meetings/app/shared/analytics";
import { trpc } from "~@meetings/app/shared/api";
import { Button } from "~@meetings/app/shared/ui/Button";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  meetingId: string;
  caseNote: string;
  isApproved: boolean;
  isMeetingCreator: boolean;
  personId: string;
  outputVote?: ReactNode;
  canEdit?: boolean;
};

const DraftCaseNoteTab = ({
  meetingId,
  caseNote,
  personId,
  isApproved,
  isMeetingCreator,
  outputVote,
  canEdit = false,
}: Props) => {
  const { track } = useAnalytics();
  const utils = trpc.useUtils();
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();
  const [inputNotes, setInputNotes] = useState(caseNote);
  const [inputHeight, setInputHeight] = useState(0);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
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
    if (!canEdit) return;
    setInputNotes(newValue);
    debouncedSave(newValue);
  };

  const copyToClipboard = () => {
    Clipboard.setString(caseNote);
    showSnackbar("Case note copied to clipboard");
    track("case_notes_copied", { meetingId, personId });
  };

  const onCopy = () => {
    if (isApproved) {
      copyToClipboard();
    } else {
      setIsReviewModalVisible(true);
    }
  };

  const handleCopyAnyway = () => {
    setIsReviewModalVisible(false);
    copyToClipboard();
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
          <Typography variant="heading-4">Draft case note</Typography>
          {canEdit && (
            <Typography variant="body-s-regular">
              Place your cursor where you want to start typing
            </Typography>
          )}
        </View>
        <View className="flex-row items-center gap-4">
          <Button
            variant="secondary"
            icon={{
              icon: DocumentDuplicateIcon,
              className: "size-4 stroke-[3px]",
            }}
            disabled={isSnackbarShowing}
            onPress={onCopy}
          >
            Copy
          </Button>
        </View>
      </View>
      <View className="flex-1">
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
          readOnly={!canEdit}
          multiline
        />
        {outputVote}
      </View>
      {isReviewModalVisible && (
        <ReviewBeforeCopyModal
          onClose={() => setIsReviewModalVisible(false)}
          onConfirm={handleCopyAnyway}
          isMeetingCreator={isMeetingCreator}
          action="copy"
        />
      )}
    </View>
  );
};

export default DraftCaseNoteTab;
