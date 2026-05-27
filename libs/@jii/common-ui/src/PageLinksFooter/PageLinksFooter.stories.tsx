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

import { PageLinksFooter } from "./PageLinksFooter";

const meta = {
  title: "Common UI/PageLinksFooter",
  component: PageLinksFooter,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    contents: {
      pageLinksHeading: "More information",
      pageLinks: [
        { children: "Page one", to: "/pages/one" },
        { children: "Page two", to: "/pages/two" },
        { children: "Page three", to: "/pages/three" },
      ],
      topLinkText: "Back to top",
    },
  },
} satisfies Meta<typeof PageLinksFooter>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
