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

import { usePlatform } from "./usePlatform";

type CalculatePersonCardHeightParams = {
  hasActiveMeeting: boolean;
  hasLastMeeting: boolean;
};

const PERSON_CARD_ITEM_HEIGHT_MOBILE = 60;
const PERSON_CARD_ITEM_HEIGHT_DESKTOP = 68;
const PERSON_CARD_ITEM_ACTIVE_MEETING_HEIGHT_MOBILE = 112;
const PERSON_CARD_ITEM_ACTIVE_MEETING_HEIGHT_DESKTOP = 126;
const PERSON_CARD_ITEM_LAST_MEETING_HEIGHT_DESKTOP = 184;
const PERSON_CARD_ITEM_LAST_MEETING_HEIGHT_MOBILE = 164;

type CalculateMeetingCardHeightParams = {
  isProcessing: boolean;
  hasNote: boolean;
};

const MEETING_CARD_ITEM_HEIGHT_DESKTOP = 68;
const MEETING_CARD_ITEM_HEIGHT_MOBILE = 62;
const MEETING_CARD_ITEM_PROCESSING_HEIGHT_DESKTOP = 148;
const MEETING_CARD_ITEM_PROCESSING_HEIGHT_MOBILE = 128;
const MEETING_CARD_ITEM_WITH_NOTE_HEIGHT_MOBILE = 172;
const MEETING_CARD_ITEM_WITH_NOTE_HEIGHT_DESKTOP = 196;
// Waiting for design decision
// const MEETING_CARD_ITEM_WITHOUT_NOTE_HEIGHT_DESKTOP = 144;
// const MEETING_CARD_ITEM_WITHOUT_NOTE_HEIGHT_MOBILE = 128;

export function useListItemHeight() {
  const { isWeb } = usePlatform();

  const calculatePersonItemHeight = ({
    hasActiveMeeting,
    hasLastMeeting,
  }: CalculatePersonCardHeightParams) => {
    if (hasActiveMeeting)
      return isWeb
        ? PERSON_CARD_ITEM_ACTIVE_MEETING_HEIGHT_DESKTOP
        : PERSON_CARD_ITEM_ACTIVE_MEETING_HEIGHT_MOBILE;
    if (hasLastMeeting)
      return isWeb
        ? PERSON_CARD_ITEM_LAST_MEETING_HEIGHT_DESKTOP
        : PERSON_CARD_ITEM_LAST_MEETING_HEIGHT_MOBILE;
    return isWeb
      ? PERSON_CARD_ITEM_HEIGHT_DESKTOP
      : PERSON_CARD_ITEM_HEIGHT_MOBILE;
  };

  const calculateMeetingItemHeight = ({
    isProcessing,
    hasNote,
  }: CalculateMeetingCardHeightParams) => {
    if (isProcessing)
      return isWeb
        ? MEETING_CARD_ITEM_PROCESSING_HEIGHT_DESKTOP
        : MEETING_CARD_ITEM_PROCESSING_HEIGHT_MOBILE;
    // Waiting for design decision
    // if (hasNotNote)
    //   return isWeb
    //     ? MEETING_CARD_ITEM_WITHOUT_NOTE_HEIGHT_DESKTOP
    //     : MEETING_CARD_ITEM_WITHOUT_NOTE_HEIGHT_MOBILE;
    if (hasNote)
      return isWeb
        ? MEETING_CARD_ITEM_WITH_NOTE_HEIGHT_DESKTOP
        : MEETING_CARD_ITEM_WITH_NOTE_HEIGHT_MOBILE;
    return isWeb
      ? MEETING_CARD_ITEM_HEIGHT_DESKTOP
      : MEETING_CARD_ITEM_HEIGHT_MOBILE;
  };

  return { calculatePersonItemHeight, calculateMeetingItemHeight };
}
