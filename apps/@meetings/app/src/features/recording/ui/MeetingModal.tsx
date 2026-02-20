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

import { Person } from "~@meetings/app/common/types";

import { useMeetingRecording } from "../hooks/useMeetingRecording";
import { useRecording } from "../model";
import { DiscardMeetingModal } from "./DiscardMeetingModal";
import { EndMeetingModal } from "./EndMeetingModal";
import { MeetingFullSizeModal } from "./MeetingFullSizeModal";
import { MeetingMinimizedModal } from "./MeetingMinimizedModal";

function MeetingModalContainer() {
  const { meetingId, person } = useRecording<"web">();

  if (!meetingId || !person) return null;

  return <MeetingModal meetingId={meetingId} person={person} />;
}

type MeetingModalProps = {
  meetingId: string;
  person: Person;
};

function MeetingModal({ meetingId, person }: MeetingModalProps) {
  const { status, closeRecordingView, isRecordingViewMinimized } =
    useRecording<"web">();

  // TODO: we can move isRecordingViewOpened into the state,
  // but we need to know what will make it as true on mobile
  const isRecordingViewOpened = meetingId && person;

  // TODO: get rid of this hook in following releases, move all the functionality into models
  const meetingRecording = useMeetingRecording({
    meetingId,
    onComplete: closeRecordingView,
    personId: person.personId,
  });

  if (!isRecordingViewOpened) return null;

  return (
    <>
      {isRecordingViewMinimized ? (
        <MeetingMinimizedModal
          person={person}
          totalDurationMs={meetingRecording.totalDurationMs}
          onStop={meetingRecording.actions.handleStopRecording}
          onPauseResume={meetingRecording.actions.handleTogglePauseResume}
          onDiscard={meetingRecording.actions.handleDiscard}
        />
      ) : (
        <MeetingFullSizeModal
          person={person}
          meetingRecording={meetingRecording}
        />
      )}
      {status === "stopping" && (
        <EndMeetingModal
          person={person}
          onContinue={meetingRecording.actions.handleContinue}
          onFinishAndSave={meetingRecording.actions.handleFinishAndSave}
        />
      )}
      {status === "discarding" && (
        <DiscardMeetingModal
          person={person}
          onContinue={meetingRecording.actions.handleContinue}
          onDiscard={meetingRecording.actions.handleFinalDiscard}
        />
      )}
    </>
  );
}

export { MeetingModalContainer as MeetingModal };
