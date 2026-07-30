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
import { MemoryRouter, Route, Routes } from "react-router-dom";

import * as StoreProvider from "../../../../components/StoreProvider";
import { ParoleStore } from "../../../../ParoleStore/ParoleStore";
import { RootStore } from "../../../../RootStore";
import { ParoleCaseProfile } from "../ParoleCaseProfile";

vi.mock("../../../../components/StoreProvider");

const useRootStoreMock = vi.mocked(StoreProvider.useRootStore);

beforeEach(() => {
  useRootStoreMock.mockReturnValue({
    paroleStore: new ParoleStore(new RootStore()),
  } as never);
});

function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/parole/case/:docId" element={<ParoleCaseProfile />} />
        <Route path="*" element={<ParoleCaseProfile />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ParoleCaseProfile", () => {
  it("renders a link back to the docket", async () => {
    renderAtPath("/parole/case/DOC-45821");

    const link = await screen.findByRole("link", { name: /back to docket/i });
    expect(link).toHaveAttribute("href", "/parole/docket");
  });

  it("renders NotFound when there is no docId in the route", () => {
    renderAtPath("/parole/case-missing-param");

    expect(screen.getByText("Oops Page Not Found")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /back to docket/i }),
    ).not.toBeInTheDocument();
  });

  describe("the identity/hearing info section", () => {
    it("renders the individual's identity, hearing, and sentence info", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(await screen.findByText("Anderson, Michael")).toBeInTheDocument();
      expect(screen.getByText("DOC-45821")).toBeInTheDocument();
      expect(screen.getByText(/Date of Birth:/)).toBeInTheDocument();
      expect(
        screen.getByText("Central State Correctional Facility"),
      ).toBeInTheDocument();
      expect(screen.getByText("Jennifer Martinez")).toBeInTheDocument();
      expect(screen.getByText("Minimum")).toBeInTheDocument();
      expect(screen.getByText("Sentence Information")).toBeInTheDocument();
      expect(
        screen.getByText("Parole Eligibility Date (PED)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Mandatory Release Date (MRD)"),
      ).toBeInTheDocument();
    });

    it("renders a hearing-scheduled badge when a hearing is upcoming", async () => {
      renderAtPath("/parole/case/DOC-45821");

      expect(await screen.findByText("Hearing Scheduled")).toBeInTheDocument();
      expect(screen.getByText("9:00 AM")).toBeInTheDocument();
    });

    it("renders no badge and a 'Not scheduled' hearing date when there is no upcoming hearing", async () => {
      renderAtPath("/parole/case/DOC-59402");

      expect(await screen.findByText("Harris, Patricia")).toBeInTheDocument();
      expect(screen.getByText("Not scheduled")).toBeInTheDocument();
      expect(screen.queryByText("Hearing Scheduled")).not.toBeInTheDocument();
    });
  });
});
