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
import React, { ReactNode, useRef, useState } from "react";
import { ImageBackground, ScrollView, View } from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import ClockIcon from "react-native-heroicons/outline/ClockIcon";
import PrinterIcon from "react-native-heroicons/solid/PrinterIcon";

import {
  formatMeetingDuration,
  formatMeetingStartDate,
  MeetingDetails,
} from "~@meetings/app/entities/meeting";
import { MeetingTypeTag } from "~@meetings/app/entities/meeting-type";
import { useUserContext } from "~@meetings/app/entities/user";
import { useAnalytics } from "~@meetings/app/shared/analytics";
import { Person, PersonType } from "~@meetings/app/shared/api";
import PlaySvg from "~@meetings/app/shared/assets/icons/play.svg";
import BgAvatarImage from "~@meetings/app/shared/assets/images/bg-avatar.png";
import {
  getInitials,
  humanReadableTitleCase,
} from "~@meetings/app/shared/lib/format";
import { Button } from "~@meetings/app/shared/ui/Button";
import { FadeContainer } from "~@meetings/app/shared/ui/FadeContainer";
import { useSnackbarBottomOffset } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useApprovalFooter } from "../lib/useApprovalFooter";
import { usePrintMeetingDetails } from "../lib/usePrintMeetingDetails";
import { ActionItemsTab } from "./ActionItemsTab";
import { ApprovalFooter } from "./ApprovalFooter";
import AudioPlayer from "./AudioPlayer";
import DraftCaseNoteTab from "./DraftCaseNoteTab";
import MeetingTabs, { Tab } from "./MeetingTabs";
import MeetingTranscriptionTab from "./MeetingTranscriptionTab";
import OutputVote from "./OutputVote";
import { ScrollSection, scrollToSection } from "./ScrollSection";
import StaffFeedbackTab from "./StaffFeedbackTab";

const FOOTER_HEIGHT = 64;

const TAB_ORDER = [
  Tab.DraftCaseNotes,
  Tab.ActionItems,
  Tab.StaffFeedback,
  Tab.Transcript,
];

const TAB_SCROLL_MS = 800;

type Props = {
  meetingId: string;
  meetingDetails: MeetingDetails;
  person: Person;
  personType: PersonType;
  showTranscription?: boolean;
  header: ReactNode;
};

