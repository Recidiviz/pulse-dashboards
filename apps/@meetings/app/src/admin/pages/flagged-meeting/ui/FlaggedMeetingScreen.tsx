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

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, View } from "react-native";

import type { FlaggedMeetingDetails } from "~@meetings/app/admin/api/flaggedMeetings";
import { AdminLayout } from "~@meetings/app/admin/widgets/admin-sidebar";
import { useAgencyConfigs } from "~@meetings/app/entities/agency-config";
import { trpc } from "~@meetings/app/shared/api";
import { RootStackParamList } from "~@meetings/app/shared/config";
import { useSetDocumentTitle } from "~@meetings/app/shared/lib/platform";
import { Button } from "~@meetings/app/shared/ui/Button";
import Loading from "~@meetings/app/shared/ui/Loading";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { formatDate, formatMinutes } from "../lib/format";
import { buildMetaItems } from "../lib/metadata";
import { buildRatingsTable } from "../lib/ratings";
import { MetadataGrid } from "./MetadataGrid";
import { NotesPanel } from "./NotesPanel";
import { LlmJudgeCard, RaterCard, VotesCard } from "./RaterOutput";
import { RatingsTableView } from "./RatingsTable";
import { ReviewRail } from "./ReviewRail";
import { TranscriptPanel } from "./TranscriptPanel";

type FlaggedMeetingRouteProp = RouteProp<
  RootStackParamList,
  "AdminFlaggedMeeting"
>;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <Typography variant="heading-5">{title}</Typography>
      {children}
    </View>
  );
}

export function FlaggedMeetingScreen() {
  // React Navigation keeps rendering a screen briefly after its route is
  // popped, at which point the params are gone.
  const params: FlaggedMeetingRouteProp["params"] | undefined =
    useRoute<FlaggedMeetingRouteProp>().params;
  const stateCode = params?.stateCode ?? "";
  const meetingId = params?.meetingId ?? "";
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { agencyConfigs } = useAgencyConfigs();
  useSetDocumentTitle(`Flagged meeting ${meetingId}`);

  const { data, error, isLoading, refetch } =
    trpc.v1.flaggedMeetings.getDetails.useQuery(
      {
        stateCode: stateCode as FlaggedMeetingDetails["stateCode"],
        meetingId,
      },
      { enabled: params !== undefined },
    );

  if (!params) return null;

  if (isLoading) {
    return (
      <AdminLayout active="AdminFlaggedMeetings">
        <Loading message="Loading meeting..." />
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout active="AdminFlaggedMeetings">
        <View className="flex-1 items-center justify-center gap-4">
          <Typography variant="body-m-regular" className="text-center">
            {error?.message ?? "Meeting not found"}
          </Typography>
          <Button variant="secondary" onPress={() => void refetch()}>
            Retry
          </Button>
        </View>
      </AdminLayout>
    );
  }

  const stateName = agencyConfigs[data.stateCode]?.name ?? data.stateCode;
  const meta = [
    stateName,
    formatDate(data.startTime),
    data.durationMs !== null ? formatMinutes(data.durationMs) : null,
    data.staffEmail,
  ]
    .filter(Boolean)
    .join(" · ");
  const { llm, labelStudio, votes } = data;

  return (
    <AdminLayout active="AdminFlaggedMeetings">
      <ScrollView contentContainerClassName="gap-6 pb-8">
        <View className="gap-3">
          <Pressable
            accessibilityRole="link"
            onPress={() => navigation.navigate("AdminFlaggedMeetings")}
            className="self-start"
          >
            <Typography variant="body-s-medium" className="!text-brand">
              ← Flagged meetings
            </Typography>
          </Pressable>
          <View className="min-w-0 gap-1.5">
            <Typography variant="heading-4" className="font-mono">
              {data.meetingId}
            </Typography>
            <Typography variant="body-s-regular">{meta}</Typography>
          </View>
          <MetadataGrid items={buildMetaItems(data)} />
        </View>

        <View className="flex-row flex-wrap items-start gap-6">
          <View className="min-w-[480px] flex-1 gap-6">
            <Section title="Ratings">
              <RatingsTableView table={buildRatingsTable(data)} />
            </Section>

            <Section title="Rater output">
              <View className="flex-row flex-wrap items-start gap-4">
                {llm && <LlmJudgeCard llm={llm} />}
                {labelStudio?.raters.map((rater) => (
                  <RaterCard key={rater.raterEmail} rater={rater} />
                ))}
                {votes.length > 0 && <VotesCard votes={votes} />}
              </View>
            </Section>

            <Section title="Notes and transcript">
              <View className="flex-row flex-wrap items-start gap-4">
                <NotesPanel details={data} />
                <TranscriptPanel details={data} />
              </View>
            </Section>
          </View>
          <ReviewRail key={data.meetingId} details={data} />
        </View>
      </ScrollView>
    </AdminLayout>
  );
}
