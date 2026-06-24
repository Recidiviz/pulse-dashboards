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

import { Text, View } from "@react-pdf/renderer";
import moment from "moment";
import React from "react";

import {
  isSignatureComplete,
  officerSignatureData,
  type SignatureData,
  supervisorSignatureData,
} from "../derive";
import { SignatureField } from "../primitives/SignatureField";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";

/**
 * One signatory column. When the signature is in place it renders the typed
 * "/s/ name" on the line plus the signer's title and signed date; otherwise it
 * falls back to the blank Printed Name / Date fill-in fields. Mirrors the DOM
 * report's per-signatory signed/unsigned logic (ReportSignature.tsx) — officer
 * and supervisor are independent, so one can be signed while the other is not.
 */
const SignatoryColumn: React.FC<{
  data: SignatureData;
  defaultTitle: string;
}> = ({ data, defaultTitle }) => {
  if (isSignatureComplete(data)) {
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            height: 20,
            justifyContent: "flex-end",
            paddingBottom: space[2],
            borderBottomWidth: border.width.thin,
            borderBottomColor: color.text.default,
            marginBottom: space[4],
          }}
        />
        {data.signature ? (
          <Text
            style={{
              fontSize: font.size.md,
              lineHeight: font.lineHeight.normal,
            }}
          >
            /s/ {data.signature}
          </Text>
        ) : null}
        <Text
          style={{
            fontSize: font.size.md,
            lineHeight: font.lineHeight.normal,
          }}
        >
          {data.title}
        </Text>
        <Text
          style={{ fontSize: font.size.md, lineHeight: font.lineHeight.normal }}
        >
          Date: {moment(data.lastSignedAt).utc().format("M/D/YY")}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 20,
          paddingBottom: space[2],
          borderBottomWidth: border.width.thin,
          borderBottomColor: color.text.default,
        }}
      />
      <Text
        style={{
          fontSize: font.size.md,
          fontWeight: font.weight.bold,
          marginTop: space[4],
          marginBottom: space[10],
        }}
      >
        {defaultTitle}
      </Text>
      <SignatureField label="Printed Name:" />
      <SignatureField label="Date:" />
    </View>
  );
};

/**
 * Signature block. Reads the raw SAR and renders each signatory signed or blank
 * based on whether an active signature is in place.
 */
export const SignatureBlock: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  return (
    <View style={style} wrap={false}>
      <Text style={{ fontSize: font.size.xl, fontWeight: font.weight.medium }}>
        Respectfully submitted,
      </Text>
      <View
        style={{ flexDirection: "row", gap: space[24], marginTop: space[10] }}
      >
        <SignatoryColumn
          data={officerSignatureData(sar)}
          defaultTitle="Probation & Parole Officer"
        />
        <SignatoryColumn
          data={supervisorSignatureData(sar)}
          defaultTitle="Unit Supervisor"
        />
      </View>
      <Text
        style={{
          marginTop: space[4],
          fontSize: font.size.md,
          fontWeight: font.weight.bold,
        }}
      >
        Date Created: {moment().format("MMMM D, YYYY")}
      </Text>
    </View>
  );
};
