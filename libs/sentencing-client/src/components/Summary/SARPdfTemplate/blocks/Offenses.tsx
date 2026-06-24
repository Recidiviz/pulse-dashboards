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

// Charges render from a stable, order-stable array; array indices are safe
// React keys here.
/* eslint-disable react/no-array-index-key */

import { View } from "@react-pdf/renderer";
import React from "react";

import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { OffenseBlock } from "./OffenseBlock";

/** Renders one OffenseBlock per charge on the SAR (read from context). */
export const Offenses: React.FC<{ style?: PdfStyle }> = ({ style = {} }) => {
  const { sar } = useSAR();
  return (
    <View style={style}>
      {sar.charges.map((charge, i) => (
        <OffenseBlock key={i} charge={charge} index={i} />
      ))}
    </View>
  );
};
