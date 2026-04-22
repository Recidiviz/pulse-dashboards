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

import type { i18n, TFunction } from "i18next";

import { createI18nInstance } from "../createI18nInstance";
import { commonSentenceDatesResourceContentsSchema } from "./types";

let i18nextInstance: i18n;
let t: TFunction<"US_OZ">;

beforeEach(async () => {
  i18nextInstance = createI18nInstance([]);
  // The common namespace is loaded lazily via the async backend but we are explicitly
  // pulling it here so translations resolve synchronously in tests.
  // In the real app the useTranslation hook manages this with promises and Suspense
  await i18nextInstance.reloadResources(["en"], ["common"]);

  // OZ has no resources in these tests, which is fine -- we are just verifying that
  // common values are passed through correctly to the state translation function
  t = i18nextInstance.getFixedT("en", "US_OZ");
});

test("fallbacks from state to common Sentence Dates fields", () => {
  expect(() =>
    commonSentenceDatesResourceContentsSchema.parse(
      t(($) => $.sentenceDates, { returnObjects: true }),
    ),
  ).not.toThrow();
});
