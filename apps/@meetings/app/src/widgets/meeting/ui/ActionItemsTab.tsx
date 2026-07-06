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

import { Arrow as TooltipArrowWeb } from "@radix-ui/react-tooltip";
import * as TooltipPrimitive from "@rn-primitives/tooltip";
import { ReactNode, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";

import { Typography } from "~@meetings/app/shared/ui/Typography";

type ActionItem = {
  id: string;
  assignee: string;
  completed: boolean;
  editedTask: string | null;
  generatedTask: string;
  context: string | null;
  evidenceQuotes: string[];
  deleted: boolean;
};

type ActionItemsTabProps = {
  items?: ActionItem[] | null;
  outputVote?: ReactNode;
};

export const ActionItemsTab = ({ items, outputVote }: ActionItemsTabProps) => {
  const ActionItemComponent =
    Platform.OS === "web" ? ActionItemWeb : ActionItemMobile;

  return (
    <View className="flex-1 gap-4 pb-4">
      {items?.map((item) => <ActionItemComponent key={item.id} {...item} />)}
      {outputVote}
    </View>
  );
};

function SourceLabel() {
  const style = Platform.select({
    android: { transform: "translateY(5px)" },
    ios: { transform: "translateY(14px)" },
  });

  return (
    <View
      className="relative rounded-lg bg-secondary px-1.5 py-0.5"
      style={style}
    >
      <Typography className="border-b-2 border-dotted border-secondary text-sm text-secondary">
        Source
      </Typography>
    </View>
  );
}

function ActionItemWeb({ editedTask, generatedTask, context }: ActionItem) {
  const task = editedTask ?? generatedTask;
  return (
    <View className="flex-row gap-2 px-4">
      <Typography className="mt-0.5 text-primary">•</Typography>
      <View className="flex-1 flex-row flex-wrap items-baseline gap-x-1.5">
        <Typography className="text-base leading-6 tracking-[-0.32px] text-primary">
          {task}{" "}
          {context && (
            <TooltipPrimitive.Root
              delayDuration={0}
              className="inline-flex items-baseline"
            >
              <TooltipPrimitive.Trigger>
                <SourceLabel />
              </TooltipPrimitive.Trigger>
              <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                  className="relative max-w-xs rounded-xl bg-strong p-4"
                  side="top"
                  sideOffset={8}
                >
                  <ScrollView className="max-h-[240px]">
                    <Typography className="text-sm text-on-brand">
                      {context}
                    </Typography>
                  </ScrollView>
                  <TooltipArrowWeb className="fill-strong" />
                </TooltipPrimitive.Content>
              </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
          )}
        </Typography>
      </View>
    </View>
  );
}

function ActionItemMobile({ editedTask, generatedTask, context }: ActionItem) {
  const task = editedTask ?? generatedTask;
  const [open, setOpen] = useState(false);

  return (
    <TooltipPrimitive.Root
      delayDuration={0}
      onOpenChange={context ? setOpen : undefined}
    >
      <TooltipPrimitive.Trigger className="flex-row gap-2 px-4">
        <Typography className="mt-0.5 text-primary">•</Typography>
        <View className="flex-1 flex-row flex-wrap items-baseline gap-x-1.5">
          <Typography
            className={`text-base ${open ? "text-brand" : "text-primary"}`}
          >
            {task} {context && <SourceLabel />}
          </Typography>
        </View>
      </TooltipPrimitive.Trigger>
      {context && (
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Overlay style={StyleSheet.absoluteFill} />
          <TooltipPrimitive.Content
            side="top"
            sideOffset={8}
            className="items-center"
          >
            <View className="w-[90%] max-w-[350px] rounded-xl bg-strong p-4">
              <GHScrollView className="max-h-[240px]">
                <Typography className="text-sm text-on-brand">
                  {context}
                </Typography>
              </GHScrollView>
              <View className="fill-strong border-t-strong absolute bottom-[-5px] left-1/2 ml-[-5px] size-0 border-x-[5px] border-t-[5px] border-x-transparent" />
            </View>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      )}
    </TooltipPrimitive.Root>
  );
}
