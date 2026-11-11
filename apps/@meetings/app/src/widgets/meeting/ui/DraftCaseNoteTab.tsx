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
import { View } from "react-native";
import DocumentDuplicateIcon from "react-native-heroicons/solid/DocumentDuplicateIcon";
import PencilIcon from "react-native-heroicons/solid/PencilIcon";

import {
  MeetingDetails,
  useUpdateNotes,
} from "~@meetings/app/entities/meeting";
import { useUserContext } from "~@meetings/app/entities/user";
import { ReviewBeforeCopyModal } from "~@meetings/app/features/meeting-section-approval";
import { useAnalytics } from "~@meetings/app/shared/analytics";
import { trpc } from "~@meetings/app/shared/api";
import { Button } from "~@meetings/app/shared/ui/Button";
import { FadeContainer } from "~@meetings/app/shared/ui/FadeContainer";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { TextInput } from "~@meetings/app/shared/ui/TextInput";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { getFlaggedSections } from "../lib/getFlaggedSections";
import { useCaseNoteTyping } from "../model/useCaseNoteTyping";
import { AiGeneratedIndicator } from "./AiGeneratedIndicator";
import { FlaggedOutputBanner } from "./FlaggedOutputBanner";
import { NotepadNotesSection } from "./NotepadNotesSection";
import { UneditedCaseNoteModal } from "./UneditedCaseNoteModal";

type Props = {
  meetingDetails: MeetingDetails;
  personId: string;
  outputVote?: ReactNode;
  canEdit?: boolean;
  onEdit?: () => void;
  // Holds the typing animation back
  isRevealBlocked?: boolean;
  isProcessing?: boolean;
};

const DraftCaseNoteTab = ({
  meetingDetails,
  personId,
  outputVote,
  canEdit = false,
  onEdit,
  isRevealBlocked = false,
  isProcessing = false,
}: Props) => {
  const { track } = useAnalytics();
  const utils = trpc.useUtils();
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();
  const { email: currentUserEmail, isSkipAuthUser } = useUserContext();

  const meetingId = meetingDetails.id;
  const caseNote = meetingDetails.caseNote || "";
  const notepadNotes = meetingDetails.userNotepadNotes;
  const isApproved = meetingDetails.approvals.caseNote.isApproved;
  const isMeetingCreator =
    currentUserEmail?.toLowerCase() ===
      meetingDetails.staffEmail.toLowerCase() || isSkipAuthUser;

  const [inputNotes, setInputNotes] = useState(caseNote);
  const [inputHeight, setInputHeight] = useState(0);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [isUneditedModalVisible, setIsUneditedModalVisible] = useState(false);
  const { isPending, isTyping, visibleText } = useCaseNoteTyping({
    meetingId,
    caseNote,
    animation: {
      pipelineRunId: meetingDetails.notetakingPipelineRunId,
      meetingStartTime: meetingDetails.startTime,
      isRead:
        !!meetingDetails.caseNoteEditedAt ||
        meetingDetails.approvals.caseNote.isApproved,
      isBlocked: isRevealBlocked,
    },
  });
  const isNoteShown = !isPending && !isTyping;
  const isEditable = canEdit && isNoteShown && !isProcessing;
  const { isBannerShown, needsEdit } =
    getFlaggedSections(meetingDetails).caseNote;
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
    if (needsEdit) {
      setIsUneditedModalVisible(true);
    } else if (isApproved) {
      copyToClipboard();
    } else {
      setIsReviewModalVisible(true);
    }
  };

  const handleCopyAnyway = () => {
    setIsReviewModalVisible(false);
    copyToClipboard();
  };

  const handleEditDraft = () => {
    setIsUneditedModalVisible(false);
    onEdit?.();
  };

  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  return (
    <View className="flex-1 gap-3 pb-4">
      {notepadNotes?.trim() && (
        <View className="mb-5">
          <NotepadNotesSection notes={notepadNotes} />
        </View>
      )}
      <View className="flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center gap-1.5">
            <Typography variant="heading-4">Draft Case Note</Typography>
            <AiGeneratedIndicator />
          </View>
          {isEditable && (
            <Typography variant="body-s-regular">
              Place your cursor where you want to start typing
            </Typography>
          )}
        </View>
        {onEdit && (
          <Button
            variant="secondary"
            icon={{ icon: PencilIcon, className: "size-4" }}
            onPress={onEdit}
          >
            Edit
          </Button>
        )}
      </View>
      <FadeContainer isVisible={isBannerShown && !isPending}>
        <FlaggedOutputBanner
          section="caseNote"
          staffEmail={meetingDetails.staffEmail}
          editedAt={meetingDetails.caseNoteEditedAt}
        />
      </FadeContainer>
      <View className="flex-1">
        {!isPending && (
          <TextInput
            variant={isEditable ? "outlined" : "outlined-static"}
            style={{ minHeight: inputHeight }}
            className="overflow-hidden text-base leading-6 tracking-[-0.32px] text-primary outline-none"
            value={isTyping ? `${visibleText}|` : inputNotes}
            onChangeText={isEditable ? handleChange : undefined}
            onContentSizeChange={(e) =>
              setInputHeight(e.nativeEvent.contentSize.height)
            }
            textAlignVertical="top"
            scrollEnabled={false}
            readOnly={!isEditable}
            multiline
          />
        )}
        {isNoteShown && (
          <Button
            variant="secondary"
            icon={{ icon: DocumentDuplicateIcon }}
            disabled={isSnackbarShowing}
            onPress={onCopy}
            className="mt-6 self-start px-6"
          >
            Copy to Clipboard
          </Button>
        )}
        {isNoteShown && outputVote}
      </View>
      {isReviewModalVisible && (
        <ReviewBeforeCopyModal
          onClose={() => setIsReviewModalVisible(false)}
          onConfirm={handleCopyAnyway}
          isMeetingCreator={isMeetingCreator}
          action="copy"
        />
      )}
      {isUneditedModalVisible && (
        <UneditedCaseNoteModal
          onClose={() => setIsUneditedModalVisible(false)}
          onEdit={handleEditDraft}
        />
      )}
    </View>
  );
};

export default DraftCaseNoteTab;
