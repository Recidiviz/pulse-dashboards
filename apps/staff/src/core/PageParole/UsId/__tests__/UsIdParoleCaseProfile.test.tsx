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
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { paroleCasesFixtureByState } from "~datatypes";

import * as StoreProvider from "../../../../components/StoreProvider";
import { RootStore } from "../../../../RootStore";
import US_ID_CONFIG from "../../../../tenants/US_ID";
import { UsIdParoleCaseProfile } from "../UsIdParoleCaseProfile";

vi.mock("../../../../components/StoreProvider");

// No signed-in user, so the profile reads no PHI report and shows today's
// sections.
beforeEach(() => {
  vi.mocked(StoreProvider.useRootStore).mockReturnValue(new RootStore());
});

const CASE = {
  ...Object.values(paroleCasesFixtureByState.US_ID)[0],
  hearingHistory: [
    {
      hearingDate: "2018-01-15",
      hearingType: "Regular Hearing",
      hearingDecision: "Parole granted",
    },
  ],
};

// The nav list and the SectionAnchors are two separate lists in the same
// file, so an entry can drift to an id that nothing renders.
const NAV_LABELS = [
  "Offense Information",
  "Institutional History",
  "Hearing History",
];

describe("UsIdParoleCaseProfile", () => {
  // jsdom doesn't implement scrollIntoView. scrollToSection is a no-op when
  // no element carries the id, so a call proves the anchor is really there.
  const scrollIntoViewMock = vi.fn();

  beforeEach(() => {
    scrollIntoViewMock.mockClear();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    render(
      <MemoryRouter>
        <UsIdParoleCaseProfile
          caseDetail={CASE}
          config={US_ID_CONFIG.paroleConfig}
        />
      </MemoryRouter>,
    );
  });

  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it.each(NAV_LABELS)("scrolls to a real section for %s", async (label) => {
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: label }));

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  // The V1 design drops the PDF download; DownloadReportCard still exists,
  // unused, for the V2 designs.
  it("offers no report download", () => {
    expect(
      screen.queryByRole("button", { name: /download/i }),
    ).not.toBeInTheDocument();
  });
});

describe("UsIdParoleCaseProfile when the PHI report fails to load", () => {
  // A PHI with the report's feature variant on, whose reports Firestore
  // refuses to read.
  beforeEach(() => {
    const reportsForResident = {
      hydrationState: {
        status: "failed",
        error: new Error("permission denied"),
      },
      hydrate: vi.fn(),
      unsubscribe: vi.fn(),
    };
    vi.mocked(StoreProvider.useRootStore).mockReturnValue({
      firestoreStore: {
        buildParoleBoardReportsForResidentSubscription: () =>
          reportsForResident,
      },
      userStore: {
        activeFeatureVariants: { usIdParoleBoardReports: {} },
        canEditParoleBoardReports: true,
      },
    } as unknown as RootStore);
  });

  it("shows today's sections under a banner", async () => {
    render(
      <MemoryRouter>
        <UsIdParoleCaseProfile
          caseDetail={{ ...CASE, recordId: "us_id_000001" }}
          config={US_ID_CONFIG.paroleConfig}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn’t load the PHI report",
    );
    for (const label of NAV_LABELS) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText("Parole granted")).toBeInTheDocument();
  });
});

describe("UsIdParoleCaseProfile without hearing history", () => {
  it("still shows the Hearing History section, with its empty state", () => {
    render(
      <MemoryRouter>
        <UsIdParoleCaseProfile
          caseDetail={{ ...CASE, hearingHistory: [] }}
          config={US_ID_CONFIG.paroleConfig}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "Hearing History" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No hearing history on record"),
    ).toBeInTheDocument();
  });
});
