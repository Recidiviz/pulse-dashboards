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

import { Link } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import ClockIcon from "react-native-heroicons/outline/ClockIcon";
import PrinterIcon from "react-native-heroicons/solid/PrinterIcon";

import PlaySvg from "~@meetings/app/shared/assets/icons/play.svg";

import { MeetingDetails } from "../common/types";
import DraftCaseNoteTab from "../components/DraftCaseNoteTab";
import { BulletListTab } from "../components/MeetingDetailTabs";
import MeetingTabs, { Tab } from "../components/MeetingTabs";
import MeetingTranscriptionTab from "../components/MeetingTranscriptionTab";
import StaffFeedbackTab from "../components/StaffFeedbackTab";
import { useUserContext } from "../context/UserContext";
import { MeetingTypeTag } from "../entities/meeting-type";
import { Person, PersonType } from "../entities/person";
import { usePrintMeetingDetails } from "../hooks/usePrintMeetingDetails";
import BgAvatarImage from "../shared/assets/images/bg-avatar.png";
import { getInitials, humanReadableTitleCase } from "../shared/lib/format";
import { Typography } from "../shared/ui/Typography";
import { formatMeetingDuration, formatMeetingStartDate } from "../utils/format";
import { ActionItemsTab } from "./ActionItemsTab";
import AudioPlayer from "./AudioPlayer";
import Header from "./Header";

type Props = {
  meetingId: string;
  meetingDetails: MeetingDetails;
  person: Person;
  personType: PersonType;
  showTranscription?: boolean;
};

const MeetingDesktop = ({
  meetingId,
  meetingDetails,
  person,
  personType,
  showTranscription = false,
}: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DraftCaseNotes);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const { email: currentUserEmail } = useUserContext();
  const isMeetingCreator = currentUserEmail === meetingDetails.staffEmail;

  const meetingDate = meetingDetails.startTime
    ? formatMeetingStartDate(meetingDetails.startTime)
    : "";
  const { time, duration } = formatMeetingDuration({
    startDate: meetingDetails.startTime || null,
    endDate: meetingDetails.endTime || null,
    durationMs: meetingDetails.durationMs,
  });

  const handlePrint = usePrintMeetingDetails({
    person,
    meetingDetails,
    meetingDate,
    time,
    duration,
  });

  return (
    <View className="flex-1 grow">
      <Header />
      <View className="flex-1 grow flex-row border-t border-subtle">
        <View className="w-36 shrink-0 pl-10 pt-12">
          <Link
            className="flex flex-row items-center gap-2"
            screen={
              personType === "client" ? "ClientProfile" : "ResidentProfile"
            }
            params={{ personId: person.personId.toString() }}
          >
            <ChevronLeftIcon className="size-3 stroke-tertiary stroke-[3px]" />
            <Typography className="text-sm font-medium text-primary">
              Back
            </Typography>
          </Link>
        </View>

        <View className="flex-1 pt-8">
          <View className="flex-row items-center gap-3 pr-10">
            <ImageBackground
              source={BgAvatarImage}
              className="size-10 items-center justify-center overflow-hidden rounded-full font-medium"
              imageClassName="!size-full"
            >
              <Typography className="text-base text-on-strong">
                {getInitials(person.fullName)}
              </Typography>
            </ImageBackground>
            <View>
              <Typography className="text-lg font-semibold text-primary">
                {person.fullName}
              </Typography>
              <Typography className="text-base text-secondary">
                ID: {person.displayPersonExternalId} •{" "}
                {humanReadableTitleCase(person.primaryMetadata)}
              </Typography>
            </View>
          </View>

          <View className="flex-row items-start justify-between gap-3 py-6 pr-10">
            <View className="flex-1 gap-3">
              <Typography className="font-libre-baskerville text-3xl font-bold text-primary">
                Meeting: {meetingDate}
              </Typography>
              <View className="flex flex-row items-center gap-1">
                <MeetingTypeTag
                  type={meetingDetails.meetingType}
                  typeCategory={meetingDetails.meetingTypeCategory}
                />
                <ClockIcon className="size-4 stroke-tertiary" />
                <Typography className="text-secondary">
                  {time}
                  {duration ? ` • ${duration}` : ""} •{" "}
                  {meetingDetails.staffEmail}
                </Typography>
              </View>
            </View>
            {meetingDetails.audioUrl && !isPlayerVisible && (
              <TouchableOpacity
                onPress={() => setIsPlayerVisible(true)}
                className="flex-row items-center gap-1.5 rounded-full bg-brand px-4 py-3"
              >
                <PlaySvg className="size-4 fill-white" />
                <Typography className="text-sm font-medium text-white">
                  Play meeting
                </Typography>
              </TouchableOpacity>
            )}
          </View>

          {meetingDetails.audioUrl && isPlayerVisible && (
            <View className="pb-4 pr-10">
              <AudioPlayer
                url={meetingDetails.audioUrl}
                onClose={() => setIsPlayerVisible(false)}
              />
            </View>
          )}

          <View className="w-full flex-row items-center justify-between pb-4 pr-14">
            <View className="flex-1">
              <MeetingTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isTranscriptionUnavailable={
                  !meetingDetails.transcription &&
                  !meetingDetails.transcriptDeletedAt
                }
                showTranscription={showTranscription}
                showStaffFeedback={meetingDetails.staffFeedback != null}
              />
            </View>
            <View className="ml-3 flex-row gap-3">
              <TouchableOpacity
                onPress={handlePrint}
                className="flex-row items-center gap-1.5 rounded-full border border-subtle px-4 py-3"
              >
                <PrinterIcon className="size-4 fill-tertiary" />
                <Typography className="text-sm font-medium text-primary">
                  Print
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="grow pr-14">
            <View className="mx-auto w-full flex-1">
              {activeTab === Tab.DraftCaseNotes && (
                <DraftCaseNoteTab
                  meetingId={meetingId}
                  caseNote={meetingDetails.caseNote || ""}
                />
              )}
              {activeTab === Tab.ActionItems && (
                <ActionItemsTab items={meetingDetails.structuredActionItems} />
              )}
              {activeTab === Tab.CriticalUpdates && (
                <BulletListTab items={meetingDetails.criticalUpdates} />
              )}
              {activeTab === Tab.StaffFeedback &&
                meetingDetails.staffFeedback && (
                  <StaffFeedbackTab
                    meetingId={meetingId}
                    staffFeedback={meetingDetails.staffFeedback}
                    currentVote={meetingDetails.currentFeedbackVote}
                    canVote={isMeetingCreator}
                  />
                )}
              {activeTab === Tab.Transcript &&
                showTranscription &&
                meetingDetails?.transcription && (
                  <MeetingTranscriptionTab
                    transcription={{
                      ...meetingDetails.transcription,
                      utterances: meetingDetails.transcription.utterances.map(
                        (u) => ({
                          ...u,
                          confidence: u.confidence ?? 0,
                          speaker: u.speaker ?? "Unknown",
                        }),
                      ),
                    }}
                    transcriptDeleted={!!meetingDetails.transcriptDeletedAt}
                  />
                )}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default MeetingDesktop;
