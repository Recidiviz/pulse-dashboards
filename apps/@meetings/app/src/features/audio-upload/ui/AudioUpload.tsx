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

import { Platform } from "react-native";
import { useWindowDimensions } from "react-native";

import { theme } from "~@meetings/app/shared/config";

import { useAudioUpload } from "../hooks/useAudioUpload";
import { useAudioUploadStore } from "../store";
import { AudioUploadModal } from "./AudioUploadModal";
import { AudioUploadSheet } from "./AudioUploadSheet";
import { DiscardUploadModal } from "./DiscardUploadModal";
import { UploadErrorModal } from "./UploadErrorModal";
import { UploadSuccessModal } from "./UploadSuccessModal";

export function AudioUpload() {
  const { width } = useWindowDimensions();
  const audioUpload = useAudioUpload();
  const status = useAudioUploadStore((s) => s.status);
  const dialog = useAudioUploadStore((s) => s.dialog);

  if (!status) return null;

  const contentHandlers = {
    onAddFile: audioUpload.addFile,
    onRemoveFile: audioUpload.removeFile,
    onConfirm: audioUpload.confirmUpload,
    onCancel: audioUpload.requestCancel,
  };

  const mdBreakpoint = parseInt(theme["screens"]["md"]);

  const isWeb = Platform.OS === "web";
  const isDialogVisible = dialog !== null;

  const isUploadModalVisible =
    isWeb && !isDialogVisible && width >= mdBreakpoint;
  const isBottomSheetVisible = isWeb ? width < mdBreakpoint : true;

  return (
    <>
      {isUploadModalVisible && <AudioUploadModal {...contentHandlers} />}

      {isBottomSheetVisible && <AudioUploadSheet {...contentHandlers} />}

      {dialog === "cancel" && (
        <DiscardUploadModal
          onContinue={audioUpload.continueUpload}
          onDiscard={audioUpload.discardUpload}
        />
      )}

      {dialog === "error" && (
        <UploadErrorModal
          onClose={audioUpload.discardUpload}
          onRetry={audioUpload.confirmUpload}
        />
      )}

      {dialog === "success" && (
        <UploadSuccessModal onClose={audioUpload.closeModal} />
      )}
    </>
  );
}
