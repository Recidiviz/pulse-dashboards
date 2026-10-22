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

import { CaseNoteSummarySegment } from "../model/types";
import { getPaymentSegments } from "./getPaymentSegments";

const warn = jest.fn();

beforeEach(() => warn.mockClear());

const field = (fieldValue: string) => ({
  fieldValue,
  quotes: [`quote for ${fieldValue}`],
  lastVerifiedDate: "2026-07-22",
});

type PaymentFixture = Record<string, string | undefined>;

/**
 * Builds payments from plain strings, e.g. { paymentType: "fine", paymentStatus: "unpaid" }.
 * Fixtures are partial by design; the cast keeps each case to just the relevant fields.
 */
const build = (...payments: PaymentFixture[]) =>
  ({
    payments: payments.map((fields) =>
      Object.fromEntries(
        Object.entries(fields)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, field(value as string)]),
      ),
    ),
  }) as PrismaJson.CNIPaymentFields;

const render = (segments: CaseNoteSummarySegment[] | null) =>
  segments?.map(({ content }) => content).join("");

// "Client" as the subject reproduces the spec's examples verbatim.
const renderOne = (payment: PaymentFixture) =>
  render(getPaymentSegments(build(payment), warn, "Client"));

describe("getPaymentSegments", () => {
  describe("paid (3b)", () => {
    it.each([
      ["fine", "Client has paid their fine in full."],
      ["restitution", "Client has paid their restitution in full."],
      ["court_costs", "Client has paid their court costs in full."],
      ["supervision_fee", "Client has paid their supervision fee in full."],
      ["programming_fee", "Client has paid their programming fee in full."],
      ["drug_testing_fee", "Client has paid their drug testing fee in full."],
      [
        "electronic_monitoring_fee",
        "Client has paid their electronic monitoring fee in full.",
      ],
    ])("maps paymentType=%s", (paymentType, expected) => {
      expect(renderOne({ paymentType, paymentStatus: "paid" })).toBe(expected);
    });

    it("treats a zero balance as paid in full and cites amountOwed", () => {
      const result = getPaymentSegments(
        build({
          paymentType: "restitution",
          paymentStatus: "partial",
          amountOwed: "0",
        }),
        warn,
        "Client",
      );

      expect(render(result)).toBe("Client has paid their restitution in full.");
      expect(result?.find((segment) => segment.citation)?.citation).toEqual({
        quotes: ["quote for 0"],
        lastVerifiedDate: new Date(2026, 6, 22),
      });
    });
  });

  describe("waived (3c)", () => {
    it.each([
      ["fine", "The fine has been waived."],
      ["restitution", "Restitution has been waived."],
      ["court_costs", "Court costs have been waived."],
      ["supervision_fee", "Supervision fee has been waived."],
      ["programming_fee", "Programming fee has been waived."],
      ["drug_testing_fee", "Drug testing fee has been waived."],
      [
        "electronic_monitoring_fee",
        "Electronic monitoring fee has been waived.",
      ],
    ])("maps paymentType=%s", (paymentType, expected) => {
      expect(renderOne({ paymentType, paymentStatus: "waived" })).toBe(
        expected,
      );
    });

    it("stays waived even with a zero balance", () => {
      expect(
        renderOne({
          paymentType: "fine",
          paymentStatus: "waived",
          amountOwed: "0",
        }),
      ).toBe("The fine has been waived.");
    });
  });

  describe("partial (3d)", () => {
    it.each([
      [{}, "Client has partially paid their restitution."],
      [
        { amountPaid: "300", amountOwed: "500" },
        "Client has partially paid their restitution ($300 of $500 paid).",
      ],
      [
        { amountPaid: "300" },
        "Client has partially paid their restitution ($300 paid).",
      ],
      [
        { amountOwed: "200" },
        "Client has partially paid their restitution ($200 remaining).",
      ],
      [
        {
          amountPaid: "300",
          amountOwed: "500",
          paymentPlanAmount: "100",
          paymentPlanFrequency: "monthly",
        },
        "Client has partially paid their restitution ($300 of $500 paid), paying $100 monthly.",
      ],
    ])("renders restitution with %o", (fields, expected) => {
      expect(
        renderOne({
          paymentType: "restitution",
          paymentStatus: "partial",
          ...fields,
        }),
      ).toBe(expected);
    });

    it("renders court costs with a weekly plan", () => {
      expect(
        renderOne({
          paymentType: "court_costs",
          paymentStatus: "partial",
          amountPaid: "50",
          amountOwed: "150",
          paymentPlanAmount: "25",
          paymentPlanFrequency: "weekly",
        }),
      ).toBe(
        "Client has partially paid their court costs ($50 of $150 paid), paying $25 weekly.",
      );
    });

    it("omits amounts that aren't numbers", () => {
      expect(
        renderOne({
          paymentType: "restitution",
          paymentStatus: "partial",
          amountPaid: "some",
          amountOwed: "500",
          paymentPlanAmount: "a little",
          paymentPlanFrequency: "monthly",
        }),
      ).toBe("Client has partially paid their restitution ($500 remaining).");
    });
  });

  describe("payment plan fragment", () => {
    it.each([
      ["weekly", ", paying $100 weekly"],
      ["bi_weekly", ", paying $100 bi-weekly"],
      ["monthly", ", paying $100 monthly"],
      ["quarterly", ", paying $100 quarterly"],
      [undefined, ", paying $100"],
    ])("maps paymentPlanFrequency=%s", (paymentPlanFrequency, expected) => {
      expect(
        renderOne({
          paymentType: "restitution",
          paymentStatus: "partial",
          paymentPlanAmount: "100",
          paymentPlanFrequency,
        }),
      ).toBe(`Client has partially paid their restitution${expected}.`);
    });

    it("drops an unrecognized frequency and warns", () => {
      expect(
        renderOne({
          paymentType: "restitution",
          paymentStatus: "partial",
          paymentPlanAmount: "100",
          paymentPlanFrequency: "daily",
        }),
      ).toBe("Client has partially paid their restitution, paying $100.");
      expect(warn).toHaveBeenCalledWith(
        'no template fragment for paymentPlanFrequency="daily"',
      );
    });

    it("formats thousands and cents", () => {
      expect(
        renderOne({
          paymentType: "restitution",
          paymentStatus: "unpaid",
          amountOwed: "1200",
          paymentPlanAmount: "12.5",
        }),
      ).toBe("Client owes $1,200 in restitution, paying $12.50.");
    });
  });

  describe("unpaid (3e)", () => {
    it.each([
      [{ paymentType: "fine" }, "Client owes a fine."],
      [{ paymentType: "fine", amountOwed: "500" }, "Client owes a $500 fine."],
      [
        { paymentType: "restitution", amountOwed: "500" },
        "Client owes $500 in restitution.",
      ],
      [
        { paymentType: "court_costs", amountOwed: "350" },
        "Client owes $350 in court costs.",
      ],
      [{ paymentType: "supervision_fee" }, "Client owes supervision fees."],
      [
        { paymentType: "electronic_monitoring_fee", amountOwed: "150" },
        "Client owes $150 in electronic monitoring fees.",
      ],
      [
        {
          paymentType: "restitution",
          amountOwed: "500",
          abilityToPay: "unable",
        },
        "Client owes $500 in restitution and has stated inability to pay.",
      ],
      [
        {
          paymentType: "court_costs",
          amountOwed: "350",
          abilityToPay: "limited",
        },
        "Client owes $350 in court costs and has limited ability to pay.",
      ],
      [
        {
          paymentType: "restitution",
          amountOwed: "500",
          paymentPlanAmount: "100",
          paymentPlanFrequency: "monthly",
          abilityToPay: "unable",
        },
        "Client owes $500 in restitution, paying $100 monthly and has stated inability to pay.",
      ],
      [
        {
          paymentType: "drug_testing_fee",
          amountOwed: "150",
          paymentPlanAmount: "25",
          paymentPlanFrequency: "weekly",
        },
        "Client owes $150 in drug testing fees, paying $25 weekly.",
      ],
    ])("renders %o", (fields, expected) => {
      expect(renderOne({ paymentStatus: "unpaid", ...fields })).toBe(expected);
    });

    it("cites the status, amount, type, and ability phrases", () => {
      const result = getPaymentSegments(
        build({
          paymentType: "restitution",
          paymentStatus: "unpaid",
          amountOwed: "500",
          abilityToPay: "unable",
        }),
        warn,
        "Client",
      );

      expect(
        result
          ?.filter((segment) => segment.citation)
          .map(({ content }) => content),
      ).toEqual([
        "owes",
        " $500 in",
        " restitution",
        " and has stated inability to pay",
      ]);
    });
  });

  describe("multiple payments (3g)", () => {
    it("orders by paymentType and says 'They' after naming the client", () => {
      const result = getPaymentSegments(
        build(
          {
            paymentType: "restitution",
            paymentStatus: "unpaid",
            amountOwed: "500",
            paymentPlanAmount: "100",
            paymentPlanFrequency: "monthly",
            abilityToPay: "limited",
          },
          { paymentType: "drug_testing_fee", paymentStatus: "paid" },
        ),
        warn,
        "Mike Woods",
      );

      expect(render(result)).toBe(
        "Mike Woods has paid their drug testing fee in full. They owe $500 in restitution, paying $100 monthly and have limited ability to pay.",
      );
    });

    it("saves the name for the first sentence with a subject", () => {
      const result = getPaymentSegments(
        build(
          {
            paymentType: "supervision_fee",
            paymentStatus: "partial",
            amountPaid: "50",
            amountOwed: "200",
          },
          { paymentType: "court_costs", paymentStatus: "waived" },
          { paymentType: "fine", paymentStatus: "unpaid" },
        ),
        warn,
        "Mike Woods",
      );

      expect(render(result)).toBe(
        "Court costs have been waived. Mike Woods owes a fine. They have partially paid their supervision fee ($50 of $200 paid).",
      );
    });

    it("says 'They' throughout when the client was already named", () => {
      expect(
        render(
          getPaymentSegments(
            build({ paymentType: "fine", paymentStatus: "paid" }),
            warn,
          ),
        ),
      ).toBe("They have paid their fine in full.");
    });
  });

  describe("missing data", () => {
    it("falls back to the raw paymentType and warns", () => {
      expect(
        renderOne({ paymentType: "parking_ticket", paymentStatus: "waived" }),
      ).toBe("parking_ticket has been waived.");
      expect(warn).toHaveBeenCalledWith(
        'no template label for paymentType="parking_ticket"',
      );
    });

    it("drops a payment with an unrecognized status and warns", () => {
      expect(
        renderOne({ paymentType: "fine", paymentStatus: "in_collections" }),
      ).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        'unrecognized paymentStatus="in_collections"',
      );
    });

    it("drops a payment with no status and warns", () => {
      expect(renderOne({ paymentType: "fine" })).toBeUndefined();
      expect(warn).toHaveBeenCalledWith('payment "fine" has no paymentStatus');
    });

    it("returns null with no payments", () => {
      expect(getPaymentSegments(build(), warn, "Client")).toBeNull();
    });
  });
});
