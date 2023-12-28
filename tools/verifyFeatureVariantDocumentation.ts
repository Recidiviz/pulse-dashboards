// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { allFeatureVariants } from "../src/RootStore/types";
import { getGoogleSheet } from "./utils";

/*
  Loads up the sheet at process.env.FEATURE_VARIANT_SHEET_ID (go/dashboard-feature-variants)
  and confirms that all feature variants defined in code except for "TEST"
  are present in the "Feature Variant" column. If not, raises an error with
  the missing feature variants.
 */
async function verifyFeatureVariantDocumentation() {
  const docId = process.env.FEATURE_VARIANT_SHEET_ID;

  if (docId === undefined) {
    throw new Error("process.env.FEATURE_VARIANT_SHEET_ID is undefined");
  }

  const doc = await getGoogleSheet(docId);
  const sheet = doc.sheetsByIndex[0];

  const rows = await sheet.getRows();

  const sheetVariants = new Set(rows.map((r) => r.get("Feature Variant")));

  const codeVariants = new Set(Object.keys(allFeatureVariants));
  codeVariants.delete("TEST");

  const missingVariants: string[] = [];
  codeVariants.forEach((variant) => {
    if (!sheetVariants.has(variant)) {
      missingVariants.push(variant);
    }
  });

  if (missingVariants.length > 0) {
    throw new Error(
      `FeatureVariants missing from go/dashboard-feature-variants: ${missingVariants.join(
        ", "
      )}`
    );
  }

  // eslint-disable-next-line no-console
  console.log(
    "All FeatureVariants accounted for in go/dashboard-feature-variants"
  );
}

verifyFeatureVariantDocumentation();
