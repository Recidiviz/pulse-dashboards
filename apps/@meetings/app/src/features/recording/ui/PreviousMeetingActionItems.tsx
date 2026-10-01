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

import { NavigationProp, useNavigation } from "@react-navigation/native";
import clsx from "clsx";
import { groupBy } from "lodash";
import { TouchableOpacity, View } from "react-native";
import ArrowRightIcon from "react-native-heroicons/outline/ArrowRightIcon";
import SparklesIcon from "react-native-heroicons/solid/SparklesIcon";

import {
  assigneeToConfigLabel,
  useCurrentAgencyConfig,
} from "~@meetings/app/entities/agency-config";
import {
  type ClientMeetings,
  formatMeetingStartDate,
  type MeetingDetails,
  type ResidentMeetings,
  useCompleteActionItem,
} from "~@meetings/app/entities/meeting";
import { getPersonType } from "~@meetings/app/entities/person";
import { useUserContext } from "~@meetings/app/entities/user";
import { Person } from "~@meetings/app/shared/api";
import { AppStackParamList } from "~@meetings/app/shared/config";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { Checkbox } from "~@meetings/app/shared/ui/Checkbox";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  person: Person;
  onNavigateAway: () => void;
  items: MeetingDetails["meetingActionItems"];
  latestMeeting: (ClientMeetings | ResidentMeetings)[number];
};

export function PreviousMeetingActionItems({
  person,
  onNavigateAway,
  items,
  latestMeeting,
}: Props) {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const agencyConfig = useCurrentAgencyConfig();
  const { isOnline } = useIsOnline();
  const { email: currentUserEmail, isSkipAuthUser } = useUserContext();
  const personType = getPersonType(person);
  const isMeetingCreator =
    currentUserEmail?.toLowerCase() ===
      latestMeeting.staffEmail.toLowerCase() || isSkipAuthUser;

  const toggleCompletion = useCompleteActionItem(latestMeeting.id);

  const itemsByAssignee = groupBy(items, (item) => item.assignee);

  const handleViewMeeting = () => {
    onNavigateAway();
    const params = {
      meetingId: latestMeeting.id,
      personId: person.personId.toString(),
    };
    if (personType === "client") {
      navigation.navigate("Main", {
        screen: "ClientsRoot",
        params: { screen: "ClientMeeting", params },
      });
    } else {
      navigation.navigate("Main", {
        screen: "ResidentsRoot",
        params: { screen: "ResidentMeeting", params },
      });
    }
  };

  return (
    <View className="gap-3 rounded-2xl border border-subtle bg-primary p-4">
      <View className="gap-0.5">
        <Typography variant="body-m-medium">
          Action Items from{" "}
          {formatMeetingStartDate(new Date(latestMeeting.startTime))}
        </Typography>
        <View className="flex-row items-center gap-1">
          <SparklesIcon className="size-3.5 text-brand" />
          <Typography variant="caption-s-medium" className="!text-brand">
            AI generated
          </Typography>
        </View>
        {latestMeeting.staffEmail && (
          <Typography variant="caption-s-regular">
            From{" "}
            <Typography variant="caption-s-medium" className="!text-brand">
              {latestMeeting.staffEmail}
            </Typography>
          </Typography>
        )}
      </View>

      {Object.entries(itemsByAssignee).map(([assignee, assigneeItems]) => (
        <View key={assignee} className="gap-2">
          <Typography variant="body-s-medium">
            {assigneeToConfigLabel(agencyConfig, assignee, personType)}
          </Typography>
          {assigneeItems.map((item) => (
            <View key={item.id} className="flex-row items-start gap-2">
              <Checkbox
                checked={item.completed}
                onCheckedChange={() =>
                  toggleCompletion.mutate({ actionItemId: item.id })
                }
                disabled={!isOnline || !isMeetingCreator}
                className="mt-0.5"
              />
              <Typography
                variant="body-s-regular"
                className={clsx(
                  "flex-1 !text-primary",
                  item.completed && "!text-tertiary line-through",
                )}
              >
                {item.editedTask ?? item.generatedTask}
              </Typography>
            </View>
          ))}
        </View>
      ))}

      <TouchableOpacity
        onPress={handleViewMeeting}
        className="flex-row items-center gap-1 self-start"
      >
        <Typography variant="body-s-medium" className="!text-brand">
          View meeting
        </Typography>
        <ArrowRightIcon className="size-4 text-brand" />
      </TouchableOpacity>
    </View>
  );
}
