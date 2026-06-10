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

import { render, screen, within } from "@testing-library/react";
import { parseISO } from "date-fns";
import tk from "timekeeper";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { UsMoClientMetadata } from "~datatypes";

import { ClientInformationCard } from "./ClientInformationCard";
import type { StructuredAddress } from "./utils";

type Sentences = UsMoClientMetadata["latestCycleSentences"];

const sampleBirthdate = parseISO("1988-03-14");

const sampleSentences: Sentences = [
  {
    classificationSubtype: "D",
    classificationType: "Felony",
    description: "Possession of Controlled Substance",
    statute: "579.015",
  },
  {
    classificationSubtype: "C",
    classificationType: "Felony",
    description: "Stealing",
    statute: "570.030",
  },
];

const sampleAddress: StructuredAddress = {
  addressLine1: "2342 Lasalle St.",
  addressCity: "St. Louis",
  addressState: "MO",
  addressZip: "63104",
};

/** Resolve a row's value element by walking from the row's label.
 * Card structure per section:
 *   <Section>
 *     <h3>{section heading}</h3>
 *     <Row><Label>{label}</Label><Value>{value}</Value></Row>...
 *   </Section>
 */
function getValueFor(label: string): HTMLElement {
  const labelEl = screen.getByText(label);
  const value = labelEl.nextElementSibling;
  if (!(value instanceof HTMLElement)) {
    throw new Error(`No sibling value element for label "${label}"`);
  }
  return value;
}

