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
import React from "react";

import { renderWithLinks, renderWithLinksAndTrailing } from "../renderUtils";

function Fixture({ text }: { text: string }) {
  return <>{renderWithLinks(text)}</>;
}

describe("renderWithLinks", () => {
  it("passes through text with no tokens", () => {
    const { container } = render(<Fixture text="plain text" />);
    expect(container.textContent).toBe("plain text");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a link for a valid https token", () => {
    render(<Fixture text="[[link:https://example.com|Process Guide]]" />);
    const link = screen.getByRole("link", { name: "Process Guide" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("falls back to plain text for http URLs", () => {
    const { container } = render(
      <Fixture text="[[link:http://example.com|Guide]]" />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.textContent).toBe("Guide");
  });

  it("falls back to plain text for javascript: URLs", () => {
    const { container } = render(
      <Fixture text="[[link:javascript:alert(1)|Click me]]" />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.textContent).toBe("Click me");
  });

  it("falls back to plain text for malformed URLs", () => {
    const { container } = render(<Fixture text="[[link:not-a-url|Guide]]" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.textContent).toBe("Guide");
  });

  it("renders a token embedded in surrounding text", () => {
    const { container } = render(
      <Fixture text="See [[link:https://example.com|the guide]] for more info." />,
    );
    const link = screen.getByRole("link", { name: "the guide" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(container.textContent).toBe("See the guide for more info.");
  });

  it("renders multiple tokens in one string", () => {
    render(
      <Fixture text="Visit [[link:https://a.com|Link A]] and [[link:https://b.com|Link B]]." />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://a.com");
    expect(links[1]).toHaveAttribute("href", "https://b.com");
  });

  it("renders valid links alongside invalid ones", () => {
    const { container } = render(
      <Fixture text="[[link:https://good.com|Good]] and [[link:http://bad.com|Bad]]." />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://good.com");
    expect(container.textContent).toBe("Good and Bad.");
  });
});

describe("renderWithLinksAndTrailing", () => {
  function NoWrap({ children }: { children: React.ReactNode }) {
    return <span data-testid="no-wrap">{children}</span>;
  }

  function TrailingFixture({ text }: { text: string }) {
    return (
      <>
        {renderWithLinksAndTrailing(
          text,
          <span data-testid="trailing" />,
          NoWrap,
        )}
      </>
    );
  }

  it("wraps the last word and trailing node together", () => {
    const { container } = render(
      <TrailingFixture text="Check drug test results" />,
    );
    const noWrap = screen.getByTestId("no-wrap");
    expect(noWrap).toHaveTextContent("results");
    expect(
      noWrap.querySelector("[data-testid='trailing']"),
    ).toBeInTheDocument();
    expect(container.textContent).toBe("Check drug test results");
  });

  it("wraps a single-word text and trailing together", () => {
    render(<TrailingFixture text="Results" />);
    const noWrap = screen.getByTestId("no-wrap");
    expect(noWrap).toHaveTextContent("Results");
    expect(
      noWrap.querySelector("[data-testid='trailing']"),
    ).toBeInTheDocument();
  });

  it("wraps a trailing link token and trailing node together", () => {
    render(
      <TrailingFixture text="See [[link:https://example.com|the guide]]" />,
    );
    const noWrap = screen.getByTestId("no-wrap");
    expect(noWrap.querySelector("a")).toBeInTheDocument();
    expect(
      noWrap.querySelector("[data-testid='trailing']"),
    ).toBeInTheDocument();
  });

  it("keeps preceding text outside the wrapper", () => {
    const { container } = render(
      <TrailingFixture text="Must complete the process before the deadline" />,
    );
    const noWrap = screen.getByTestId("no-wrap");
    expect(noWrap).toHaveTextContent("deadline");
    expect(container.textContent).toBe(
      "Must complete the process before the deadline",
    );
    expect(noWrap.textContent).not.toContain("Must");
  });
});
