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
import { MemoryRouter } from "react-router-dom";

import { AnnouncementBanner } from "./AnnouncementBanner";

const meta = {
  title: "Common UI/AnnouncementBanner",
  component: AnnouncementBanner,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    message:
      "**Starting January 1**, the way earned time is awarded is changing. " +
      "Completing an approved program can now reduce your sentence, and the " +
      "credits you have already earned will not be affected.",
    linkText: "Learn more",
    to: "/",
  },
} satisfies Meta<typeof AnnouncementBanner>;

export default meta;

type AnnouncementBannerStory = StoryObj<typeof meta>;

export const Default: AnnouncementBannerStory = {};
