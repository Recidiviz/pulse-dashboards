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

import { renderHook } from "@testing-library/react";

import { useRootStore } from "../components/StoreProvider/useRootStore";
import {
  type SingleResidentContext,
  useSingleResidentContextOptional,
} from "../contexts/SingleResidentContext";
import { useTrackEvent } from "./useTrackEvent";

vi.mock("../components/StoreProvider/useRootStore");
vi.mock("../contexts/SingleResidentContext");

const track = vi.fn();

beforeEach(() => {
  vi.mocked(useRootStore).mockReturnValue({
    userStore: { segmentClient: { track } },
  } as unknown as ReturnType<typeof useRootStore>);
});

const withResident = (pseudonymizedId: string) =>
  vi.mocked(useSingleResidentContextOptional).mockReturnValue({
    resident: { pseudonymizedId },
  } as SingleResidentContext);

test("adds the resident's pseudo ID", () => {
  withResident("anonres001");
  const { result } = renderHook(() => useTrackEvent());

  result.current("frontend_reentry_checklist_why_opened", {
    itemId: "housing",
  });

  expect(track).toHaveBeenCalledExactlyOnceWith(
    "frontend_reentry_checklist_why_opened",
    { itemId: "housing", justiceInvolvedPersonPseudoId: "anonres001" },
  );
});

test("leaves out the pseudo ID when no resident is on the page", () => {
  vi.mocked(useSingleResidentContextOptional).mockReturnValue(undefined);
  const { result } = renderHook(() => useTrackEvent());

  result.current("frontend_reentry_checklist_why_opened", {
    itemId: "housing",
  });

  const [, properties] = track.mock.calls[0];
  expect(properties).toEqual({ itemId: "housing" });
  // Segment serializes with JSON, so an undefined key never gets sent
  expect(JSON.parse(JSON.stringify(properties))).not.toHaveProperty(
    "justiceInvolvedPersonPseudoId",
  );
});

test("returns the same function across renders", () => {
  withResident("anonres001");
  const { result, rerender } = renderHook(() => useTrackEvent());
  const first = result.current;

  rerender();

  expect(result.current).toBe(first);
});