describe("ClientInformationCard", () => {
  beforeEach(() => {
    tk.freeze(new Date(2026, 4, 28)); // 2026-05-28 for deterministic age calc
  });

  afterEach(() => {
    tk.reset();
  });

  test("renders both section headings", () => {
    render(
      <ClientInformationCard
        sex="MALE"
        birthdate={sampleBirthdate}
        latestCycleSentences={sampleSentences}
        address={sampleAddress}
      />,
    );
    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
  });

  test("renders Personal Details rows with formatted values", () => {
    render(
      <ClientInformationCard
        sex="MALE"
        birthdate={sampleBirthdate}
        latestCycleSentences={sampleSentences}
        address={sampleAddress}
      />,
    );

    expect(screen.getByText("Gender")).toBeInTheDocument();
    expect(screen.getByText("Male")).toBeInTheDocument();

    expect(screen.getByText("DOB")).toBeInTheDocument();
    expect(screen.getByText("03/14/1988 (38 years old)")).toBeInTheDocument();

    expect(screen.getByText("Offenses")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Possession of Controlled Substance (Class D Felony) - RSMo 579.015",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Stealing (Class C Felony) - RSMo 570.030"),
    ).toBeInTheDocument();
  });

  test("omits classificationType from the offense row when it is empty", () => {
    render(
      <ClientInformationCard
        sex="MALE"
        birthdate={sampleBirthdate}
        latestCycleSentences={[
          {
            classificationSubtype: "C",
            classificationType: "",
            description: "Unlawful Possession of a Firearm",
            statute: "571.070",
          },
        ]}
        address={sampleAddress}
      />,
    );

    expect(
      screen.getByText(
        "Unlawful Possession of a Firearm (Class C) - RSMo 571.070",
      ),
    ).toBeInTheDocument();
  });

  test("renders the placeholder when sex is empty", () => {
    render(
      <ClientInformationCard
        sex=""
        birthdate={sampleBirthdate}
        latestCycleSentences={sampleSentences}
        address={sampleAddress}
      />,
    );
    expect(getValueFor("Gender")).toHaveTextContent("N/A");
  });

  test("renders the placeholder when birthdate is missing", () => {
    render(
      <ClientInformationCard
        sex="MALE"
        birthdate={undefined}
        latestCycleSentences={sampleSentences}
        address={sampleAddress}
      />,
    );
    expect(getValueFor("DOB")).toHaveTextContent("N/A");
  });

  test("renders the placeholder when latestCycleSentences is empty", () => {
    render(
      <ClientInformationCard
        sex="MALE"
        birthdate={sampleBirthdate}
        latestCycleSentences={[]}
        address={sampleAddress}
      />,
    );
    expect(getValueFor("Offenses")).toHaveTextContent("N/A");
  });

  test("renders multiple sentences in source order", () => {
    render(
      <ClientInformationCard
        sex="FEMALE"
        birthdate={parseISO("1990-01-01")}
        latestCycleSentences={sampleSentences}
        address={sampleAddress}
      />,
    );
    const offenseValue = getValueFor("Offenses");
    const rows = within(offenseValue).getAllByText(
      /\(Class [A-Z](?: \w+)?\) - RSMo /,
    );
    expect(rows.map((el) => el.textContent)).toEqual([
      "Possession of Controlled Substance (Class D Felony) - RSMo 579.015",
      "Stealing (Class C Felony) - RSMo 570.030",
    ]);
  });

  test("capitalizes mixed-case sex input", () => {
    render(
      <ClientInformationCard
        sex="female"
        birthdate={parseISO("1990-01-01")}
        latestCycleSentences={[]}
        address={sampleAddress}
      />,
    );
    expect(screen.getByText("Female")).toBeInTheDocument();
  });

  describe("Housing section", () => {
    test("renders street line and city/state/zip line", () => {
      render(
        <ClientInformationCard
          sex="MALE"
          birthdate={sampleBirthdate}
          latestCycleSentences={sampleSentences}
          address={sampleAddress}
        />,
      );

      expect(screen.getByText("Address")).toBeInTheDocument();

      const addressValue = getValueFor("Address");
      expect(addressValue).toHaveTextContent("2342 Lasalle St.");
      expect(addressValue).toHaveTextContent("St. Louis, MO 63104");
    });

    test("includes addressLine2 when present", () => {
      render(
        <ClientInformationCard
          sex="MALE"
          birthdate={sampleBirthdate}
          latestCycleSentences={sampleSentences}
          address={{
            addressLine1: "100 Main St.",
            addressLine2: "Apt 4B",
            addressCity: "St. Louis",
            addressState: "MO",
            addressZip: "63104",
          }}
        />,
      );
      const addressValue = getValueFor("Address");
      expect(addressValue).toHaveTextContent("100 Main St.");
      expect(addressValue).toHaveTextContent("Apt 4B");
      expect(addressValue).toHaveTextContent("St. Louis, MO 63104");
    });

    test("renders the placeholder when address is undefined", () => {
      render(
        <ClientInformationCard
          sex="MALE"
          birthdate={sampleBirthdate}
          latestCycleSentences={sampleSentences}
        />,
      );
      expect(getValueFor("Address")).toHaveTextContent("N/A");
    });

    test("renders the placeholder when all address fields are empty", () => {
      render(
        <ClientInformationCard
          sex="MALE"
          birthdate={sampleBirthdate}
          latestCycleSentences={sampleSentences}
          address={{}}
        />,
      );
      expect(getValueFor("Address")).toHaveTextContent("N/A");
    });

    test("omits the comma when state/zip are missing", () => {
      render(
        <ClientInformationCard
          sex="MALE"
          birthdate={sampleBirthdate}
          latestCycleSentences={sampleSentences}
          address={{ addressLine1: "100 Main St.", addressCity: "St. Louis" }}
        />,
      );
      const addressValue = getValueFor("Address");
      expect(addressValue).toHaveTextContent("100 Main St.");
      expect(addressValue).toHaveTextContent("St. Louis");
      expect(addressValue.textContent).not.toMatch(/,\s*$/); // no trailing comma
    });
  });

  test("forwards className to the outer card frame", () => {
    // `UsMoCaseOverview` applies `margin-bottom` via `styled(ClientInformationCard)`,
    // which only works if the card forwards `className` to its outermost element.
    const { container } = render(
      <ClientInformationCard
        className="custom-class"
        sex="MALE"
        birthdate={sampleBirthdate}
        latestCycleSentences={sampleSentences}
        address={sampleAddress}
      />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
