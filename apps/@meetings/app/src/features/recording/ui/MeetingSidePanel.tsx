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
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import ChevronDoubleLeftIcon from "react-native-heroicons/outline/ChevronDoubleLeftIcon";
import ChevronDoubleRightIcon from "react-native-heroicons/outline/ChevronDoubleRightIcon";
import SparklesIcon from "react-native-heroicons/solid/SparklesIcon";

import {
  CaseNoteSummaryWithTooltips,
  useCaseNoteSummary,
} from "~@meetings/app/entities/case-note-summary";
import { getPersonType } from "~@meetings/app/entities/person";
import { Person, trpc } from "~@meetings/app/shared/api";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  person: Person;
};

export function MeetingSidePanel({ person }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isClient = getPersonType(person) === "client";
  const { data: client } = trpc.v1.client.get.useQuery(
    { personId: person.personId },
    { enabled: isClient },
  );

  const segments = useCaseNoteSummary(
    client?.caseNoteInsightsSummaries,
    person,
  );

  if (!isClient) return null;

  return (
    <View
      className={clsx(
        "relative border-l border-subtle px-2",
        isCollapsed ? "w-[80px]" : "w-[300px]",
      )}
    >
      <View className="absolute inset-y-0 -left-3 z-10 justify-center">
        <TouchableOpacity
          onPress={() => setIsCollapsed((collapsed) => !collapsed)}
          className="size-6 items-center justify-center rounded-full border border-subtle bg-primary"
        >
          {isCollapsed ? (
            <ChevronDoubleLeftIcon className="size-3.5 text-secondary" />
          ) : (
            <ChevronDoubleRightIcon className="size-3.5 text-secondary" />
          )}
        </TouchableOpacity>
      </View>

      {isCollapsed ? (
        <View className="flex-1 items-center justify-center px-1">
          <Typography variant="caption-s-regular" className="text-center">
            Case Note Summary
          </Typography>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-3 p-3">
          {segments ? (
            <View className="gap-3 rounded-2xl border border-subtle bg-primary p-3">
              <View className="flex-row items-center justify-between">
                <Typography variant="body-s-medium">
                  Case Note Summary
                </Typography>
                <View className="flex-row items-center gap-1">
                  <SparklesIcon className="size-3.5 text-brand" />
                  <Typography
                    variant="caption-s-regular"
                    className="text-brand"
                  >
                    AI generated
                  </Typography>
                </View>
              </View>
              <CaseNoteSummaryWithTooltips segments={segments} isInsideModal />
            </View>
          ) : (
            <View className="items-center gap-1 py-4">
              <Typography variant="body-m-medium" className="text-center">
                No case note summary yet
              </Typography>
              <Typography variant="body-s-regular" className="text-center">
                Case note summary will appear here when it’s available.
              </Typography>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
