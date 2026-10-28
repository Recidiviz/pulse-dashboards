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
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";

import { semantics } from "../../../theme";
import {
  CheckboxGrid,
  CheckboxGridItem,
  type CheckboxGridItemProps,
  type CheckboxGridProps,
} from "../CheckboxGrid";
import { RadioGrid, RadioGridItem } from "../RadioGrid";

const { border, surface, text } = semantics;

function Months({
  initial = [],
  columns = 4,
  ...groupProps
}: Partial<CheckboxGridProps> & { initial?: string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <CheckboxGrid
      ariaLabel="Months"
      value={value}
      onChange={setValue}
      columns={columns}
      {...groupProps}
    >
      <CheckboxGridItem value="2026-10" description="2026">
        October
      </CheckboxGridItem>
      <CheckboxGridItem value="2026-11" description="2026">
        November
      </CheckboxGridItem>
      <CheckboxGridItem value="2026-12" description="Already added" disabled>
        December
      </CheckboxGridItem>
    </CheckboxGrid>
  );
}

function Locations({ initial }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <button type="button">Before</button>
      <RadioGrid
        ariaLabel="Facility"
        value={value}
        onChange={setValue}
        columns={3}
      >
        <RadioGridItem value="FCF">FCF</RadioGridItem>
        <RadioGridItem value="CTCF">CTCF</RadioGridItem>
        <RadioGridItem value="SCCF">SCCF</RadioGridItem>
      </RadioGrid>
    </>
  );
}

/** The grid that holds a group's options, inside the DS group's root. */
function gridOf(group: HTMLElement) {
  return group.firstElementChild as HTMLElement;
}

