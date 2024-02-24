/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import createMetricCopyFile from "./createMetricCopyFile";
import createPageCopyFile from "./createPageCopyFile";
import { getGoogleSheet } from "./utils";

const STATES_WITH_COPY_OVERRIDES = [
  "US_CO",
  "US_ID",
  "US_ME",
  "US_MI",
  "US_ND",
  "US_TN",
];

const syncContentWithSheet = async () => {
  const docId = process.env.CONTENT_SHEET_ID || "";

  const doc = await getGoogleSheet(docId);
  await createPageCopyFile(doc);
  await createMetricCopyFile(doc);

  // eslint-disable-next-line no-restricted-syntax
  for (const stateCode of STATES_WITH_COPY_OVERRIDES) {
    // eslint-disable-next-line no-await-in-loop
    await createPageCopyFile(doc, stateCode);
    // eslint-disable-next-line no-await-in-loop
    await createMetricCopyFile(doc, stateCode);
  }
};

// eslint-disable-next-line no-console
syncContentWithSheet().catch((err) => console.log(err));
