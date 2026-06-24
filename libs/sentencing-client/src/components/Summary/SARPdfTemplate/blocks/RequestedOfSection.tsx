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
import moment from "moment";
import React from "react";

import { formatPersonName } from "../../../../utils/utils";
import { FieldCell } from "../primitives/FieldCell";
import { UnderlinedHeading } from "../primitives/UnderlinedHeading";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { space } from "../tokens";

const fmt = (d: Date | string | null | undefined): string =>
  d ? moment(d).utc().format("MM/DD/YY") : "—";

export const RequestedOfSection: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  const { staff } = sar;
  return (
    <View style={style}>
      <UnderlinedHeading
        meta={`Requested ${fmt(sar.dateRequested)} | Completed ${fmt(sar.updatedAt)}`}
      >
        Requested of
      </UnderlinedHeading>
      <View
        style={{
          flexDirection: "row",
          paddingTop: space[2],
          paddingBottom: space[4],
          gap: space[16],
        }}
      >
        <View style={{ flex: 1 }}>
          <FieldCell
            label="Officer"
            value={
              <>
                {staff?.externalId}
                {"\n"}
                {formatPersonName(staff?.fullName)}
              </>
            }
          />
        </View>
        <View style={{ flex: 2 }}>
          <FieldCell label="District" value={staff?.district?.name ?? ""} />
        </View>
        <View style={{ flex: 2 }}>
          <FieldCell label="Address" value={staff?.officeAddress ?? ""} />
        </View>
        <View style={{ flex: 1 }}>
          <FieldCell label="Phone" value={staff?.officePhoneNumber ?? ""} />
        </View>
      </View>
    </View>
  );
};
