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
import { axe } from "jest-axe";
import { getContrast, parseToRgb, rem, rgb } from "polished";

import { semantics } from "../../../theme";
import { Badge, BadgeTone, badgeTones } from "../Badge";

const tones = Object.keys(badgeTones) as BadgeTone[];

// Flattens a possibly translucent colour onto an opaque backdrop, so the
// contrast check measures the colour a viewer actually sees.
function flatten(color: string, backdrop: string): string {
  const top = parseToRgb(color);
  const bottom = parseToRgb(backdrop);
  const alpha = "alpha" in top ? top.alpha : 1;
  const mix = (a: number, b: number) => Math.round(a * alpha + b * (1 - alpha));
  return rgb(
    mix(top.red, bottom.red),
    mix(top.green, bottom.green),
    mix(top.blue, bottom.blue),
  );
}

describe("Badge", () => {
  it.each(tones)("%s text meets WCAG AA on its fill", (tone) => {
    const { fill, text } = badgeTones[tone];
    const background = flatten(fill, semantics.surface.bg);

    expect(
      getContrast(flatten(text, background), background),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(tones)("%s renders its fill and text colours", (tone) => {
    render(<Badge tone={tone}>Draft</Badge>);

    const badge = screen.getByText("Draft");
    expect(badge).toHaveStyleRule("background-color", badgeTones[tone].fill);
    expect(badge).toHaveStyleRule("color", badgeTones[tone].text);
  });

  it("drops the Pill's right margin", () => {
    render(<Badge tone="neutral">Draft</Badge>);

    expect(screen.getByText("Draft")).toHaveStyleRule("margin-right", "0");
  });

  it("is shorter with tighter padding at the sm size", () => {
    render(
      <Badge tone="error" size="sm">
        Victim attending
      </Badge>,
    );

    const badge = screen.getByText("Victim attending");
    expect(badge).toHaveStyleRule("height", rem(semantics.space.lg));
    expect(badge).toHaveStyleRule("padding", `0 ${rem(semantics.space.sm)}`);
  });

  it("keeps the Pill's own size at the default md size", () => {
    render(<Badge tone="neutral">Draft</Badge>);

    expect(screen.getByText("Draft")).not.toHaveStyleRule(
      "height",
      rem(semantics.space.lg),
    );
  });

  it("uppercases by default but keeps the text as written", () => {
    render(<Badge tone="error">Cancelled</Badge>);

    const badge = screen.getByText("Cancelled");
    expect(badge).toHaveTextContent(/^Cancelled$/);
    expect(badge).toHaveStyleRule("text-transform", "uppercase");
  });

  it("keeps the case when uppercase is false", () => {
    render(
      <Badge tone="info" uppercase={false}>
        Holiday
      </Badge>,
    );

    expect(screen.getByText("Holiday")).not.toHaveStyleRule("text-transform");
  });

  it("passes className through", () => {
    render(
      <Badge tone="success" className="published-tag">
        Upload complete
      </Badge>,
    );

    expect(screen.getByText("Upload complete")).toHaveClass("published-tag");
  });

  // Axe skips color-contrast in jsdom, so the AA checks above are the
  // contrast tests; this one covers structure.
  it("has no axe violations for any tone at either size", async () => {
    const { container } = render(
      <>
        {tones.map((tone) => (
          <Badge key={`${tone}-md`} tone={tone}>
            {tone}
          </Badge>
        ))}
        {tones.map((tone) => (
          <Badge key={`${tone}-sm`} tone={tone} size="sm">
            {tone}
          </Badge>
        ))}
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
