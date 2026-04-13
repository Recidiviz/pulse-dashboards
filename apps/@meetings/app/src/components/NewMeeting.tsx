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

import {
  ActivityIndicator,
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NotesSvg from "../assets/icons/notes.svg";
import { Person, PersonType } from "../common/types";
import { MeetingControlsMobile, useRecording } from "../features/recording";
import { Typography } from "../shared/ui/Typography";
import Header from "./Header";

type Props = {
  person: Person;
  personType: PersonType;
  navigateToPersonProfile: () => void;
};

const NewMeeting = ({ person, personType, navigateToPersonProfile }: Props) => {
  const insets = useSafeAreaInsets();

  const {
    status,
    note,
    setNote,
    isRecording,
    setMeetingId,
    setPerson,
    handleFinalDiscard,
  } = useRecording<"native">();

  const isMeetingActive = status !== "idle" || isRecording;

  if (!status) return null;

  if (status === "ending") {
    return (
      <View className="flex-1 flex-row items-center justify-center bg-primary">
        <ActivityIndicator size="small" color="text-primary" />
        <Typography className="p-4 text-lg font-medium text-primary">
          Meeting ending...
        </Typography>
      </View>
    );
  }

  const handleGoBack = () => {
    if (!isMeetingActive) {
      handleFinalDiscard(() => {
        setMeetingId(null);
        setPerson(null);
      });
    }
    navigateToPersonProfile();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-secondary" style={{ marginTop: -insets.top }}>
        <Header showDrawer={false} showGoBack={true} onGoBack={handleGoBack} />
        <View className="rounded-b-3xl bg-primary">
          <View className="flex flex-col gap-1 p-4 md:px-0 md:pt-0">
            <Typography className="text-base text-primary">
              {person.fullName.toUpperCase()}
            </Typography>
            <Typography className="font-libre-baskerville text-3xl font-semibold text-primary">
              New Meeting
            </Typography>
            <Typography className="text-base text-secondary">
              ID: {person.displayPersonExternalId} • {person.primaryMetadata}
            </Typography>
          </View>
        </View>
        <View className="flex-1 bg-secondary px-6">
          <View className="mt-6">
            <View className="mb-2 flex-row items-center">
              <NotesSvg className="size-5 text-secondary" />
              <Typography className="ml-2 text-lg font-semibold text-primary">
                Notepad
              </Typography>
            </View>

            <TextInput
              className="h-full text-primary"
              value={note}
              onChangeText={setNote}
              placeholder="Write your notes..."
              maxLength={100000}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
        <MeetingControlsMobile />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default NewMeeting;
