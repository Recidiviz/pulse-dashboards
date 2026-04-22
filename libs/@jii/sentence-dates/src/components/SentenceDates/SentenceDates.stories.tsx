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

import type { Meta, StoryObj } from "@storybook/react";
import { ComponentProps, Suspense } from "react";
import { I18nextProvider } from "react-i18next";

import { StateSentenceDatesResources } from "~@jii/translation";

import {
  copyFixtureEnglish,
  copyFixtureSpanish,
  prepareUsOzTranslations,
} from "../../fixtures/copy";
import { getSentenceDatesFixtureData } from "../../fixtures/data";
import { SentenceDates } from "./SentenceDates";

const meta: Meta<
  ComponentProps<typeof SentenceDates> & {
    copy: {
      englishCopy: StateSentenceDatesResources;
      spanishCopy: StateSentenceDatesResources;
    };
    language: "en" | "es";
  }
> = {
  component: SentenceDates,
  title: "SentenceDates/SentenceDates",
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: getSentenceDatesFixtureData(),
    stateCode: "US_OZ",
    language: "en",
    copy: {
      englishCopy: copyFixtureEnglish,
      spanishCopy: copyFixtureSpanish,
    },
  },
  argTypes: {
    stateCode: { table: { disable: true } },
    language: { options: ["en", "es"], control: "select" },
  },
  decorators: [
    (Story, ctx) => {
      const i18n = prepareUsOzTranslations(ctx.args.copy);
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
