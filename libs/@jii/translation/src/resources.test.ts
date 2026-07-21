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

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { residentsConfigByState, stateCodes } from "~@jii/configs";

import commonEn from "./namespaces/common/resources/en.json";
import commonEs from "./namespaces/common/resources/es.json";
import {
  commonOnboardingVideoResourcesSchema,
  stateOnboardingVideoResourcesSchema,
} from "./onboardingVideo/types";
import {
  commonProgramCatalogResourcesSchema,
  stateProgramCatalogResourcesSchema,
} from "./programCatalog/types";
import {
  commonSentenceDatesResourcesSchema,
  stateSentenceDatesResourcesSchema,
} from "./sentenceDates/types";

const namespacesDir = resolve(__dirname, "./namespaces");

const sharedFeatureSchemasToTest = [
  {
    testNameLabel: "Sentence Dates",
    commonSchema: commonSentenceDatesResourcesSchema,
    stateSchema: stateSentenceDatesResourcesSchema,
  },
  {
    testNameLabel: "Program Catalog",
    commonSchema: commonProgramCatalogResourcesSchema,
    stateSchema: stateProgramCatalogResourcesSchema,
  },
  {
    testNameLabel: "Onboarding Video",
    commonSchema: commonOnboardingVideoResourcesSchema,
    stateSchema: stateOnboardingVideoResourcesSchema,
  },
];

describe("common namespace translation resources", () => {
  describe.each(sharedFeatureSchemasToTest)(
    "$testNameLabel",
    ({ commonSchema }) => {
      test("english", () => {
        expect(() => commonSchema.parse(commonEn)).not.toThrow();
      });

      const hasSpanishTranslations = Object.keys(commonSchema.shape).some(
        (key) => key in commonEs,
      );

      test.runIf(hasSpanishTranslations)("spanish", () => {
        expect(() => commonSchema.parse(commonEs)).not.toThrow();
      });
    },
  );
});

// find all of the states with JSON translation files
const stateCodesWithJsonResources = stateCodes.options
  .map((stateCode) => ({
    stateCode,
    enPath: resolve(namespacesDir, stateCode, "resources/en.json"),
    esPath: resolve(namespacesDir, stateCode, "resources/es.json"),
  }))
  .filter(({ enPath }) => existsSync(enPath));
// this list should not be empty, that probably means the files moved or something
if (stateCodesWithJsonResources.length === 0)
  throw new Error("Unable to find JSON translation resources");

describe.each(stateCodesWithJsonResources)(
  "$stateCode translation resources",
  ({ stateCode, enPath, esPath }) => {
    const enJson = JSON.parse(readFileSync(enPath, "utf-8"));

    describe.each(sharedFeatureSchemasToTest)(
      "$testNameLabel",
      ({ stateSchema }) => {
        const hasFeature = Object.keys(stateSchema.shape).some(
          (key) => key in enJson,
        );

        test.runIf(hasFeature)("english", () => {
          expect(() => stateSchema.parse(enJson)).not.toThrow();
        });

        const stateConfig = residentsConfigByState[stateCode];
        const isSpanishEnabled =
          !!stateConfig.translation.additionalLanguages.find((l) =>
            l.startsWith("es"),
          );

        test.runIf(hasFeature && isSpanishEnabled)("spanish", () => {
          const esJson = JSON.parse(readFileSync(esPath, "utf-8"));
          expect(() => stateSchema.parse(esJson)).not.toThrow();
        });
      },
    );
  },
);
