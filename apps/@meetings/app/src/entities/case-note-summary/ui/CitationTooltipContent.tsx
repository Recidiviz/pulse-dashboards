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
import { Fragment } from "react";
import { ScrollView, View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { CniCitation } from "../model/types";

type Props = {
  citation: CniCitation;
};

export function CitationTooltipContent({ citation }: Props) {
  const { quotes, lastVerifiedDate } = citation;

  return (
    <View className="gap-3">
      <ScrollView className="max-h-[240px]">
        <View className="gap-3">
          {quotes.map((quote, i) => (
            <Fragment key={`${i}-${quote}`}>
              {i > 0 && <View className="h-px bg-on-strong-secondary/30" />}
              <Typography className="text-sm text-on-brand">{quote}</Typography>
            </Fragment>
          ))}
        </View>
      </ScrollView>
      {lastVerifiedDate && (
        <Typography className="text-sm text-on-strong-secondary">
          {format(lastVerifiedDate, "MMMM d, yyyy")}
        </Typography>
      )}
    </View>
  );
}