const MeetingDesktop = ({
  meetingId,
  meetingDetails,
  person,
  personType,
  showTranscription = false,
  header,
}: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DraftCaseNotes);
  // Ignore scroll-spy updates until a tab press finishes scrolling. Otherwise
  // every section scrolled past would briefly become active, making the tabs
  // and the approval footer flicker
  const ignoreVisibleUntilRef = useRef(0);
  // State rather than a ref so the sections start observing once it mounts
  const [scrollView, setScrollView] = useState<ScrollView | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const { track } = useAnalytics();
  const { email: currentUserEmail, isSkipAuthUser } = useUserContext();
  const isMeetingCreator =
    currentUserEmail?.toLowerCase() ===
      meetingDetails.staffEmail.toLowerCase() || isSkipAuthUser;

  const {
    footerTab,
    activeSectionApproval,
    isFooterChecked,
    hasBeenEdited,
    handleFooterCheckedChange,
    handleConfirmApproval,
    isConfirmPending,
    shouldShowFooter,
  } = useApprovalFooter(meetingId, activeTab, meetingDetails, isMeetingCreator);

  // Float snackbars above the approval footer instead of on top of it.
  useSnackbarBottomOffset(shouldShowFooter ? FOOTER_HEIGHT : 0);

  const meetingDate = meetingDetails.startTime
    ? formatMeetingStartDate(meetingDetails.startTime)
    : "";
  const { time, duration } = formatMeetingDuration({
    startDate: meetingDetails.startTime || null,
    endDate: meetingDetails.endTime || null,
    durationMs: meetingDetails.durationMs,
  });

  const printMeetingDetails = usePrintMeetingDetails({
    person,
    personType,
    meetingDetails,
    meetingDate,
    time,
    duration,
  });

  const handleTabPress = (tab: Tab) => {
    setActiveTab(tab);
    ignoreVisibleUntilRef.current = Date.now() + TAB_SCROLL_MS;
    scrollToSection(tab);
  };

  const handleSectionVisible = (tab: Tab) => {
    if (Date.now() < ignoreVisibleUntilRef.current) return;
    setActiveTab(tab);
  };

  const handlePrint = () => {
    track("print_button_clicked", {
      meetingId,
      personId: person.personId.toString(),
    });
    printMeetingDetails();
  };

  return (
    <View className="flex-1 grow">
      {header}
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
            <Typography variant="body-s-medium">Back</Typography>
          </Link>
        </View>

        <View className="flex-1 pt-8">
          {/* overflow-hidden makes this a scroll container, which is what lets
              it reserve the same gutter as the ScrollView below and stay
              aligned with it. */}
          <View className="scrollbar-gutter-stable overflow-hidden pl-1 pr-14">
            <View className="flex-row items-center gap-3">
              <ImageBackground
                source={BgAvatarImage}
                className="size-10 items-center justify-center overflow-hidden rounded-full font-medium"
                imageClassName="!size-full"
              >
                <Typography
                  variant="body-m-regular"
                  className="!text-on-strong"
                >
                  {getInitials(person.fullName)}
                </Typography>
              </ImageBackground>
              <View>
                <Typography variant="heading-5">{person.fullName}</Typography>
                <Typography variant="body-m-regular" className="text-secondary">
                  ID: {person.displayPersonExternalId} •{" "}
                  {humanReadableTitleCase(person.primaryMetadata)}
                </Typography>
              </View>
            </View>

            <View className="flex-row items-start justify-between gap-3 py-6">
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
                <Button
                  variant="primary"
                  icon={{ icon: PlaySvg }}
                  onPress={() => setIsPlayerVisible(true)}
                >
                  Play meeting
                </Button>
              )}
            </View>

            {meetingDetails.audioUrl && isPlayerVisible && (
              <View className="pb-4">
                <AudioPlayer
                  url={meetingDetails.audioUrl}
                  onClose={() => setIsPlayerVisible(false)}
                />
              </View>
            )}

            <View className="w-full flex-row items-center justify-between pb-4">
              <View className="flex-1">
                <MeetingTabs
                  activeTab={activeTab}
                  setActiveTab={handleTabPress}
                  isTranscriptionUnavailable={
                    !meetingDetails.transcription &&
                    !meetingDetails.transcriptDeletedAt
                  }
                  showTranscription={showTranscription}
                  showStaffFeedback={meetingDetails.staffFeedback != null}
                  tabOrder={TAB_ORDER}
                  approvals={meetingDetails.approvals}
                />
              </View>
              <View className="ml-3 flex-row gap-3">
                <Button
                  variant="tertiary"
                  icon={{ icon: PrinterIcon, className: "stroke-none size-4" }}
                  onPress={handlePrint}
                >
                  Print
                </Button>
              </View>
            </View>
          </View>

          <ScrollView
            ref={setScrollView}
            className="scrollbar-gutter-stable flex-1"
            contentContainerClassName="grow pr-14 pb-10 pl-1"
            contentContainerStyle={
              shouldShowFooter && { paddingBottom: 40 + FOOTER_HEIGHT }
            }
          >
            <View className="mx-auto w-full gap-10">
              <ScrollSection
                tab={Tab.DraftCaseNotes}
                scrollView={scrollView}
                onVisible={handleSectionVisible}
              >
                <DraftCaseNoteTab
                  meetingId={meetingId}
                  caseNote={meetingDetails.caseNote || ""}
                  isApproved={meetingDetails.approvals.caseNote.isApproved}
                  isMeetingCreator={isMeetingCreator}
                  personId={person.personId.toString()}
                  canEdit={isMeetingCreator}
                  typingAnimation={{
                    pipelineRunId: meetingDetails.notetakingPipelineRunId,
                    meetingStartTime: meetingDetails.startTime,
                    isRead:
                      !!meetingDetails.caseNoteEditedAt ||
                      meetingDetails.approvals.caseNote.isApproved,
                  }}
                  outputVote={
                    isMeetingCreator &&
                    meetingDetails.caseNote && (
                      <OutputVote
                        meetingDetails={meetingDetails}
                        tab={Tab.DraftCaseNotes}
                      />
                    )
                  }
                />
              </ScrollSection>
              <ScrollSection
                tab={Tab.ActionItems}
                scrollView={scrollView}
                onVisible={handleSectionVisible}
              >
                <ActionItemsTab
                  items={meetingDetails.meetingActionItems}
                  outputVote={
                    isMeetingCreator &&
                    meetingDetails.meetingActionItems.length > 0 && (
                      <OutputVote
                        meetingDetails={meetingDetails}
                        tab={Tab.ActionItems}
                      />
                    )
                  }
                  meetingId={meetingId}
                  personType={personType}
                />
              </ScrollSection>
              {meetingDetails.staffFeedback && (
                <ScrollSection
                  tab={Tab.StaffFeedback}
                  scrollView={scrollView}
                  onVisible={handleSectionVisible}
                >
                  <StaffFeedbackTab
                    staffFeedback={meetingDetails.staffFeedback}
                    outputVote={
                      isMeetingCreator && (
                        <OutputVote
                          meetingDetails={meetingDetails}
                          tab={Tab.StaffFeedback}
                        />
                      )
                    }
                  />
                </ScrollSection>
              )}
              {showTranscription && meetingDetails?.transcription && (
                <ScrollSection
                  tab={Tab.Transcript}
                  scrollView={scrollView}
                  onVisible={handleSectionVisible}
                >
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
                    meetingStaffEmail={meetingDetails.staffEmail}
                    jiiName={person.fullName}
                    personType={personType}
                  />
                </ScrollSection>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
      <FadeContainer
        isVisible={shouldShowFooter}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <View
          className="flex-row border-t border-subtle bg-primary"
          style={{ height: FOOTER_HEIGHT }}
        >
          <View className="w-36 shrink-0" />
          <View className="flex-1 flex-row items-center justify-between py-3 pr-10">
            <ApprovalFooter
              activeTab={footerTab}
              activeSectionApproval={activeSectionApproval}
              isFooterChecked={isFooterChecked}
              hasBeenEdited={hasBeenEdited}
              onFooterCheckedChange={handleFooterCheckedChange}
              onConfirm={handleConfirmApproval}
              isConfirmPending={isConfirmPending}
            />
          </View>
        </View>
      </FadeContainer>
    </View>
  );
};

export default MeetingDesktop;
