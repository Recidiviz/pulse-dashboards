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

import { Description, Stories, Title } from "@storybook/addon-docs/blocks";
import type { Meta } from "@storybook/react";
import { ComponentProps, Suspense } from "react";
import { I18nextProvider } from "react-i18next";

import {
  copyFixtureEnglish,
  copyFixtureSpanish,
  prepareUsOzTranslations,
  TranslationsFixture,
} from "../../../fixtures/copy";
import { getSentenceDatesFixtureData } from "../../../fixtures/data";
import { SentenceDates } from "../SentenceDates";

export type SentenceDatesMeta = Meta<
  ComponentProps<typeof SentenceDates> & {
    copy?: TranslationsFixture;
    language: "en" | "es";
  }
>;

/**
 * Provides a set of default Storybook options that apply to most stories
 * about this component. It's recommended to extend this with at least a
 * `title` prop when using it in your module.
 */
export const baseMeta: SentenceDatesMeta = {
  component: SentenceDates,
  args: {
    stateCode: "US_OZ",
    language: "en",
    copy: {
      englishCopy: copyFixtureEnglish,
      spanishCopy: copyFixtureSpanish,
    },
    data: getSentenceDatesFixtureData(),
  },
  argTypes: {
    stateCode: { table: { disable: true } },
    // override this if you want to enable Spanish in your stories;
    // it's convenient to disable it by default so you can opt in to
    // adding extra copy fixtures only when necessary
    language: { table: { disable: true } },
  },
  // prevents extra args from being passed to the component itself and causing errors
  render: ({ data, componentOverrides, stateCode }) => {
    return (
      <SentenceDates
        data={data}
        componentOverrides={componentOverrides}
        stateCode={stateCode}
      />
    );
  },
  decorators: [
    (Story, ctx) => {
      const i18n = prepareUsOzTranslations({ ...ctx.args.copy });
      i18n.changeLanguage(ctx.args.language);

      return (
        <Suspense>
          <I18nextProvider i18n={i18n}>
            <Story />
          </I18nextProvider>
        </Suspense>
      );
    },
  ],
};

/**
 * Alternate template for autodocs that omits the "primary" story and controls
 * at the top of the page, including only the list of individual stories.
 */
export const SecondaryStoryPage = () => (
  <>
    <Title />
    <Description />
    <Stories />
  </>
);