describe("CheckboxGrid", () => {
  it("renders each option as a checkbox named by its label and description", () => {
    render(<Months initial={["2026-10"]} />);

    expect(screen.getByRole("group", { name: "Months" })).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /October\s*2026/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /November\s*2026/ }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /December\s*Already added/ }),
    ).toBeDisabled();
  });

  it("lays the options out in the given number of equal columns", () => {
    render(<Months columns={4} />);

    const grid = gridOf(screen.getByRole("group", { name: "Months" }));
    expect(grid).toHaveStyleRule("display", "grid");
    expect(grid).toHaveStyleRule(
      "grid-template-columns",
      "repeat(4, minmax(0, 1fr))",
    );
    expect(grid.querySelectorAll("input[type=checkbox]")).toHaveLength(3);
  });

  it.each([0, -2, Number.NaN, Number.POSITIVE_INFINITY])(
    "uses one column when columns is %s",
    (columns) => {
      render(<Months columns={columns} />);

      expect(
        gridOf(screen.getByRole("group", { name: "Months" })),
      ).toHaveStyleRule("grid-template-columns", "repeat(1, minmax(0, 1fr))");
    },
  );

  it("rounds a fractional column count down", () => {
    render(<Months columns={2.5} />);

    expect(
      gridOf(screen.getByRole("group", { name: "Months" })),
    ).toHaveStyleRule("grid-template-columns", "repeat(2, minmax(0, 1fr))");
  });

  it.each<[string, CheckboxGridItemProps["description"]]>([
    ["an empty string", ""],
    ["false", false],
  ])(
    "names the option by its label alone when the description is %s",
    (_, description) => {
      render(
        <CheckboxGrid
          ariaLabel="Months"
          value={[]}
          onChange={() => undefined}
          columns={1}
        >
          <CheckboxGridItem value="2026-10" description={description}>
            October
          </CheckboxGridItem>
        </CheckboxGrid>,
      );

      expect(screen.getByRole("checkbox", { name: "October" })).toBeVisible();
    },
  );

  it("toggles options by click and with Space, but not when disabled", async () => {
    const user = userEvent.setup();
    render(<Months />);
    const october = screen.getByRole("checkbox", { name: /October/ });
    const november = screen.getByRole("checkbox", { name: /November/ });

    await user.click(screen.getByText("October"));
    expect(october).toBeChecked();

    await user.keyboard("{ArrowRight}");
    expect(november).toHaveFocus();
    await user.keyboard(" ");
    expect(november).toBeChecked();
    expect(october).toBeChecked();

    await user.click(screen.getByText("December"));
    expect(
      screen.getByRole("checkbox", { name: /December/ }),
    ).not.toBeChecked();
  });

  it("enters the group with one Tab stop and arrows past disabled options", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Months />
      </>,
    );
    const october = screen.getByRole("checkbox", { name: /October/ });

    await user.click(screen.getByRole("button", { name: "Before" }));
    await user.tab();
    expect(october).toHaveFocus();

    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(october).toHaveFocus();

    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it("disables every option when the group is disabled", () => {
    render(<Months disabled />);

    screen
      .getAllByRole("checkbox")
      .forEach((checkbox) => expect(checkbox).toBeDisabled());
  });

  it("rings a selected tile, outlines a focused one and greys a disabled one", () => {
    render(<Months initial={["2026-10"]} />);
    const group = screen.getByRole("group", { name: "Months" });

    expect(group).toHaveStyleRule("border-color", border.selected, {
      modifier: ".ds-checkbox:has(input:checked)",
    });
    expect(group).toHaveStyleRule(
      "outline",
      `${semantics.stroke.focus} solid ${border.focus}`,
      {
        modifier: ".ds-checkbox:has(input:focus-visible)",
      },
    );
    expect(group).toHaveStyleRule("background-color", surface.page, {
      modifier: ".ds-checkbox:has(input:disabled)",
    });
  });

  it("keeps an already-added tile unchecked and out of the keyboard order", async () => {
    const user = userEvent.setup();
    render(<Months initial={["2026-10"]} />);
    const december = screen.getByRole("checkbox", {
      name: /December\s*Already added/,
    });

    await user.click(december);
    await user.click(screen.getByText("October"));
    await user.keyboard("{End}");

    expect(december).toBeDisabled();
    expect(december).not.toBeChecked();
    expect(december).not.toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Months initial={["2026-11"]} columns={4} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("RadioGrid", () => {
  it("lays the options out in columns and checks the one clicked", async () => {
    const user = userEvent.setup();
    render(<Locations />);

    expect(
      gridOf(screen.getByRole("radiogroup", { name: "Facility" })),
    ).toHaveStyleRule("grid-template-columns", "repeat(3, minmax(0, 1fr))");

    await user.click(screen.getByText("CTCF"));

    expect(screen.getByRole("radio", { name: "CTCF" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "FCF" })).not.toBeChecked();
  });

  it("enters the group with one Tab stop and moves the choice with arrow keys", async () => {
    const user = userEvent.setup();
    render(<Locations initial="CTCF" />);

    await user.click(screen.getByRole("button", { name: "Before" }));
    await user.tab();
    expect(screen.getByRole("radio", { name: "CTCF" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    const sccf = screen.getByRole("radio", { name: "SCCF" });
    expect(sccf).toHaveFocus();
    expect(sccf).toBeChecked();

    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it("keeps the selection when a disabled option is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioGrid ariaLabel="Day" value="1" onChange={onChange} columns={7}>
        <RadioGridItem value="1">1</RadioGridItem>
        <RadioGridItem value="2" disabled>
          2
        </RadioGridItem>
      </RadioGrid>,
    );

    expect(screen.getByRole("radio", { name: "1" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "2" })).toBeDisabled();

    await user.click(screen.getByText("2"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "1" })).toBeChecked();
  });

  it("lays compact day tiles out in fixed-width columns with a solid selected fill", () => {
    render(
      <RadioGrid
        ariaLabel="Day"
        value="1"
        onChange={() => undefined}
        columns={13}
        size="compact"
      >
        <RadioGridItem value="1">1</RadioGridItem>
        <RadioGridItem value="2">2</RadioGridItem>
      </RadioGrid>,
    );
    const group = screen.getByRole("radiogroup", { name: "Day" });

    expect(gridOf(group)).toHaveStyleRule(
      "grid-template-columns",
      `repeat(13, ${semantics.tile.compactWidth})`,
    );
    expect(group).toHaveStyleRule("background-color", surface.selected, {
      modifier: ".ds-radio:has(input:checked)",
    });
    expect(group).toHaveStyleRule("color", text.onColor, {
      modifier: ".ds-radio:has(input:checked)",
    });
  });

  it("names a radio option by its label and description", () => {
    render(
      <RadioGrid
        ariaLabel="Facility"
        value="FCF"
        onChange={() => undefined}
        columns={2}
      >
        <RadioGridItem value="FCF" description="Panel A">
          FCF
        </RadioGridItem>
      </RadioGrid>,
    );

    expect(screen.getByRole("radio", { name: /FCF\s*Panel A/ })).toBeChecked();
  });

  it.each(["regular", "compact"] as const)(
    "has no axe violations with %s tiles",
    async (size) => {
      const { container } = render(
        <RadioGrid
          ariaLabel="Day"
          value="1"
          onChange={() => undefined}
          columns={3}
          size={size}
        >
          <RadioGridItem value="1">1</RadioGridItem>
          <RadioGridItem value="2">2</RadioGridItem>
          <RadioGridItem value="3" disabled>
            3
          </RadioGridItem>
        </RadioGrid>,
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
