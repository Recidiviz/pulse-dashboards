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

import { AUDIO_FORMATS } from "~@meetings/config";

import { useUploadSegment } from "../entities/upload-segment/hooks/useUploadSegment";
import { useMeetingActions } from "./useMeetingActions";
import { MeetingEventType, OfflineEvent } from "./useMeetingEventQueue";

export type EventProcessResult =
  | { status: "success" }
  | { status: "error"; error: Error };

export function useProcessOfflineEvent() {
  const { createMeeting, endMeeting, discardMeeting, updateNotes } =
    useMeetingActions();
  const uploadSegment = useUploadSegment();

  const processEvent = async (
    event: OfflineEvent,
  ): Promise<EventProcessResult> => {
    try {
      switch (event.type) {
        case MeetingEventType.Created: {
          if (!event.personId || !event.personType) break;

          await createMeeting({
            personId: event.personId,
            personType: event.personType,
            meetingId: event.meetingId,
            startTime: event.startTime,
          });
          break;
        }

        case MeetingEventType.Ended: {
          // Resolve upload URI: native stores a file URI, web stores a Blob.
          let uploadUri: string | undefined = event.audioUri;
          let blobUrl: string | undefined;

          if (!uploadUri && event.audioBlob) {
            blobUrl = URL.createObjectURL(event.audioBlob);
            uploadUri = blobUrl;
          }

          if (uploadUri) {
            // TODO(#12776): currently we use offline mode for recording only,
            // where we have static formats for web and mobile.
            // We will need to use dynamic formats for the upload audio feature
            const audioFormat = Platform.OS === "web" ? "webm" : "m4a";
            const { contentType, extension } = AUDIO_FORMATS[audioFormat];

            await uploadSegment({
              uri: uploadUri,
              meetingId: event.meetingId,
              contentType,
              fileExtension: extension,
            });
          }

          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }

          if (event.personId && event.personType) {
            await endMeeting({
              meetingId: event.meetingId,
              userNotepadNotes: event.userNotepadNotes,
              personId: event.personId,
              personType: event.personType,
            });
          }
          break;
        }

        case MeetingEventType.Discarded: {
          if (!event.personId || !event.personType) break;
          await discardMeeting({
            meetingId: event.meetingId,
            personId: event.personId,
            personType: event.personType,
          });
          break;
        }

        case MeetingEventType.Edited: {
          await updateNotes({
            meetingId: event.meetingId,
            userNotepadNotes: event.userNotepadNotes,
            actionItems: event.actionItems,
            criticalUpdates: event.criticalUpdates,
            caseNote: event.caseNote,
          });
          break;
        }
      }

      return { status: "success" };
    } catch (error) {
      return { status: "error", error: error as Error };
    }
  };

  return { processEvent };
}
