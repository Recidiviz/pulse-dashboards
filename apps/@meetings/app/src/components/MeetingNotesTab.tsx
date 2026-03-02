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

import { useEffect, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { MinuteSection } from "~@meetings/trpc-types";

import Icons from "../../assets/icons";
import { MeetingDetails } from "../common/types";
import { trpc } from "../trpc/client";
import { copyMeetingNotes } from "../utils/copyMeetingNotes";
import { useSnackbar } from "./Snackbar";

type Props = {
  meetingDetails: MeetingDetails;
  onMeetingNotesSheetOpen?: () => void;
};

// Reusable section container
const SectionContainer = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="flex flex-col gap-2">
    <Text className="font-inter text-base font-semibold text-primary">
      {title}
    </Text>
    {children}
  </View>
);

type ListEditorProps = {
  isEditing: boolean;
  values: string[];
  setValues: (newValues: string[]) => void;
};

const ListEditor = ({ isEditing, values, setValues }: ListEditorProps) => {
  const textValue = values.join("\n");

  const onChangeText = (text: string) => {
    if (text) setValues(text.split("\n"));
    else setValues([]);
  };

  // Shared font styles to ensure perfect alignment between Input and Mirror
  const fontStyles = "font-inter text-base leading-[22px]";

  const mirrorValues = values.length > 0 ? values : [""];

  return (
    <View className="gap-1">
      {/* READ ONLY VIEW */}
      {!isEditing && (
        <View>
          {values.length > 0 ? (
            values.map((item, index) => (
              <View key={index} className="flex-row">
                <Text className={`mr-2 text-[#9AA6AC] ${fontStyles}`}>•</Text>
                <Text className={`text-primary ${fontStyles}`}>{item}</Text>
              </View>
            ))
          ) : (
            <Text className={`py-1 text-primary ${fontStyles}`}>
              No data for this meeting.
            </Text>
          )}
        </View>
      )}

      {/* EDITING VIEW */}
      {isEditing && (
        <View className="relative w-full rounded-lg border border-[#35536233] bg-[#F4F5F5] focus-within:border-[#00665F] focus-within:outline focus-within:outline-2 focus-within:outline-[#00665F33]">
          {/* LAYER 1: THE MIRROR (Renders bullets + Invisible Text) */}
          {/* This layer sits behind the input. It draws the bullets. 
              The text is invisible, but pushes the bullets to the correct height if lines wrap. */}
          <View className="pointer-events-none absolute inset-0 select-none px-2 py-1">
            {mirrorValues.map((line, index) => (
              <View key={index} className="flex-row">
                <Text className={`mr-2 text-[#9AA6AC] ${fontStyles}`}>•</Text>
                {/* The Ghost Text - Ensures layout matches the Input exactly */}
                <Text className={`invisible ${fontStyles}`}>
                  {/* Zero-width space ensures empty lines still have height */}
                  {line || "\u200B"}
                </Text>
              </View>
            ))}
          </View>

          {/* LAYER 2: THE INPUT (Renders Text) */}
          {/* The text is visible. The background is transparent to see the layer below. */}
          <TextInput
            className={`w-full py-1 pl-7 pr-2 text-primary outline-none ${fontStyles}`}
            // @ts-expect-error - fieldSizing is web-only for auto-resize
            style={{ fieldSizing: "content" }}
            value={textValue}
            onChangeText={onChangeText}
            multiline
          />
        </View>
      )}
    </View>
  );
};

// Meeting Minutes List Component
const MeetingMinutesList = ({ sections }: { sections: MinuteSection[] }) => {
  if (sections.length === 0) {
    return (
      <Text className="font-inter text-base leading-[22px] text-primary">
        No summary for this meeting.
      </Text>
    );
  }

  return (
    <View className="flex flex-col">
      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex}>
          <View className="flex flex-col gap-2 py-3">
            <Text className="font-inter text-base font-semibold text-primary">
              {section.title}
            </Text>
            <View className="flex flex-col gap-2">
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} className="flex flex-row gap-2">
                  {item.timestamp && (
                    <Text className="font-inter text-sm text-[#355362]">
                      {item.timestamp}
                    </Text>
                  )}
                  <View className="flex-1 flex-col gap-1">
                    <Text className="font-inter text-base leading-[22px] text-primary">
                      {item.content}
                    </Text>
                    {item.status !== "Discussed" && (
                      <Text className="font-inter text-xs font-medium text-[#00665F]">
                        {item.status}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
          {sectionIndex < sections.length - 1 && (
            <View className="h-px bg-[#35536226]" />
          )}
        </View>
      ))}
    </View>
  );
};

type MeetingNotesControlsProps = {
  isEditing: boolean;
  onSave: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onCopyNotes: () => void;
  onMeetingNotesSheetOpen?: () => void;
};

