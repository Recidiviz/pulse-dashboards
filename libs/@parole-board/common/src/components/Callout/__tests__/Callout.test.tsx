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

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { getContrast, mix, parseToRgb, rgb } from "polished";

import { Button } from "~design-system";

import { semantics } from "../../../theme";
import {
  Callout,
  CALLOUT_TONE_STYLES,
  CalloutLayout,
  CalloutTone,
} from "../Callout";

const TONES: CalloutTone[] = ["info", "success", "warning", "error"];
const LAYOUTS: CalloutLayout[] = ["inline", "strip"];
const LAYOUT_TONES = LAYOUTS.flatMap((layout) =>
  TONES.map((tone): [CalloutLayout, CalloutTone] => [layout, tone]),
);

// Lays a translucent colour over an opaque one.
function flatten(color: string, background: string): string {
  const parsed = parseToRgb(color);
  const alpha = "alpha" in parsed ? parsed.alpha : 1;
  return mix(alpha, rgb(parsed), background);
}

describe("Callout", () => {
  it.each(TONES)(
    "keeps the %s text above WCAG AA contrast on its fill and on the tag",
    (tone) => {
      const { background, text } = CALLOUT_TONE_STYLES[tone];
      const fill = flatten(background, semantics.surface.bg);

      expect(getContrast(text, fill)).toBeGreaterThanOrEqual(4.5);
      expect(getContrast(text, semantics.surface.bg)).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );

  it.each([
    ["info", "status"],
    ["success", "status"],
    ["warning", "alert"],
    ["error", "alert"],
  ] as const)("gives the %s tone role=%s", (tone, role) => {
    render(<Callout tone={tone}>Saved</Callout>);

    expect(screen.getByRole(role)).toHaveTextContent("Saved");
  });

  it.each(TONES)("drops the live role for %s when live is false", (tone) => {
    render(
      <Callout tone={tone} live={false}>
        Draft
      </Callout>,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("shows the title, the message, the detail, the action and the tag", () => {
    render(
      <Callout
        tone="error"
        title="Couldn't add the month"
        detail="Tried at 12:27 PM"
        action={<Button>Try again</Button>}
        tag="Draft"
      >
        The server didn't respond.
      </Callout>,
    );

    const callout = screen.getByRole("alert");
    expect(callout).toHaveTextContent("Couldn't add the month");
    expect(callout).toHaveTextContent("The server didn't respond.");
    expect(callout).toHaveTextContent("Tried at 12:27 PM");
    expect(callout).toHaveTextContent("Draft");
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("shows a title on its own, as the DRAFT strip does", () => {
    const { container } = render(
      <Callout
        tone="error"
        layout="strip"
        tag="Draft"
        title="September 2026 is back in draft."
        live={false}
      />,
    );

    expect(container).toHaveTextContent(
      "DraftSeptember 2026 is back in draft.",
    );
  });

  it("shows the tone icon only when there is no tag", () => {
    const { container, rerender } = render(
      <Callout tone="success">Published</Callout>,
    );
    expect(container.querySelector("svg")).not.toBeNull();

    rerender(
      <Callout tone="success" tag="Upload complete">
        Published
      </Callout>,
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("calls the action's onClick", () => {
    const onClick = vi.fn();
    render(
      <Callout
        tone="success"
        action={<Button onClick={onClick}>View public page</Button>}
      >
        Published
      </Callout>,
    );

    fireEvent.click(screen.getByRole("button", { name: "View public page" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has no dismiss button without onDismiss", () => {
    render(<Callout tone="info">Heads up</Callout>);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a string child as text, not HTML", () => {
    const { container } = render(
      <Callout tone="error">{"<b>bold</b>"}</Callout>,
    );

    expect(container.querySelector("b")).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent("<b>bold</b>");
  });

  describe("dismiss", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calls onDismiss once after the fade-out", () => {
      const onDismiss = vi.fn();
      render(
        <Callout tone="success" onDismiss={onDismiss}>
          Month added
        </Callout>,
      );

      const dismiss = screen.getByRole("button", { name: "Dismiss" });
      fireEvent.click(dismiss);
      fireEvent.click(dismiss);
      expect(onDismiss).not.toHaveBeenCalled();

      act(() => {
        vi.runAllTimers();
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("doesn't call onDismiss if the callout unmounts mid-fade", () => {
      const onDismiss = vi.fn();
      const { unmount } = render(
        <Callout tone="info" onDismiss={onDismiss}>
          Month added
        </Callout>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
      unmount();
      act(() => {
        vi.runAllTimers();
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("is reached by Tab after the action", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <Callout
          tone="info"
          action={<Button>Review</Button>}
          onDismiss={vi.fn()}
        >
          Month added
        </Callout>,
      );

      await user.tab();
      expect(screen.getByRole("button", { name: "Review" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Dismiss" })).toHaveFocus();
    });

    it("keeps focus on the button during the fade", () => {
      render(
        <Callout tone="info" onDismiss={vi.fn()}>
          Month added
        </Callout>,
      );

      const dismiss = screen.getByRole("button", { name: "Dismiss" });
      dismiss.focus();
      fireEvent.click(dismiss);

      expect(dismiss).toHaveFocus();
    });
  });

  it.each(LAYOUT_TONES)(
    "has no axe violations in the %s layout, %s tone",
    async (layout, tone) => {
      const { container } = render(
        <Callout
          tone={tone}
          layout={layout}
          title="March 2027"
          tag="Draft"
          detail="Published Oct 9, 2026"
          action={<Button>Publish</Button>}
          onDismiss={vi.fn()}
        >
          12 hearings are scheduled.
        </Callout>,
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
