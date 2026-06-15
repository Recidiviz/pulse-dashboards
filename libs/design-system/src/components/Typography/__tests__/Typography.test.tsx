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

import { render } from "@testing-library/react";

import {
  Body12,
  Body14,
  Body16,
  Body19,
  Body24,
  Body32,
  Body40,
  Body48,
  Header24,
  Header34,
  Header56,
  Header88,
} from "../Article";
import {
  Sans12,
  Sans14,
  Sans16,
  Sans18,
  Sans24,
  Serif24,
  Serif34,
} from "../UI";

describe("Typography", () => {
  describe("UI variants", () => {
    it.each([
      ["Sans12", Sans12],
      ["Sans14", Sans14],
      ["Sans16", Sans16],
      ["Sans18", Sans18],
      ["Sans24", Sans24],
      ["Serif24", Serif24],
      ["Serif34", Serif34],
    ])("mounts %s as a div", (_name, Component) => {
      const { container } = render(<Component>content</Component>);
      const el = container.firstChild as HTMLElement;
      expect(el.nodeName).toBe("DIV");
      expect(el).toHaveTextContent("content");
    });

    it("preserves displayName for Sans14", () => {
      expect(Sans14.displayName).toBe("Sans14");
    });
  });

  describe("Article variants", () => {
    it.each([
      ["Header88", Header88],
      ["Header56", Header56],
      ["Header34", Header34],
      ["Header24", Header24],
      ["Body48", Body48],
      ["Body40", Body40],
      ["Body32", Body32],
      ["Body24", Body24],
      ["Body19", Body19],
      ["Body16", Body16],
      ["Body14", Body14],
      ["Body12", Body12],
    ])("mounts %s as a div", (_name, Component) => {
      const { container } = render(<Component>hello</Component>);
      const el = container.firstChild as HTMLElement;
      expect(el.nodeName).toBe("DIV");
      expect(el).toHaveTextContent("hello");
    });

    it("preserves displayName for Body16", () => {
      expect(Body16.displayName).toBe("Body16");
    });
  });
});
