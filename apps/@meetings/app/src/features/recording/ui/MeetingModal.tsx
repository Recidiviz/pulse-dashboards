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

import { useRecording } from "../model";
import { DiscardMeetingModal } from "./DiscardMeetingModal";
import { EndMeetingModal } from "./EndMeetingModal";
import { MeetingFullSizeModal } from "./MeetingFullSizeModal";
import { MeetingMinimizedModal } from "./MeetingMinimizedModal";

export function MeetingModal() {
  const {
    status,
    durationMs,
    person,
    meetingId,
    isRecordingViewMinimized,
    stopRecording,
    togglePauseResume,
    discardRecording,
    handleFinishAndSave,
    handleFinalDiscard,
  } = useRecording<"web">();

  const isRecordingViewOpened = meetingId && person;

  if (!isRecordingViewOpened) return null;

  return (
    <>
      {isRecordingViewMinimized ? (
        <MeetingMinimizedModal
          person={person}
          durationMs={durationMs}
          onStop={stopRecording}
          onPauseResume={togglePauseResume}
          onDiscard={discardRecording}
        />
      ) : (
        <MeetingFullSizeModal person={person} />
      )}
      {status === "stopping" && (
        <EndMeetingModal
          person={person}
          onContinue={togglePauseResume}
          onFinishAndSave={handleFinishAndSave}
        />
      )}
      {status === "discarding" && (
        <DiscardMeetingModal
          person={person}
          onContinue={togglePauseResume}
          onDiscard={handleFinalDiscard}
        />
      )}
    </>
  );
}
