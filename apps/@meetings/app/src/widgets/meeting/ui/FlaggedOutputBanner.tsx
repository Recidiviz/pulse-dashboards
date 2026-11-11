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

import { format } from "date-fns";
import { View } from "react-native";
import CheckIcon from "react-native-heroicons/outline/CheckIcon";
import ExclamationIcon from "react-native-heroicons/solid/ExclamationIcon";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import type { FlaggedSections } from "../lib/getUneditedFlaggedSections";

const COPY: Record<
  keyof FlaggedSections,
  { title: string; reviewSubject: string; editedSubject: string }
> = {
  caseNote: {
    title: "Our system found inaccuracies in this case note",
    reviewSubject: "this note",
    editedSubject: "draft case note",
  },
  actionItems: {
    title: "Our system found inaccuracies in these action items",
    reviewSubject: "these action items",
    editedSubject: "action items",
  },
};

type Props = {
  section: keyof FlaggedSections;
  staffEmail: string;
  editedAt: Date | null;
};

export function FlaggedOutputBanner({ section, staffEmail, editedAt }: Props) {
  const { title, reviewSubject, editedSubject } = COPY[section];

  if (editedAt) {
    return (
      <View className="flex-row items-start gap-3 rounded-xl border border-subtle bg-secondary px-4 py-3.5">
        <CheckIcon className="mt-0.5 size-5 stroke-[2px] text-success" />
        <Typography variant="body-s-medium" className="flex-1 !text-secondary">
          Last edits on {format(editedAt, "MMMM d, yyyy")} made by {staffEmail}{" "}
          on flagged {editedSubject}
        </Typography>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-start gap-3 rounded-xl border border-warning/30 bg-warning-light px-4 py-3.5"
    >
      <ExclamationIcon className="mt-0.5 size-5 fill-warning" />
      <View className="flex-1">
        <Typography variant="body-s-medium" className="!text-warning">
          {title}
        </Typography>
        <Typography variant="body-s-regular" className="mt-0.5 !text-warning">
          {staffEmail} has not yet reviewed and approved {reviewSubject}.
        </Typography>
      </View>
    </View>
  );
}
