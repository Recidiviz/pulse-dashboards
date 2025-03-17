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

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { Programs } from "~@sentencing-server/trpc/routes/opportunity/types";

export const mswServer = setupServer(
  http.post("https://api.auntberthaqa.com/v3/authenticate", () => {
    return HttpResponse.json({
      success: true,
      data: {
        user_id: 1,
        token: "fake_auth_token",
      },
    });
  }),
  http.get(`https://api.auntberthaqa.com/v2/zipcodes/*/programsLite`, () => {
    return HttpResponse.json({
      programs: [
        {
          name: "fake_program",
          description: "fake_description",
          provider_name: "fake_provider",
          website_url: "fake_url",
          offices: [
            {
              phone_number: "fake_phone",
              address1: "fake_address1",
            },
          ],
          attribute_tags: ["fake_attribute"],
          service_tags: ["dental care", "addiction & recovery"],
        },
      ],
      count: 1,
    } satisfies Programs);
  }),
);
