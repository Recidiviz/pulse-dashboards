// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { captureException } from "@sentry/react";
import { parseISO } from "date-fns";
import timekeeper from "timekeeper";

import { mockOpportunity } from "../../../../core/__tests__/testUtils";
import { Client } from "../../../Client";
import { hydrateStr, hydrateUntypedCriteria } from "../criteriaUtils";
vi.mock("@sentry/react");

const captureExceptionMock = vi.mocked(captureException);

afterEach(() => {
  vi.resetAllMocks();
  timekeeper.reset();
});

describe("hydrateUntypedCriteria", () => {
  it("preserves the order of criteriaCopy", () => {
    const criteriaCopy = {
      first: { text: "FIRST" },
      second: { text: "SECOND" },
      third: { text: "THIRD" },
      fourth: { text: "FOURTH" },
    };

    const recordCriteria = {
      first: {},
      fourth: {},
      third: {},
      second: {},
    };

    const hydrated = hydrateUntypedCriteria(
      recordCriteria,
      criteriaCopy,
      mockOpportunity,
    );
    expect(hydrated).toEqual([
      { text: "FIRST" },
      { text: "SECOND" },
      { text: "THIRD" },
      { text: "FOURTH" },
    ]);
  });

  it("skips criteria that are not present in recordCriteria", () => {
    const criteriaCopy = {
      first: { text: "FIRST" },
      second: { text: "SECOND" },
      third: { text: "THIRD" },
      fourth: { text: "FOURTH" },
    };

    const recordCriteria = {
      first: {},
      fourth: {},
    };

    const hydrated = hydrateUntypedCriteria(
      recordCriteria,
      criteriaCopy,
      mockOpportunity,
    );
    expect(hydrated).toEqual([{ text: "FIRST" }, { text: "FOURTH" }]);
  });

  it("skips criteria that are not present in criteriaCopy", () => {
    // Sometimes the record will contain reasons that we don't want to display to the user
    const criteriaCopy = {
      first: { text: "FIRST" },
      fourth: { text: "FOURTH" },
    };

    const recordCriteria = {
      first: {},
      fourth: {},
      third: {},
      second: {},
    };

    const hydrated = hydrateUntypedCriteria(
      recordCriteria,
      criteriaCopy,
      mockOpportunity,
    );
    expect(hydrated).toEqual([{ text: "FIRST" }, { text: "FOURTH" }]);
  });

  it("includes criteria no matter what the reason value is", () => {
    const criteriaCopy = {
      first: { text: "FIRST" },
      second: { text: "SECOND" },
      third: { text: "THIRD" },
      fourth: { text: "FOURTH" },
    };

    const recordCriteria = {
      first: null,
      third: {},
      second: { field: "value" },
    };

    const hydrated = hydrateUntypedCriteria(
      recordCriteria,
      criteriaCopy,
      mockOpportunity,
    );
    expect(hydrated).toEqual([
      { text: "FIRST" },
      { text: "SECOND" },
      { text: "THIRD" },
    ]);
  });
});

