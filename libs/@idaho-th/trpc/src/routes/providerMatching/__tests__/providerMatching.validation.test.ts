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

import { resolveProviderIdsByExactName } from "~@idaho-th/trpc/routes/providerMatching/providerMatching.service";
import { createHousingProvider } from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

describe("resolveProviderIdsByExactName", () => {
  it("drops a repeated name to a single id", async () => {
    const provider = await createHousingProvider(testPrismaClient, {
      name: "Sunrise House",
    });

    const ids = await resolveProviderIdsByExactName(testPrismaClient, [
      "Sunrise House",
      "Sunrise House",
    ]);

    expect(ids).toEqual([provider.id]);
  });

  it("caps the result at PREFERRED_PROVIDERS_MAX", async () => {
    const providers = await Promise.all(
      ["A House", "B House", "C House", "D House"].map((name) =>
        createHousingProvider(testPrismaClient, { name }),
      ),
    );

    const ids = await resolveProviderIdsByExactName(
      testPrismaClient,
      providers.map((provider) => provider.name),
    );

    expect(ids).toEqual(providers.slice(0, 3).map((provider) => provider.id));
  });
});
