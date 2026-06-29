// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

// import the original type declarations
import "i18next";

// import all namespaces (for the default language, only)
import common from "../namespaces/common/resources/en.json";
import US_AR from "../namespaces/US_AR/resources/en.json";
import US_AZ from "../namespaces/US_AZ/resources/en";
import US_CO from "../namespaces/US_CO/resources/en.json";
import US_ID from "../namespaces/US_ID/resources/en";
import US_MA from "../namespaces/US_MA/resources/en.json";
import US_NC from "../namespaces/US_NC/resources/en.json";
import US_ND from "../namespaces/US_ND/resources/en.json";
import US_NE from "../namespaces/US_NE/resources/en.json";
import US_TN from "../namespaces/US_TN/resources/en";
import {
  CombinedProgramCatalogResources,
  CommonProgramCatalogResources,
  StateProgramCatalogResources,
} from "../programCatalog/types";
import {
  CombinedSentenceDatesResources,
  CommonSentenceDatesResources,
  StateSentenceDatesResources,
} from "../sentenceDates/types";

/**
 * Helper that manages state-specific typing for the Program Catalog feature.
 * Inputs that don't include Program Catalog resources are passed through unchanged.
 * Those that conform to the type for state resources containing Program Catalog translations
 * are augmented with a type that reflects the final i18next output that merges the
 * state resources with the common resources; this reflects the fallback configured
 * in CustomTypeOptions below, which is otherwise not fully inferred by i18next-react.
 */
type WithCorrectedProgramCatalog<T> = T extends StateProgramCatalogResources
  ? Omit<T, "programs"> & {
      programs: Omit<
        T["programs"],
        keyof CombinedProgramCatalogResources["programs"]
      > &
        CombinedProgramCatalogResources["programs"];
    }
  : T;

/**
 * Helper that manages state-specific typing for the Sentence Dates feature.
 * Inputs that don't include Sentence Dates resources are passed through unchanged.
 * Those that conform to the type for state resources containing Sentence Dates translations
 * are augmented with a type that reflects the final i18next output that merges the
 * state resources with the common resources; this reflects the fallback configured
 * in CustomTypeOptions below, which is otherwise not fully inferred by i18next-react.
 */
type WithCorrectedSentenceDates<T> = T extends StateSentenceDatesResources
  ? // omitting and replacing this property with this predefined type ensures that we
    // have a clean final object type; if we tried to merge the input with its augmentations
    // here we would wind up with a union of the incomplete and complete versions that
    // would cause spurious type failures when accessing translations. We are making an assertion
    // here so please note that we are relying on unit tests in src/sentenceDates to back it up
    Omit<T, "sentenceDates"> & {
      sentenceDates: CombinedSentenceDatesResources["sentenceDates"];
    }
  : T;

/**
 * Applies all feature-specific resource corrections to a state's translation resources.
 * Each helper is a pass-through for states that don't include the relevant feature
 * resources, so this can be applied uniformly to all states.
 */
type WithStateCorrections<T> = WithCorrectedProgramCatalog<
  WithCorrectedSentenceDates<T>
>;

export interface I18nResources {
  // requires the common namespace to include valid program catalog and sentence dates resources
  common: typeof common extends CommonSentenceDatesResources &
    CommonProgramCatalogResources
    ? typeof common
    : never;
  // feature-specific resources are optional; WithStateCorrections is a no-op for features a state doesn't include
  US_AZ: WithStateCorrections<typeof US_AZ>;
  US_AR: WithStateCorrections<typeof US_AR>;
  US_CO: WithStateCorrections<typeof US_CO>;
  US_ID: WithStateCorrections<typeof US_ID>;
  US_MA: WithStateCorrections<typeof US_MA>;
  US_NC: WithStateCorrections<typeof US_NC>;
  US_ND: WithStateCorrections<typeof US_ND>;
  US_NE: WithStateCorrections<typeof US_NE>;
  US_TN: WithStateCorrections<typeof US_TN>;
  // this is a fake state that we only use for testing. Its resources have to be
  // explicitly injected such that it will not normally work at runtime, but we declare
  // the type here for convenience (otherwise various test cases will fail to typecheck)
  US_OZ: CombinedSentenceDatesResources;
}

declare module "i18next" {
  // extends CustomTypeOptions
  interface CustomTypeOptions {
    resources: I18nResources;
    strictKeyChecks: true;
    enableSelector: true;
    // resource typing above depends on this fallback configuration!
    // do not change it without also verifying the resource type assertions.
    // this should also match the options that are actually passed to the i18next instance
    fallbackNS: "common";
  }
}
