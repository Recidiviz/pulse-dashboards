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
  NavigationAction,
  RouteProp,
  useNavigation,
  usePreventRemove,
  useRoute,
} from "@react-navigation/native";
import { useEffect, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import ArrowLeftIcon from "react-native-heroicons/outline/ArrowLeftIcon";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useMeetingDetails,
  useUpdateNotes,
} from "~@meetings/app/entities/meeting";
import { trpc } from "~@meetings/app/shared/api";
import {
  ClientsStackParamList,
  ResidentsStackParamList,
} from "~@meetings/app/shared/config";
import { Button } from "~@meetings/app/shared/ui/Button";
import Loading from "~@meetings/app/shared/ui/Loading";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { LeaveEditingModal } from "./LeaveEditingModal";

type EditCaseNoteRouteProp =
  | RouteProp<ClientsStackParamList, "ClientEditCaseNote">
  | RouteProp<ResidentsStackParamList, "ResidentEditCaseNote">;

export function EditCaseNoteScreen() {
  const route = useRoute<EditCaseNoteRouteProp>();
  const { meetingId } = route.params;
  const { data: meetingDetails, isLoading } = useMeetingDetails(meetingId);

  if (isLoading) return <Loading message="Loading..." />;
  if (!meetingDetails) return null;

  return (
    <CaseNoteEditor
      meetingId={meetingId}
      initialNote={meetingDetails.caseNote || ""}
    />
  );
}

type CaseNoteEditorProps = {
  meetingId: string;
  initialNote: string;
};

function CaseNoteEditor({ meetingId, initialNote }: CaseNoteEditorProps) {
  const navigation = useNavigation();
  const utils = trpc.useUtils();
  const { showSnackbar } = useSnackbar();
  const [draft, setDraft] = useState(initialNote);
  const [isSaved, setIsSaved] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] =
    useState<NavigationAction | null>(null);
  const updateNotesMutation = useUpdateNotes({
    onSuccess: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId });
      showSnackbar("Case note changes saved", 6000);
      setIsSaved(true);
    },
  });

  const isDirty = draft !== initialNote;

  usePreventRemove(isDirty && !isSaved, ({ data }) => {
    setPendingLeaveAction(data.action);
  });

  useEffect(() => {
    if (isSaved) navigation.goBack();
  }, [isSaved, navigation]);

  const handleSave = () => {
    updateNotesMutation.mutate({ meetingId, caseNote: draft });
  };

  const handleLeave = () => {
    if (pendingLeaveAction) navigation.dispatch(pendingLeaveAction);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View className="flex-1 px-4">
          <View className="h-16 flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
            >
              <ArrowLeftIcon className="text-muted" />
            </TouchableOpacity>
          </View>
          <Typography variant="heading-2">Edit draft case note</Typography>
          <Typography variant="body-s-regular">
            Place your cursor where you want to start typing
          </Typography>
          <TextInput
            className="mt-6 flex-1 text-base leading-6 tracking-[-0.32px] text-primary"
            value={draft}
            onChangeText={setDraft}
            textAlignVertical="top"
            multiline
            autoFocus
          />
          <Button
            variant="primary"
            onPress={handleSave}
            loading={updateNotesMutation.isPending}
            disabled={!isDirty}
            className="my-4 py-3"
          >
            Save
          </Button>
        </View>
      </KeyboardAvoidingView>
      {pendingLeaveAction && (
        <LeaveEditingModal
          onLeave={handleLeave}
          onStay={() => setPendingLeaveAction(null)}
        />
      )}
    </SafeAreaView>
  );
}