describe("hydrateStr", () => {
  it("matches at the beginning of the string", () => {
    const template = "{{verb}} at the beginning.";
    const criteria = { verb: "Matches" };
    const formatters = {};

    const result = hydrateStr(template, {
      criteria,
      formatters,
      opportunity: mockOpportunity,
    });

    expect(result).toEqual("Matches at the beginning.");
  });

  it("matches at the end of the string", () => {
    const template = "At the end, it {{verb}}";
    const criteria = { verb: "matches" };
    const formatters = {};

    const result = hydrateStr(template, {
      criteria,
      formatters,
      opportunity: mockOpportunity,
    });

    expect(result).toEqual("At the end, it matches");
  });

  it("matches in the middle of the string", () => {
    const template = "All I do is {{verb}} all day.";
    const criteria = { verb: "match" };
    const formatters = {};

    const result = hydrateStr(template, {
      criteria,
      formatters,
      opportunity: mockOpportunity,
    });

    expect(result).toEqual("All I do is match all day.");
  });

  it("matches adjacent tags", () => {
    const template = "All I do is {{verb}}{{verb}}*{{pause}}*{{verb}} all day.";
    const criteria = { verb: "match", pause: "breathe" };
    const formatters = {};

    const result = hydrateStr(template, {
      criteria,
      formatters,
      opportunity: mockOpportunity,
    });

    expect(result).toEqual("All I do is matchmatch*breathe*match all day.");
  });

  it("reads the record", () => {
    const template = "Our hero is {{record.metadata.status}}!";
    const criteria = {};
    const formatters = {};
    const record = { metadata: { status: "trapped in a template" } };
    const opportunity = { ...mockOpportunity, record };

    const result = hydrateStr(template, {
      criteria,
      formatters,
      opportunity,
    });

    expect(result).toEqual("Our hero is trapped in a template!");
  });

  it("doesn't escape html characters", () => {
    const template =
      "The result differs from the template by {{diffThreshold}}.";
    const criteria = { diffThreshold: `<2 "character's"[sic]` };
    const formatters = {};

    const result = hydrateStr(template, {
      criteria,
      formatters,
      opportunity: mockOpportunity,
    });

    expect(result).toEqual(
      `The result differs from the template by <2 "character's"[sic].`,
    );
  });

  describe("helpers", () => {
    test.each([
      ["lowerCase", "two words"],
      ["upperCase", "TWO WORDS"],
      ["titleCase", "Two Words"],
    ])("%s", (helper, expected) => {
      const template = `{{${helper} input}}`;
      const criteria = { input: "tWo WoRdS" };
      const formatters = {};

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });

      expect(result).toEqual(expected);
    });

    test.each([
      ["date", parseISO("2025-01-15"), "Jan 15, 2025"],
      ["daysPast", parseISO("2024-12-15"), "17"],
      ["daysUntil", parseISO("2025-01-15"), "14"],
      [
        "monthsOrDaysRemainingFromToday",
        parseISO("2025-01-15"),
        "14 more days",
      ],
      ["monthsOrDaysRemainingFromToday", parseISO("2025-01-02"), "1 more day"],
    ])("%s handles date objects", (helper, input, expected) => {
      timekeeper.freeze("2025-01-01T15:32");
      const template = `{{${helper} input}}`;
      const criteria = { input };
      const formatters = {};

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });

      expect(result).toEqual(expected);
    });

    test.each([
      ["date", "2025-01-15", "Jan 15, 2025"],
      ["daysPast", "2024-12-15", "17"],
      ["daysUntil", "2025-01-15", "14"],
      ["monthsOrDaysRemainingFromToday", "2025-01-15", "14 more days"],
      ["monthsOrDaysRemainingFromToday", "2025-01-02", "1 more day"],
    ])("%s handles ISO strings", (helper, input, expected) => {
      timekeeper.freeze("2025-01-01T15:32");
      const template = `{{${helper} input}}`;
      const criteria = { input };
      const formatters = {};

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });

      expect(result).toEqual(expected);
    });

    it("reports and falls back when a non-existent helper is called", () => {
      const template = "My favorite fondue is {{melt cheese}}!";
      const criteria = { cheese: "gruyere" };
      const formatters = {};

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });
      expect(result).toEqual("My favorite fondue is UNKNOWN!");
      expect(captureExceptionMock).toHaveBeenCalledOnce();
    });

    it("reports and falls back when a helper throws", () => {
      const template = "the loudest number is {{upperCase number}}";
      const criteria = { number: 5 };
      const formatters = {};

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });
      expect(result).toEqual("the loudest number is UNKNOWN");
      expect(captureExceptionMock).toHaveBeenCalledOnce();
    });
  });

  it("reports and falls back when a variable isn't found", () => {
    const template = "My favorite cheese is {{cheeze}}!";
    const criteria = { cheese: "gruyere" };
    const formatters = {};

    const result = hydrateStr(template, {
      criteria,
      formatters,
      opportunity: mockOpportunity,
    });
    expect(result).toEqual("My favorite cheese is UNKNOWN!");
    expect(captureExceptionMock).toHaveBeenCalledOnce();
  });

  it("reports and falls back when a tag has more than two elements", () => {
    const template = "My favorite cheese is {{i love cheese}}!";
    const criteria = { cheese: "gruyere" };
    const formatters = {};

    const result = hydrateStr(template, {
      criteria,
      formatters,
      opportunity: mockOpportunity,
    });
    expect(result).toEqual("My favorite cheese is UNKNOWN!");
    expect(captureExceptionMock).toHaveBeenCalledOnce();
  });

  describe("custom formatters", () => {
    it("can read the criteria", () => {
      const template = 'Let me hear you say "{{cheer}}"';
      const criteria = { shout: "Hooray!", cheerCount: 3 };
      const formatters = { cheer: (c: any) => c.shout.repeat(c.cheerCount) };

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });

      expect(result).toEqual('Let me hear you say "Hooray!Hooray!Hooray!"');
    });

    it("can read the record", () => {
      const template = "Our hero is {{status}}!";
      const criteria = {};
      const formatters = {
        status: ({ record }: any) => record.metadata.status,
      };
      const record = { metadata: { status: "trapped in a template" } };
      const opportunity = { ...mockOpportunity, record };

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity,
      });

      expect(result).toEqual("Our hero is trapped in a template!");
    });

    it("can read the person off the opportunity class", () => {
      const template =
        "The goat is named {{opportunity.person.displayPreferredName}}!";
      const criteria = {};
      const formatters = {};
      const opportunity = {
        ...mockOpportunity,
        person: { displayPreferredName: "Marigoat" } as Client,
      };

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity,
      });

      expect(result).toEqual("The goat is named Marigoat!");
    });

    it("reports and falls back when a formatter throws", () => {
      const template = "The meaning of life is {{meaningOfLife}}!";
      const criteria = {};
      const formatters = {
        meaningOfLife: () => {
          throw new Error("You asked too much");
        },
      };

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });
      expect(result).toEqual("The meaning of life is UNKNOWN!");
      expect(captureExceptionMock).toHaveBeenCalledOnce();
    });
  });

  describe("#if blocks", () => {
    it("includes a basic true if block", () => {
      const template = "The block is {{#if true}}included{{/if}}!";
      const criteria = { true: "true", false: null };
      const formatters = {};

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });

      expect(result).toEqual("The block is included!");
    });

    it("excludes a basic false if block", () => {
      const template = "The block is {{#if false}}included{{/if}}!";
      const criteria = { true: "true", false: null };
      const formatters = {};

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });

      expect(result).toEqual("The block is !");
    });

    it("includes the else arm of a false if block", () => {
      const template =
        "The block is {{#if false}}included{{else}}*crickets*{{/if}}!";
      const criteria = { true: "true", false: null };
      const formatters = {};

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });

      expect(result).toEqual("The block is *crickets*!");
    });

    it("handles nested if/else blocks", () => {
      const template =
        "The outer block is {{#if true}}true but the inner block is {{#if false}}also true{{else}}false{{/if}}!{{else}}none{{#if true}}of this{{else}}matters{{/if}}{{/if}}!";
      const criteria = { true: "true", false: null };
      const formatters = {};

      const result = hydrateStr(template, {
        criteria,
        formatters,
        opportunity: mockOpportunity,
      });

      expect(result).toEqual(
        "The outer block is true but the inner block is false!!",
      );
    });

    describe("eq helper", () => {
      it("is true with two equal fields", () => {
        const template =
          "{{a}} {{#if (eq a b)}}is{{else}}isn't{{/if}} the same as {{b}}";
        const criteria = { a: "foo", b: "foo" };
        const formatters = {};

        const result = hydrateStr(template, {
          criteria,
          formatters,
          opportunity: mockOpportunity,
        });

        expect(result).toEqual("foo is the same as foo");
      });

      it("is false with two unequal fields", () => {
        const template =
          "{{a}} {{#if (eq a b)}}is{{else}}isn't{{/if}} the same as {{b}}";
        const criteria = { a: "foo", b: "bar" };
        const formatters = {};

        const result = hydrateStr(template, {
          criteria,
          formatters,
          opportunity: mockOpportunity,
        });

        expect(result).toEqual("foo isn't the same as bar");
      });

      it("matches a field to a literal", () => {
        const template = `{{a}} {{#if (eq a "foo")}}is{{else}}isn't{{/if}} the same as "foo"`;
        const criteria = { a: "foo" };
        const formatters = {};

        const result = hydrateStr(template, {
          criteria,
          formatters,
          opportunity: mockOpportunity,
        });

        expect(result).toEqual(`foo is the same as "foo"`);
      });
    });
  });
});
