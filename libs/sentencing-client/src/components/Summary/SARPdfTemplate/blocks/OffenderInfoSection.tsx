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

import { View } from "@react-pdf/renderer";
import React from "react";

import { formatDisplayDate } from "../../../../utils/utils";
import { GenderToDisplayName } from "../../../CaseDetails/constants";
import { formattedRace } from "../derive";
import { Chip } from "../primitives/Chip";
import { UnderlinedHeading } from "../primitives/UnderlinedHeading";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { space } from "../tokens";
import { valueOrDash as v } from "../utils";

export const OffenderInfoSection: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  const gender = sar.client?.gender;
  return (
    <View style={style}>
      <UnderlinedHeading>Offender / Court Information</UnderlinedHeading>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: space[6],
          paddingVertical: space[4],
        }}
      >
        <Chip>Gender: {gender ? GenderToDisplayName[gender] : v(gender)}</Chip>
        <Chip>Race: {formattedRace(sar)}</Chip>
        <Chip>Date of Birth: {formatDisplayDate(sar.client?.birthDate)}</Chip>
        <Chip>DOC ID: {v(sar.client?.externalId)}</Chip>
      </View>
    </View>
  );
};
