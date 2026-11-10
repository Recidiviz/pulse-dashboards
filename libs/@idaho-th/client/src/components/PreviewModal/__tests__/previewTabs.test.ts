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

import type {
  ApplicationStage,
  StaffApplicationDetail,
} from "../../../interfaces/common";
import { PROVIDER_TABS, STAFF_TABS, TAB_IDS } from "../constants";
import { getVisibleStaffTabs } from "../StaffPreviewModal/utils/getVisibleStaffTabs";

vi.mock("../StaffPreviewModal/ProvidersTabBadge", () => ({
  ProvidersTabBadge: () => null,
}));
vi.mock("../StaffPreviewModal/TimelineTabBadge", () => ({
  StaffTimelineTabBadge: () => null,
  ProviderTimelineTabBadge: () => null,
}));
vi.mock("../../assets/document.svg?react", () => ({ default: () => null }));
vi.mock("../../assets/home.svg?react", () => ({ default: () => null }));
vi.mock("../../assets/tabler-icon-bed.svg?react", () => ({
  default: () => null,
}));
vi.mock("../../assets/tabler-icon-circle-check.svg?react", () => ({
  default: () => null,
}));
vi.mock("../../assets/tabler-icon-notes.svg?react", () => ({
  default: () => null,
}));
vi.mock("../../assets/timeline.svg?react", () => ({ default: () => null }));

describe("preview modal tabs", () => {
  it("gives staff every tab, Approvals between Providers and Home Plan", () => {
    expect(STAFF_TABS.map((tab) => tab.id)).toEqual([
      TAB_IDS.APPLICATION_DETAILS,
      TAB_IDS.PROVIDERS,
      TAB_IDS.APPROVALS,
      TAB_IDS.HOME_PLAN,
      TAB_IDS.DOCUMENTS,
      TAB_IDS.TIMELINE,
    ]);
  });

  const hasApprovals = (
    stage: ApplicationStage,
    legalCurrentStatus: string | null,
  ) =>
    getVisibleStaffTabs(STAFF_TABS, {
      stage,
      formData: { legalCurrentStatus },
    } as unknown as StaffApplicationDetail).some(
      (tab) => tab.id === TAB_IDS.APPROVALS,
    );

  it.each(["Termer", "Parole Violator", null])(
    "shows Approvals on a submitted %s case",
    (legalCurrentStatus) => {
      expect(hasApprovals("APPLICATION", legalCurrentStatus)).toBe(true);
    },
  );

  it("hides Approvals on a Rider case", () => {
    expect(hasApprovals("APPROVALS", " rider ")).toBe(false);
  });

  it("hides Approvals on a draft", () => {
    expect(hasApprovals("DRAFT", "Termer")).toBe(false);
  });

  it("hides the Providers and Approvals tabs from providers", () => {
    expect(PROVIDER_TABS.map((tab) => tab.id)).toEqual([
      TAB_IDS.APPLICATION_DETAILS,
      TAB_IDS.HOME_PLAN,
      TAB_IDS.DOCUMENTS,
      TAB_IDS.TIMELINE,
    ]);
    expect(PROVIDER_TABS.some((tab) => tab.id === TAB_IDS.PROVIDERS)).toBe(
      false,
    );
  });
});
