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

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import * as StoreProvider from "../../../../components/StoreProvider";
import useIsMobile from "../../../../hooks/useIsMobile";
import { ParoleStore } from "../../../../ParoleStore/ParoleStore";
import { RootStore } from "../../../../RootStore";
import { ParoleDocketView } from "../ParoleDocketView";

vi.mock("../../../../components/StoreProvider");
vi.mock("../../../../hooks/useIsMobile");

const useRootStoreMock = vi.mocked(StoreProvider.useRootStore);

beforeEach(() => {
  vi.mocked(useIsMobile).mockReturnValue({ isMobile: false, isTablet: false });
  useRootStoreMock.mockReturnValue({
    paroleStore: new ParoleStore(new RootStore()),
  } as never);
});

describe("ParoleDocketView row links", () => {
  it("links each row to that individual's case profile by DOC ID", async () => {
    render(
      <MemoryRouter>
        <ParoleDocketView />
      </MemoryRouter>,
    );

    const links = await screen.findAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.getAttribute("href")).toMatch(/^\/parole\/case\/.+$/);
    });
  });
});
