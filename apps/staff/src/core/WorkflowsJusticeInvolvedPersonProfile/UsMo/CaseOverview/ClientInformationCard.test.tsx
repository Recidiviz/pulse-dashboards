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
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { UsMoClientMetadata } from "~datatypes";

import { Client } from "../../../../WorkflowsStore";
import { ClientInformationCard } from "./ClientInformationCard";
import type { StructuredAddress } from "./utils";

// `ClientInformationCard` now hosts `<SARReports client={...} />` inline.
// SARReports depends on the StoreProvider context (feature variants, root
// store) and the react-query suspense boundary; stub it to a no-op here so
// these tests stay focused on the card's own Personal Details + Housing
// rendering. SARReports has its own dedicated test file.
vi.mock("./SARReports", () => ({
  SARReports: () => null,
}));

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

/** Build a `Client`-shaped stub with the two getters the card reads:
 * `metadata` (the US_MO subset) and `currentPhysicalResidenceAddressStructured`.
 * The MobX nature isn't relevant here — the card just reads off whichever
 * object it gets.
 *
 * Defaults are merged via object spread (not destructuring defaults) so that
 * callers can pass `{ birthdate: undefined }` / `{ address: undefined }` to
 * exercise the missing-field branches — destructuring defaults would treat
 * an explicit `undefined` the same as "not provided" and substitute the
 * default back in.
 */
type FakeClientOverrides = {
  sex?: string;
  birthdate?: Date;
  latestCycleSentences?: Sentences;
  address?: StructuredAddress;
};

function makeFakeClient(overrides: FakeClientOverrides = {}): Client {
  const merged = {
    sex: "MALE",
    birthdate: sampleBirthdate as Date | undefined,
    latestCycleSentences: sampleSentences,
    address: sampleAddress as StructuredAddress | undefined,
    ...overrides,
  };
  const metadata = {
    stateCode: "US_MO",
    sex: merged.sex,
    birthdate: merged.birthdate,
    latestCycleSentences: merged.latestCycleSentences,
  } as unknown as UsMoClientMetadata;
  return {
    metadata,
    currentPhysicalResidenceAddressStructured: merged.address,
  } as unknown as Client;
}

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
    render(<ClientInformationCard client={makeFakeClient()} />);
    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
  });

  test("renders Personal Details rows with formatted values", () => {
    render(<ClientInformationCard client={makeFakeClient()} />);

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
        client={makeFakeClient({
          latestCycleSentences: [
            {
              classificationSubtype: "C",
              classificationType: "",
              description: "Unlawful Possession of a Firearm",
              statute: "571.070",
            },
          ],
        })}
      />,
    );

    expect(
      screen.getByText(
        "Unlawful Possession of a Firearm (Class C) - RSMo 571.070",
      ),
    ).toBeInTheDocument();
  });

  test("renders '(Statute unknown)' for an offense with a null statute", () => {
    render(
      <ClientInformationCard
        client={makeFakeClient({
          latestCycleSentences: [
            {
              classificationSubtype: "D",
              classificationType: "Felony",
              description: "Out-of-State Offense",
              statute: null,
            },
          ],
        })}
      />,
    );

    expect(
      screen.getByText(
        "Out-of-State Offense (Class D Felony) (Statute unknown)",
      ),
    ).toBeInTheDocument();
  });

  test("renders the placeholder when sex is empty", () => {
    render(<ClientInformationCard client={makeFakeClient({ sex: "" })} />);
    expect(getValueFor("Gender")).toHaveTextContent("N/A");
  });

  test("renders the placeholder when birthdate is missing", () => {
    render(
      <ClientInformationCard
        client={makeFakeClient({ birthdate: undefined })}
      />,
    );
    expect(getValueFor("DOB")).toHaveTextContent("N/A");
  });

  test("renders the placeholder when latestCycleSentences is empty", () => {
    render(
      <ClientInformationCard
        client={makeFakeClient({ latestCycleSentences: [] })}
      />,
    );
    expect(getValueFor("Offenses")).toHaveTextContent("N/A");
  });

  test("renders multiple sentences in source order", () => {
    render(
      <ClientInformationCard
        client={makeFakeClient({
          sex: "FEMALE",
          birthdate: parseISO("1990-01-01"),
        })}
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
        client={makeFakeClient({
          sex: "female",
          birthdate: parseISO("1990-01-01"),
          latestCycleSentences: [],
        })}
      />,
    );
    expect(screen.getByText("Female")).toBeInTheDocument();
  });

  describe("Housing section", () => {
    test("renders street line and city/state/zip line", () => {
      render(<ClientInformationCard client={makeFakeClient()} />);

      expect(screen.getByText("Address")).toBeInTheDocument();

      const addressValue = getValueFor("Address");
      expect(addressValue).toHaveTextContent("2342 Lasalle St.");
      expect(addressValue).toHaveTextContent("St. Louis, MO 63104");
    });

    test("includes addressLine2 when present", () => {
      render(
        <ClientInformationCard
          client={makeFakeClient({
            address: {
              addressLine1: "100 Main St.",
              addressLine2: "Apt 4B",
              addressCity: "St. Louis",
              addressState: "MO",
              addressZip: "63104",
            },
          })}
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
          client={makeFakeClient({ address: undefined })}
        />,
      );
      expect(getValueFor("Address")).toHaveTextContent("N/A");
    });

    test("renders the placeholder when all address fields are empty", () => {
      render(
        <ClientInformationCard client={makeFakeClient({ address: {} })} />,
      );
      expect(getValueFor("Address")).toHaveTextContent("N/A");
    });

    test("omits the comma when state/zip are missing", () => {
      render(
        <ClientInformationCard
          client={makeFakeClient({
            address: {
              addressLine1: "100 Main St.",
              addressCity: "St. Louis",
            },
          })}
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
        client={makeFakeClient()}
        className="custom-class"
      />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  test("renders SARReports inline as a child of the CardFrame", () => {
    // The mocked SARReports renders nothing visible, so we just confirm the
    // card mounts cleanly and the CardFrame still contains the two visible
    // sections (Personal Details + Housing). The structural assertion that
    // the Reports section is a sibling of the others lives in the
    // `UsMoCaseOverview` integration test where SARReports is wired in for
    // real.
    const { container } = render(
      <ClientInformationCard client={makeFakeClient()} />,
    );
    const visibleSections =
      container.firstChild?.childNodes &&
      Array.from(container.firstChild.childNodes).filter(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && node.tagName === "SECTION",
      );
    expect(visibleSections?.length).toBe(2);
    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
  });
});
