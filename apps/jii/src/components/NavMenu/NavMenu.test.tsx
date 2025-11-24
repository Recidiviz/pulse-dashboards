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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MockInstance } from "vitest";

import { Permission } from "~@jii/auth";
import {
  RootStore,
  SingleResidentContextProvider,
  useRootStore,
  UserStore,
} from "~@jii/data";
import { TRANSLATOR_MODE_LANGUAGE_CODE } from "~@jii/translation";
import { ResidentRecord } from "~datatypes";

import { NavMenu } from "./NavMenu";

vi.mock("~@jii/data", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useRootStore: vi.fn(),
  };
});

let rootStore: RootStore;
let permissionSpy: MockInstance<(permission: Permission) => boolean>;

function simulateIframe() {
  vi.stubGlobal("parent", { foo: "bar" });
}

beforeEach(() => {
  permissionSpy = vi.spyOn(UserStore.prototype, "hasPermission");
  rootStore = new RootStore();
  vi.mocked(useRootStore).mockReturnValue(rootStore);
});

test("logout button", () => {
  render(
    <MemoryRouter>
      <NavMenu />
    </MemoryRouter>,
  );

  // open the menu
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));

  expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
});

test("no logout button", () => {
  simulateIframe();

  render(
    <MemoryRouter>
      <NavMenu links={[{ children: "test", to: "/test", end: true }]} />
    </MemoryRouter>,
  );

  // open the menu
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));

  expect(
    screen.queryByRole("button", { name: "Log out" }),
  ).not.toBeInTheDocument();
});

test("hide menu if empty", () => {
  // this means no logout button
  simulateIframe();

  // props contain no links
  render(
    <MemoryRouter>
      <NavMenu />
    </MemoryRouter>,
  );

  expect(
    screen.queryByRole("button", { name: "Menu" }),
  ).not.toBeInTheDocument();
});

test("hide translator controls", () => {
  render(
    <MemoryRouter>
      <NavMenu />
    </MemoryRouter>,
  );

  // open the menu
  fireEvent.click(screen.getByRole("button", { name: "Menu" }));

  expect(
    screen.queryByRole("button", { name: "Enter Translator Mode" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Toggle Eng/Esp" }),
  ).not.toBeInTheDocument();
});

describe("with translator permission", () => {
  beforeEach(() => {
    permissionSpy.mockImplementation((p) => p === "translator");

    render(
      <MemoryRouter>
        <NavMenu />
      </MemoryRouter>,
    );

    // open the menu
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  });

  test("show translator controls", () => {
    expect(
      screen.getByRole("button", { name: "Enter Translator Mode" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle Eng/Esp" }),
    ).toBeInTheDocument();
  });

  test("toggle translator mode", async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Enter Translator Mode" }),
    );

    const toggledButton = await screen.findByRole("button", {
      name: "Exit Translator Mode",
    });
    expect(toggledButton).toBeInTheDocument();
    expect(rootStore.translationStore.i18n.language).toBe(
      TRANSLATOR_MODE_LANGUAGE_CODE,
    );

    fireEvent.click(toggledButton);
    expect(
      await screen.findByRole("button", { name: "Enter Translator Mode" }),
    ).toBeInTheDocument();
    expect(rootStore.translationStore.i18n.language).toBe("en-US");
  });

  test("toggle English and Spanish", async () => {
    const toggleButton = screen.getByRole("button", {
      name: "Toggle Eng/Esp",
    });

    fireEvent.click(toggleButton);

    await waitFor(() =>
      expect(rootStore.translationStore.i18n.language).toBe("es"),
    );

    fireEvent.click(toggleButton);
    await waitFor(() =>
      expect(rootStore.translationStore.i18n.language).toBe("en"),
    );
  });
});

describe("resident info display", () => {
  const mockResident: ResidentRecord = {
    displayId: "12345",
    personName: {
      givenNames: "John",
      surname: "Doe",
      middleNames: "Q",
    },
    stateCode: "US_ID",
    pseudonymizedId: "pseudo-123",
  } as ResidentRecord;

  test("shows resident name and DOC ID when context is provided", () => {
    const contextValue = {
      resident: mockResident,
      opportunities: [],
    };

    render(
      <MemoryRouter>
        <SingleResidentContextProvider value={contextValue}>
          <NavMenu />
        </SingleResidentContextProvider>
      </MemoryRouter>,
    );

    // open the menu
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("DOC ID: 12345")).toBeInTheDocument();
  });

  test("does not show resident info when context is not provided", () => {
    render(
      <MemoryRouter>
        <NavMenu />
      </MemoryRouter>,
    );

    // open the menu
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));

    expect(screen.queryByText(/John/)).not.toBeInTheDocument();
    expect(screen.queryByText(/DOC ID/)).not.toBeInTheDocument();
  });
});