const MeetingNotesControls = ({
  isEditing,
  onSave,
  onCancelEdit,
  onStartEdit,
  onCopyNotes,
  onMeetingNotesSheetOpen,
}: MeetingNotesControlsProps) => {
  return (
    <>
      <View className="hidden lg:flex print:hidden">
        {isEditing ? (
          <View className="w-full flex-row justify-end gap-3">
            <TouchableOpacity
              className="flex-row items-center gap-2 rounded-full border border-[#35536233] px-5 py-3"
              onPress={onCancelEdit}
            >
              <Text className="text-left font-inter text-base font-semibold text-primary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-2 rounded-full bg-[#006C67] px-5 py-3"
              onPress={onSave}
            >
              <Text className="text-left font-inter text-base font-semibold text-white">
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row gap-10 py-2">
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={onStartEdit}
            >
              <Image
                source={Icons.Edit}
                className="!size-4"
                resizeMode="contain"
              />
              <Text className="text-left font-inter text-base text-primary">
                Edit Notes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="hidden flex-row items-center gap-2 lg:flex"
              onPress={onCopyNotes}
            >
              <Image
                source={Icons.Copy}
                className="!size-4"
                resizeMode="contain"
              />
              <Text className="text-left font-inter text-base text-primary">
                Copy
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <TouchableOpacity
        className="flex-row items-center gap-2 lg:hidden print:hidden"
        onPress={onMeetingNotesSheetOpen}
      >
        <Image source={Icons.Edit} className="!size-4" resizeMode="contain" />
        <Text className="text-left font-inter text-base text-primary">
          Edit Notes
        </Text>
      </TouchableOpacity>
    </>
  );
};

const MeetingNotesTab = ({
  meetingDetails,
  onMeetingNotesSheetOpen,
}: Props) => {
  const utils = trpc.useUtils();
  const { showSnackbar } = useSnackbar();
  const [isEditing, setIsEditing] = useState(false);
  const [actionItems, setActionItems] = useState(
    meetingDetails.actionItems || [],
  );
  const [criticalUpdates, setCriticalUpdates] = useState(
    meetingDetails.criticalUpdates || [],
  );

  useEffect(() => {
    setActionItems(meetingDetails.actionItems || []);
    setCriticalUpdates(meetingDetails.criticalUpdates || []);
  }, [meetingDetails.actionItems, meetingDetails.criticalUpdates]);

  const updateNotesMutation = trpc.v1.meeting.updateNotes.useMutation({
    onSuccess: () => {
      showSnackbar("Changes saved");
      setIsEditing(false);
      utils.v1.meeting.getDetails.invalidate({ meetingId: meetingDetails.id });
    },
    onError: (err) => {
      showSnackbar("Failed to save changes");
      console.error("[updateNotes] Failed", err);
    },
  });

  const onCopyNotes = () => {
    copyMeetingNotes({
      userNotepadNotes: meetingDetails.userNotepadNotes,
      actionItems: meetingDetails.actionItems,
      criticalUpdates: meetingDetails.criticalUpdates,
      meetingSummary: meetingDetails.meetingSummary,
    });
    showSnackbar("Notes copied to clipboard");
  };

  const onCancelEdit = () => {
    setActionItems(meetingDetails.actionItems || []);
    setCriticalUpdates(meetingDetails.criticalUpdates || []);
    setIsEditing(false);
  };

  const onStartEdit = () => {
    setIsEditing(true);
  };

  const onSave = () => {
    updateNotesMutation.mutate({
      meetingId: meetingDetails.id,
      userNotepadNotes: meetingDetails.userNotepadNotes || "",
      actionItems,
      criticalUpdates,
    });
  };

  return (
    <View className="flex-1 gap-6 pb-4">
      <SectionContainer title="Notes">
        <Text className="font-inter text-base leading-[22px] text-primary">
          {meetingDetails.userNotepadNotes ??
            "No notes taken for this meeting."}
        </Text>
      </SectionContainer>

      <SectionContainer title="Action Items">
        <ListEditor
          isEditing={isEditing}
          values={actionItems}
          setValues={setActionItems}
        />
      </SectionContainer>

      <SectionContainer title="Critical Updates">
        <ListEditor
          isEditing={isEditing}
          values={criticalUpdates}
          setValues={setCriticalUpdates}
        />
      </SectionContainer>

      <SectionContainer title="Meeting Summary">
        {/* TODO: edit meeting summary after we agree about the structure */}
        <MeetingMinutesList sections={meetingDetails.meetingSummary ?? []} />
      </SectionContainer>

      <MeetingNotesControls
        isEditing={isEditing}
        onSave={onSave}
        onCancelEdit={onCancelEdit}
        onStartEdit={onStartEdit}
        onCopyNotes={onCopyNotes}
        onMeetingNotesSheetOpen={onMeetingNotesSheetOpen}
      />
    </View>
  );
};

export default MeetingNotesTab;
