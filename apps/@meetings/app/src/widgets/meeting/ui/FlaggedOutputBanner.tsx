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

import { View } from "react-native";
import ExclamationIcon from "react-native-heroicons/solid/ExclamationIcon";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import type { FlaggedSections } from "../lib/getUneditedFlaggedSections";

const COPY: Record<
  keyof FlaggedSections,
  { title: string; reviewSubject: string }
> = {
  caseNote: {
    title: "Our system found inaccuracies in this case note",
    reviewSubject: "this note",
  },
  actionItems: {
    title: "Our system found inaccuracies in these action items",
    reviewSubject: "these action items",
  },
};

type Props = {
  section: keyof FlaggedSections;
  reviewerEmail: string;
};

export function FlaggedOutputBanner({ section, reviewerEmail }: Props) {
  const { title, reviewSubject } = COPY[section];

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
          {reviewerEmail} has not yet reviewed and approved {reviewSubject}.
        </Typography>
      </View>
    </View>
  );
}
