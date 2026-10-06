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

import { act, renderHook } from "@testing-library/react";

import { useEditSession } from "../useEditSession";

const render = () => renderHook(() => useEditSession());

test("starts with no edit in progress", () => {
  const { result } = render();
  expect(result.current.session).toBeNull();
  expect(result.current.isConfirmingCancel).toBe(false);
});

test("start begins an edit on the question", () => {
  const { result } = render();
  act(() => result.current.start("needsCare"));
  expect(result.current.session).toEqual({ startQuestionId: "needsCare" });
});

test("asks to confirm a cancel, then closes the confirmation", () => {
  const { result } = render();
  act(() => result.current.askToConfirmCancel());
  expect(result.current.isConfirmingCancel).toBe(true);
  act(() => result.current.closeCancelConfirm());
  expect(result.current.isConfirmingCancel).toBe(false);
});

test("end clears the edit and any cancel confirmation", () => {
  const { result } = render();
  act(() => result.current.start("needsCare"));
  act(() => result.current.askToConfirmCancel());
  act(() => result.current.end());
  expect(result.current.session).toBeNull();
  expect(result.current.isConfirmingCancel).toBe(false);
});
