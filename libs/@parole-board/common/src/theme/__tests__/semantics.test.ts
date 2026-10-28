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

import { getContrast, parseToRgb, rgb, rgba } from "polished";

import { palette, spacing, typography } from "~design-system";

import * as semantics from "../semantics";

// Every colour value in palette, nested groups included.
const paletteColors = new Set<string>(
  Object.values(palette).flatMap((value) =>
    typeof value === "string"
      ? [value]
      : Object.values(value).filter(
          (nested): nested is string => typeof nested === "string",
        ),
  ),
);

const colorGroups = {
  text: semantics.text,
  icon: semantics.icon,
  surface: semantics.surface,
  border: semantics.border,
  action: semantics.action,
  status: semantics.status,
};

// A translucent colour as it shows over an opaque background.
function flatten(color: string, background: string): string {
  const fg = parseToRgb(color);
  const bg = parseToRgb(background);
  const alpha = "alpha" in fg ? fg.alpha : 1;
  const blend = (top: number, bottom: number) =>
    Math.round(top * alpha + bottom * (1 - alpha));
  return rgb(
    blend(fg.red, bg.red),
    blend(fg.green, bg.green),
    blend(fg.blue, bg.blue),
  );
}

// Contrast of a colour on a surface, both laid over the white page.
function contrastOn(color: string, surface: string): number {
  const background = flatten(surface, palette.white);
  return getContrast(flatten(color, background), background);
}

// Status surfaces tint a palette tone: 10% for most, 20% for warning's amber.
const TINT_ALPHAS = [0.1, 0.2];

const AA_TEXT = 4.5;
const NON_TEXT = 3;

describe("semantics", () => {
  test.each(
    Object.entries(colorGroups).flatMap(([group, values]) =>
      Object.entries(values).map(([name, value]) => [
        `${group}.${name}`,
        value,
      ]),
    ),
  )("%s aliases a palette colour", (_name, value) => {
    const isStatusTint = [...paletteColors].some((color) =>
      TINT_ALPHAS.some((alpha) => rgba(color, alpha) === value),
    );
    expect(paletteColors.has(value) || isStatusTint).toBe(true);
  });

  test("space and type are the design system's spacing and typography", () => {
    expect(semantics.space).toBe(spacing);
    expect(semantics.type).toBe(typography);
  });

  test("radius and stroke are rem values", () => {
    for (const value of [
      ...Object.values(semantics.radius),
      ...Object.values(semantics.stroke),
    ]) {
      expect(value).toMatch(/^\d*\.?\d+rem$/);
    }
  });

  const textSurfaces = ["bg", "page", "card", "muted", "callout"] as const;

  test.each(
    (["primary", "secondary", "link"] as const).flatMap((role) =>
      textSurfaces.map((surface) => [role, surface] as const),
    ),
  )("text.%s passes AA on surface.%s", (role, surface) => {
    expect(
      contrastOn(semantics.text[role], semantics.surface[surface]),
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });

  test.each(["primary", "destructive"] as const)(
    "text.onColor passes AA on action.%s",
    (role) => {
      expect(
        contrastOn(semantics.text.onColor, semantics.action[role]),
      ).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  test("text.onColor passes AA on surface.selected", () => {
    expect(
      contrastOn(semantics.text.onColor, semantics.surface.selected),
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });

  test.each(["selected", "focus"] as const)(
    "border.%s shows at 3:1 on white",
    (role) => {
      expect(
        contrastOn(semantics.border[role], semantics.surface.bg),
      ).toBeGreaterThanOrEqual(NON_TEXT);
    },
  );

  test("the tile measurements are rem values or em tracking", () => {
    for (const value of Object.values(semantics.tile)) {
      expect(value).toMatch(/^(\d*\.?\d+r?em ?)+$/);
    }
  });

  test.each(["info", "success", "warning", "error"] as const)(
    "status.%s passes AA on white and on its own surface",
    (tone) => {
      const color = semantics.status[tone];
      expect(contrastOn(color, semantics.surface.bg)).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
      expect(contrastOn(color, semantics.surface[tone])).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
    },
  );

  test.each(Object.keys(semantics.icon) as (keyof typeof semantics.icon)[])(
    "icon.%s shows at 3:1 on white",
    (role) => {
      expect(
        contrastOn(semantics.icon[role], semantics.surface.bg),
      ).toBeGreaterThanOrEqual(NON_TEXT);
    },
  );

  test.each(["status", "icon"] as const)(
    "the warning %s colour passes AA on white and on surface.warning",
    (group) => {
      const color =
        group === "status" ? semantics.status.warning : semantics.icon.alert;
      for (const background of [
        semantics.surface.bg,
        semantics.surface.warning,
      ]) {
        expect(contrastOn(color, background)).toBeGreaterThanOrEqual(AA_TEXT);
      }
    },
  );

  test("surface.warning shows a different colour from surface.error", () => {
    expect(flatten(semantics.surface.warning, palette.white)).not.toBe(
      flatten(semantics.surface.error, palette.white),
    );
  });
});
