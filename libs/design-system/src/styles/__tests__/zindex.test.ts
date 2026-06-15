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

import { zindex } from "../zindex";

describe("zindex tokens", () => {
  it("exposes toast above modal content", () => {
    expect(zindex.toast).toBeGreaterThan(zindex.modal.content);
  });

  it("orders modal content above backdrop", () => {
    expect(zindex.modal.content).toBeGreaterThan(zindex.modal.backdrop);
  });

  it("keeps tooltip below modal layers", () => {
    expect(zindex.tooltip).toBeLessThan(zindex.modal.backdrop);
  });

  it("matches the legacy values consumers depend on", () => {
    expect(zindex).toEqual({
      toast: 1002,
      modal: { backdrop: 1000, content: 1001 },
      tooltip: 500,
    });
  });
});
