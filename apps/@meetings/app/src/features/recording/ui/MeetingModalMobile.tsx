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

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppStackParamList } from "../../../shared/config";
import { useRecording } from "../model";
import { DiscardMeetingModal } from "./DiscardMeetingModal";
import { EndMeetingModal } from "./EndMeetingModal";

export function MeetingModalMobile() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const {
    status,
    person,
    personType,
    meetingId,
    togglePauseResume,
    handleFinishAndSave,
    handleFinalDiscard,
  } = useRecording<"native">();

  const isRecordingViewOpened = meetingId && person;

  if (!isRecordingViewOpened) return null;

  const navigateToProfile = () => {
    if (personType === "client") {
      navigation.navigate("Main", {
        screen: "ClientsRoot",
        params: {
          screen: "ClientProfile",
          params: { personId: person.personId.toString() },
        },
      });
    } else {
      navigation.navigate("Main", {
        screen: "ResidentsRoot",
        params: {
          screen: "ResidentProfile",
          params: { personId: person.personId.toString() },
        },
      });
    }
  };

  return (
    <>
      {status === "stopping" && (
        <EndMeetingModal
          person={person}
          onContinue={togglePauseResume}
          onFinishAndSave={() => handleFinishAndSave(navigateToProfile)}
        />
      )}
      {status === "discarding" && (
        <DiscardMeetingModal
          person={person}
          onContinue={togglePauseResume}
          onDiscard={() => handleFinalDiscard(navigateToProfile)}
        />
      )}
    </>
  );
}
