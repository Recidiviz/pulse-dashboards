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

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Mock } from "vitest";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import useIsMobile from "../../../hooks/useIsMobile";
import { WorkflowsNavLayout } from "../WorkflowsNavLayout";

vi.mock("../../../components/StoreProvider");
vi.mock("../../../hooks/useIsMobile");
vi.mock("../../NavigationLayout", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  NavigationLayout: ({ children }: { children?: React.ReactNode }) => (
    <nav>{children}</nav>
  ),
  OverviewNavLinks: () => null,
}));
vi.mock("../WorkflowsBackButton", () => ({
  WorkflowsBackButton: () => <a href="/workflows/home">Home</a>,
}));

const useRootStoreMock = useRootStore as Mock;
const useFeatureVariantsMock = useFeatureVariants as Mock;
const useIsMobileMock = useIsMobile as Mock;

function renderLayout({
  limitedWidth,
  isLaptop,
}: {
  limitedWidth: boolean;
  isLaptop: boolean;
}) {
  useRootStoreMock.mockReturnValue({
    workflowsStore: { activePageIsTasks: false },
    tenantStore: { workflowsMethodologyUrl: "https://example.test" },
  });
  useFeatureVariantsMock.mockReturnValue({});
  useIsMobileMock.mockReturnValue({ isMobile: false, isLaptop });

  render(
    <MemoryRouter>
      <WorkflowsNavLayout limitedWidth={limitedWidth}>
        <div />
      </WorkflowsNavLayout>
    </MemoryRouter>,
  );
  return screen.getByText("Home").parentElement as HTMLElement;
}

describe("the back button wrapper", () => {
  // A missing semicolon after `padding-top` ran it into the `position: fixed`
  // that follows, so the browser discarded BOTH. Only the pages that set
  // `$fixed` lost the spacing, which is why Client and Resident looked wrong
  // while the caseload pages did not.
  it("keeps its top padding on a page that pins the button", () => {
    const wrapper = renderLayout({ limitedWidth: true, isLaptop: false });

    expect(wrapper).toHaveStyleRule("padding-top", "1.5rem");
    expect(wrapper).toHaveStyleRule("position", "fixed");
  });

  it("keeps its top padding on a page that does not", () => {
    const wrapper = renderLayout({ limitedWidth: false, isLaptop: false });

    expect(wrapper).toHaveStyleRule("padding-top", "1.5rem");
    expect(wrapper).not.toHaveStyleRule("position", "fixed");
  });
});
