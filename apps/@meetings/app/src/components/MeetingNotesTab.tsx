// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { ScrollView, Text, View } from "react-native";

import type { MinuteSection } from "~@meetings/trpc-types";

type Props = {
  notes?: string | null;
  actionItems?: string[] | null;
  criticalUpdates?: string[] | null;
  meetingSummary?: MinuteSection[] | null;
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

// Action Items List Component
const ActionItemsList = ({ items }: { items: string[] }) => {
  if (items.length === 0) {
    return (
      <Text className="font-inter text-base leading-[22px] text-primary">
        No action items for this meeting.
      </Text>
    );
  }

  return (
    <View className="flex flex-col">
      {items.map((item, index) => (
        <View key={index}>
          <View className="flex flex-col gap-1.5 py-3">
            <Text className="font-inter text-base leading-[22px] text-primary">
              {item}
            </Text>
          </View>
          {index < items.length - 1 && <View className="h-px bg-[#35536226]" />}
        </View>
      ))}
    </View>
  );
};

// Critical Updates List Component
const CriticalUpdatesList = ({ updates }: { updates: string[] }) => {
  if (updates.length === 0) {
    return (
      <Text className="font-inter text-base leading-[22px] text-primary">
        No updates for this meeting.
      </Text>
    );
  }

  return (
    <View className="flex flex-col">
      {updates.map((update, index) => (
        <View key={index}>
          <View className="flex flex-col gap-1 py-3">
            <Text className="font-inter text-base leading-[22px] text-primary">
              {update}
            </Text>
          </View>
          {index < updates.length - 1 && (
            <View className="h-px bg-[#35536226]" />
          )}
        </View>
      ))}
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

const MeetingsNotesTab = ({
  notes,
  actionItems,
  criticalUpdates,
  meetingSummary,
}: Props) => {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex flex-col gap-8 pb-8"
    >
      <SectionContainer title="Notes">
        <Text className="font-inter text-base leading-[22px] text-primary">
          {notes ?? "No notes taken for this meeting."}
        </Text>
      </SectionContainer>

      <SectionContainer title="Action Items">
        <ActionItemsList items={actionItems ?? []} />
      </SectionContainer>

      <SectionContainer title="Critical Updates">
        <CriticalUpdatesList updates={criticalUpdates ?? []} />
      </SectionContainer>

      <SectionContainer title="Meeting Summary">
        <MeetingMinutesList sections={meetingSummary ?? []} />
      </SectionContainer>
    </ScrollView>
  );
};

export default MeetingsNotesTab;
