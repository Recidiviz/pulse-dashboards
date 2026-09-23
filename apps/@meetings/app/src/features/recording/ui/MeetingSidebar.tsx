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

import clsx from "clsx";
import { useEffect } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import SparklesIcon from "react-native-heroicons/solid/SparklesIcon";

import { useAgencyConfigs } from "~@meetings/app/entities/agency-config";
import {
  CaseNoteSummaryWithTooltips,
  useCaseNoteSummary,
} from "~@meetings/app/entities/case-note-summary";
import {
  useMeetingDetails,
  useMeetings,
} from "~@meetings/app/entities/meeting";
import { getPersonType } from "~@meetings/app/entities/person";
import { useStateSelection } from "~@meetings/app/entities/state-code";
import { useFeatureVariants } from "~@meetings/app/entities/user";
import { Person } from "~@meetings/app/shared/api";
import SidebarSvg from "~@meetings/app/shared/assets/icons/sidebar.svg";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { getLatestCompletedMeeting } from "../lib/getLatestCompletedMeeting";
import { useRecordingStore } from "../model/store";
import { PreviousMeetingActionItems } from "./PreviousMeetingActionItems";

export type MeetingSidebarProps = {
  person: Person;
  // Called before "View meeting" navigates away, to close or minimize the modal
  onNavigateAway: () => void;
};

export function MeetingSidebar({
  person,
  onNavigateAway,
}: MeetingSidebarProps) {
  const personType = getPersonType(person);

  const isCollapsed = useRecordingStore((s) => s.isSidebarCollapsed);
  const setIsCollapsed = useRecordingStore((s) => s.setIsSidebarCollapsed);
  const { selectedStateCode } = useStateSelection();
  const { agencyConfigs } = useAgencyConfigs();
  const { isVariantActive } = useFeatureVariants();
  const showCNI =
    agencyConfigs[selectedStateCode]?.showCNI || isVariantActive("showCNI");
  const isClient = personType === "client";
  const { segments, enabled: isCaseNoteSummaryEnabled } = useCaseNoteSummary({
    person,
    isClient,
    showCNI,
  });

  const { data: meetings } = useMeetings({
    personId: person.personId,
    personType,
  });
  const latestMeeting = getLatestCompletedMeeting(meetings);
  const { data: details } = useMeetingDetails(latestMeeting?.id);

  const actionItems =
    details?.meetingActionItems.filter((item) => !item.deleted) ?? [];

  const isCaseNoteSummaryVisible = isCaseNoteSummaryEnabled && segments;
  const isActionItemsVisible = latestMeeting && actionItems.length > 0;

  useEffect(() => {
    if (!isCaseNoteSummaryVisible && !isActionItemsVisible) {
      setIsCollapsed(true);
    }
  }, [isCaseNoteSummaryVisible, isActionItemsVisible, setIsCollapsed]);

  return (
    <View
      className={clsx(
        "border-r border-subtle bg-secondary",
        isCollapsed ? "w-12" : "w-[270px]",
      )}
    >
      <TouchableOpacity
        onPress={() => setIsCollapsed(!isCollapsed)}
        className="ml-3 mt-5 size-6 items-center justify-center self-start"
      >
        <SidebarSvg className="size-6 text-secondary" />
      </TouchableOpacity>

      {!isCollapsed && (
        <ScrollView contentContainerClassName="gap-6 px-5 pb-5 pt-4">
          <View className="gap-1">
            <Typography variant="heading-2" className="!text-2xl !leading-8">
              {person.fullName}'s Details
            </Typography>
            <Typography variant="body-m-regular" className="!text-secondary">
              ID: {person.displayPersonExternalId}
            </Typography>
            <Typography variant="body-m-regular" className="!text-secondary">
              {person.primaryMetadata}
            </Typography>
          </View>

          {isCaseNoteSummaryVisible && (
            <View className="gap-3 rounded-2xl border border-subtle bg-primary p-4">
              <View className="gap-0.5">
                <Typography variant="body-m-medium">
                  Case Note Summary
                </Typography>
                <View className="flex-row items-center gap-1">
                  <SparklesIcon className="size-3.5 text-brand" />
                  <Typography
                    variant="caption-s-medium"
                    className="!text-brand"
                  >
                    AI generated
                  </Typography>
                </View>
              </View>
              <CaseNoteSummaryWithTooltips segments={segments} isInsideModal />
            </View>
          )}

          {isActionItemsVisible && (
            <PreviousMeetingActionItems
              person={person}
              onNavigateAway={onNavigateAway}
              items={actionItems}
              latestMeeting={latestMeeting}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}
