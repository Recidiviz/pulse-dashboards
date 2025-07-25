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

import tk from "timekeeper";

import * as utils from "../formatStrings";
import { formatYearsMonthsFromNow } from "../formatStrings";

describe("formatStrings", () => {
  it("get gender from array genderValuetoLabel", () => {
    const testValueGender = "FEMALE";
    const dataAfterTest = utils.genderValueToHumanReadable(testValueGender);
    expect(dataAfterTest).toBe("Female");

    const dataErrorAfterTest = utils.genderValueToHumanReadable("White");
    expect(dataErrorAfterTest).toBe(undefined);
  });

  it("get race from  array raceValuetoLabel", () => {
    const testValueRace = "WHITE";
    const dataAfterTest = utils.raceValueToHumanReadable(testValueRace);
    expect(dataAfterTest).toBe("White");
  });

  it("to Html friendly", () => {
    const dataAfterTest = utils.toHtmlFriendly("Los Angeles");
    expect(dataAfterTest.toString()).toEqual("Los-Angeles");
  });

  it("to Html friendly with multiple spaces", () => {
    const dataAfterTest = utils.toHtmlFriendly("Los Angeles  California");
    expect(dataAfterTest.toString()).toEqual("Los-Angeles-California");
  });

  it("to Html friendly with html forbidden symbols", () => {
    const dataAfterTest = utils.toHtmlFriendly("A&P Grocery in California");
    expect(dataAfterTest.toString()).toEqual("A-P-Grocery-in-California");
  });

  it("to human readable", () => {
    const dataAfterTest = utils.toHumanReadable("Los-Angeles");
    expect(dataAfterTest.toString()).toEqual("Los Angeles");
  });

  it("toInt", () => {
    const dataForTest = "999: Lavena Banbridge";
    const dataAfterTest = utils.toInt(dataForTest);
    expect(dataAfterTest).toBe(999);

    const dataErrorAfterTest = utils.toInt("Banbridge");
    expect(dataErrorAfterTest).toBe(NaN);
  });

  it("safeToInt", () => {
    expect(utils.safeToInt("03")).toBe(3);
    expect(utils.safeToInt("03N")).toBe("03N");
    expect(utils.safeToInt("TSCL")).toBe("TSCL");
  });

  it("to title case", () => {
    const dataForTest = "LOS ANGELES";
    const dataAfterTest = utils.toTitleCase(dataForTest);
    expect(dataAfterTest).toEqual("Los Angeles");

    const dataErrorAfterTest = utils.toTitleCase("");
    expect(dataErrorAfterTest).toEqual("");
  });

  it("to title case with hyphen", () => {
    expect(utils.toTitleCase("barney rub-ble")).toEqual("Barney Rub-Ble");
  });

  it("to title case with slash", () => {
    expect(utils.toTitleCase("EITHER/or")).toEqual("Either/Or");
  });

  it("human readable title case with underscores", () => {
    const dataForTesting = "SAN_FRANCISCO_CALIFORNIA";
    const dataAfterTest = utils.humanReadableTitleCase(dataForTesting);
    expect(dataAfterTest).toEqual("San Francisco California");
  });

  it("human readable title case with hyphens", () => {
    const dataForTesting = "SAN-FRANCISCO-CALIFORNIA";
    const dataAfterTest = utils.humanReadableTitleCase(dataForTesting);
    expect(dataAfterTest).toEqual("San Francisco California");
  });

  it("human readable title case with a mix of punctuation", () => {
    const dataForTesting = "SAN_FRANCISCO-CALIFORNIA";
    const dataAfterTest = utils.humanReadableTitleCase(dataForTesting);
    expect(dataAfterTest).toEqual("San Francisco California");
  });

  it("number from officer id", () => {
    const dataForTest = "27: Patricia Mayonnaise";
    const dataAfterTest = utils.numberFromOfficerId(dataForTest);
    expect(dataAfterTest).toBe(27);
  });

  it("pluralize when it should not pluralize", () => {
    const result = utils.pluralize(1, "violation");
    expect(result).toEqual("1 violation");
  });

  it("pluralize when it should pluralize", () => {
    expect(utils.pluralize(2, "violation")).toEqual("2 violations");

    expect(utils.pluralize(0, "violation")).toEqual("0 violations");
  });

  it("getFirstName when there are more than one names in fullName", () => {
    const result = utils.getFirstName("Barney Rubble");
    expect(result).toEqual("Barney");
  });

  it("getFirstName when there is only one name", () => {
    const result = utils.getFirstName("4567");
    expect(result).toEqual("4567");
  });

  it("toPossessive", () => {
    const result = utils.toPossessive("Barney");
    expect(result).toEqual("Barney's");
  });

  it("generateEmailAddress", () => {
    const result = utils.generateEmailAddress("BRUBBLE", "bedrock.city.gov");
    expect(result).toEqual("brubble@bedrock.city.gov");
  });

  it("generateEmailAddress when there is no domain", () => {
    const result = utils.generateEmailAddress("BRUBBLE", undefined);
    expect(result).toEqual(undefined);
  });

  describe("labels formatting", () => {
    describe("getPeriodLabelFromMetricPeriodMonthsFilter", () => {
      it("formats the months label correctly", () => {
        const testDate = new Date("2020-02-14T11:01:58.135Z");
        tk.freeze(testDate);

        const periodMonth =
          utils.getPeriodLabelFromMetricPeriodMonthsFilter(12);
        expect(periodMonth).toBe("3/1/2019 to present");

        const emptyPeriodMonth =
          utils.getPeriodLabelFromMetricPeriodMonthsFilter(undefined);
        expect(emptyPeriodMonth).toBe("Invalid date to present");

        const incorrectPeriodMonth =
          utils.getPeriodLabelFromMetricPeriodMonthsFilter("period month");
        expect(incorrectPeriodMonth).toBe("Invalid date to present");
      });
    });

    describe("getTrailingLabelFromMetricPeriodMonthsFilter", () => {
      it("formats the trailing label for the time period correctly", () => {
        const periodMonth =
          utils.getTrailingLabelFromMetricPeriodMonthsFilter(5);
        expect(periodMonth).toBe("Last 0.4166666666666667 years");

        const emptyPeriodMonth =
          utils.getTrailingLabelFromMetricPeriodMonthsFilter(undefined);
        expect(emptyPeriodMonth).toBe("Last NaN years");

        const periodLastMonth =
          utils.getTrailingLabelFromMetricPeriodMonthsFilter("12");
        expect(periodLastMonth).toBe("Last 12 months");

        const periodCurrentMonth =
          utils.getTrailingLabelFromMetricPeriodMonthsFilter("1");
        expect(periodCurrentMonth).toBe("Current month");

        const period3Month =
          utils.getTrailingLabelFromMetricPeriodMonthsFilter("3");
        expect(period3Month).toBe("Last 3 months");

        const period6Month =
          utils.getTrailingLabelFromMetricPeriodMonthsFilter("6");
        expect(period6Month).toBe("Last 6 months");

        const period36Month =
          utils.getTrailingLabelFromMetricPeriodMonthsFilter("36");
        expect(period36Month).toBe("Last 3 years");
      });
    });

    it("correctly formats the officer label", () => {
      const officerLabel = "01 - BARNEY RUBBLE";
      const result = utils.formatOfficerLabel(officerLabel);
      expect(result).toEqual("01 - Barney Rubble");
    });

    it("returns an empty string when officer label is undefined", () => {
      const officerLabel = undefined;
      const result = utils.formatOfficerLabel(officerLabel);
      expect(result).toEqual("");
    });

    describe("#formatLargeNumber", () => {
      it("formats a number in the millions correctly", () => {
        const number = 2540001;
        const result = utils.formatLargeNumber(number);
        expect(result).toEqual("2.5M");
      });

      it("formats a number in the thousands correctly", () => {
        const number = 2501;
        const result = utils.formatLargeNumber(number);
        expect(result).toEqual("2,501");
      });

      it("formats a number in the hundreds correctly", () => {
        const number = 25;
        const result = utils.formatLargeNumber(number);
        expect(result).toEqual("25");
      });
    });

    describe("#formatDistrictLabel", () => {
      it("formats a district name with DO correctly", () => {
        const name = "BARNEY RUBBLE DO - 04";
        const result = utils.formatDistrictLabel(name);
        expect(result).toEqual("Barney Rubble DO - 04");
      });

      it("formats a district name with a - correctly", () => {
        const name = "BARNEY RUBBLE - 04";
        const result = utils.formatDistrictLabel(name);
        expect(result).toEqual("Barney Rubble - 04");
      });

      it("formats a district name without a -", () => {
        const name = "BBDFLT";
        const result = utils.formatDistrictLabel(name);
        expect(result).toEqual(name);
      });
    });
  });

  describe("toNumber", () => {
    it("returns an integer given a valid string value", () => {
      expect(utils.toNumber("12")).toBe(12);
    });

    it("returns the null if it is not a number", () => {
      expect(utils.toNumber("1b2")).toBeNull();
    });
  });

  describe("formatPercent", () => {
    it("preserves negative numbers when passed true", () => {
      expect(utils.formatPercent(-5, true)).toBe("-5%");
    });

    it("formats percentage as an absolute value when not passed true", () => {
      expect(utils.formatPercent(-5)).toBe("5%");
    });
  });

  describe("encrypting and decrypting strings", () => {
    beforeEach(() => {
      process.env = Object.assign(process.env, {
        VITE_CRYPTO_PASSPHRASE: "secret passphrase",
      });
    });

    it("enprypting then decrypting returns the same plainText string", () => {
      const plainText = "string to encrypt";
      const encrypted = utils.encrypt(plainText);
      expect(utils.decrypt(encrypted)).toBe(plainText);
    });

    it("encrypts and decrypts a string with special characters", () => {
      const plainText = "string_to_encrypt,##*/";
      const encrypted = utils.encrypt(plainText);
      expect(utils.decrypt(encrypted)).toBe(plainText);
    });
  });

  it("convert curly quotes to straight", () => {
    const withCurlyQuotes = "“ ” ‘ ’";
    const result = utils.convertCurlyQuotesToStraight(withCurlyQuotes);
    expect(result).toEqual("\" \" ' '");
  });

  describe("formatName", () => {
    it("formats a 'firstName lastName' correctly", () => {
      expect(utils.formatName("Barney Rubble")).toBe("B. Rubble");
    });

    it("formats a 'firstName middleInitial lastName' correctly", () => {
      expect(utils.formatName("Barney J. Rubble")).toBe("B. Rubble");
    });

    it("formats a name with more than 10 character last Name correctly", () => {
      expect(utils.formatName("Barney Rubbbbbbble")).toBe("B. Rubbbbbbbl...");
    });
  });

  describe("formatNameLastFirst", () => {
    const fullName = {
      givenNames: "Barney",
      middleNames: "Xavier",
      surname: "Rubble",
    };
    it("formats a full name correctly", () => {
      expect(utils.formatNameLastFirst(fullName)).toBe("Rubble, Barney X.");
    });

    it("formats a name without a middle name correctly", () => {
      const name = { ...fullName };
      delete name.middleNames;
      expect(utils.formatNameLastFirst(name)).toBe("Rubble, Barney");
    });

    it("formats a name without a middle or first name correctly", () => {
      const name = { ...fullName };
      delete name.middleNames;
      delete name.givenNames;
      expect(utils.formatNameLastFirst(name)).toBe("Rubble, N/A");
    });

    it("formats a name without a surname correctly", () => {
      const name = { ...fullName };
      delete name.surname;
      expect(utils.formatNameLastFirst(name)).toBe("Unknown, Barney X.");
    });

    it("formats an empty name correctly", () => {
      expect(utils.formatNameLastFirst({})).toBe("Unknown, N/A");
    });
  });

  describe("splitAuth0UserName", () => {
    it("Handles 'First Last'", () => {
      expect(utils.splitAuth0UserName("First Last")).toStrictEqual({
        firstName: "First",
        lastName: "Last",
      });
    });

    it("Handles 'Last, First'", () => {
      expect(utils.splitAuth0UserName("Last, First")).toStrictEqual({
        firstName: "First",
        lastName: "Last",
      });
    });

    it("Handles 'Last, First Middle'", () => {
      expect(utils.splitAuth0UserName("Last, First Middle")).toStrictEqual({
        firstName: "First Middle",
        lastName: "Last",
      });
    });

    it("Handles 'First Middle Last'", () => {
      expect(utils.splitAuth0UserName("First Middle Last")).toStrictEqual({
        firstName: "First Middle",
        lastName: "Last",
      });
    });
  });

  describe("formatYearsMonthsFromNow", () => {
    const TEST_DATE = new Date(2022, 2, 2);

    beforeEach(() => {
      tk.freeze(TEST_DATE);
    });

    it("rounds to years, months", () => {
      let res = formatYearsMonthsFromNow(new Date(2023, 3, 2));
      expect(res).toEqual("1 year, 1 month");

      res = formatYearsMonthsFromNow(new Date(2023, 3, 17));
      expect(res).toEqual("1 year, 1 month");
    });

    it("deals with dates in the past", () => {
      const res = formatYearsMonthsFromNow(new Date(2021, 1, 1));
      expect(res).toEqual("1 year, 1 month");
    });

    it("just shows years when no month offset", () => {
      let res = formatYearsMonthsFromNow(new Date(2023, 2, 2));
      expect(res).toEqual("1 year");

      res = formatYearsMonthsFromNow(new Date(2037, 2, 28));
      expect(res).toEqual("15 years");
    });

    it("just shows months when under a year remaining", () => {
      let res = formatYearsMonthsFromNow(new Date(2022, 5, 2));
      expect(res).toEqual("3 months");

      res = formatYearsMonthsFromNow(new Date(2022, 3, 2));
      expect(res).toEqual("1 month");

      res = formatYearsMonthsFromNow(new Date(2023, 2, 1));
      expect(res).toEqual("11 months");
    });
  });

  describe("formatDaysToYearsMonthsPast", () => {
    const TEST_DATE = new Date(2022, 2, 2);

    beforeEach(() => {
      tk.freeze(TEST_DATE);
    });

    it("rounds to years, months", () => {
      let res = utils.formatDaysToYearsMonthsPast(385);
      expect(res).toEqual("1 year");

      res = utils.formatDaysToYearsMonthsPast(412);
      expect(res).toEqual("1 year, 1 month");
    });

    it("uses just months for less than a year", () => {
      let res = utils.formatDaysToYearsMonthsPast(100);
      expect(res).toEqual("3 months");

      res = utils.formatDaysToYearsMonthsPast(102);
      expect(res).toEqual("3 months");
    });
  });

  describe("generateSerialListString", () => {
    const names = ["Walter Harris", "Jack Hernandez", "Casey Ramirez"];

    it("generates correct string for a single name", () => {
      const result = utils.generateSerialListString(names.slice(0, 1));
      expect(result).toEqual("Walter Harris");
    });

    it("generates correct string for two names", () => {
      const result = utils.generateSerialListString(names.slice(0, 2));
      expect(result).toEqual("Walter Harris and Jack Hernandez");
    });

    it("generates correct string for more than two names", () => {
      const result = utils.generateSerialListString(names);
      expect(result).toEqual(
        "Walter Harris, Jack Hernandez, and Casey Ramirez",
      );
    });
  });
  describe("formatDollarAmount", () => {
    it("format dollar amount within a sentence rounded to two decimal places", () => {
      const originalString = "Unpaid balance of $503.09834917";
      const result = utils.formatDollarAmount(originalString);
      expect(result).toEqual("Unpaid balance of $503.10");
    });

    it("format dollar amount within a sentence with no decimals", () => {
      const originalString = "Unpaid balance of $90";
      const result = utils.formatDollarAmount(originalString);
      expect(result).toEqual("Unpaid balance of $90");
    });
  });

  describe("htmlStringToString", () => {
    it("replaces <br> with new line", () => {
      const originalString = "submitted on DATE <br> by: PERSON <BR>";
      const result = utils.htmlStringToString(originalString);
      expect(result).toEqual(`submitted on DATE 
 by: PERSON 
`);
    });

    it("replaces nbsp with space", () => {
      const originalString = "submitted on DATE&nbsp;by: PERSON";
      const result = utils.htmlStringToString(originalString);
      expect(result).toEqual("submitted on DATE by: PERSON");
    });

    it("removes leading and trailing quotes", () => {
      const originalString = `"submitted on DATE by: PERSON"`;
      const result = utils.htmlStringToString(originalString);
      expect(result).toEqual("submitted on DATE by: PERSON");
    });

    it("replaces <p> tags with empty string", () => {
      const originalString = "submitted on DATE, <p>by: PERSON</p>";
      const result = utils.htmlStringToString(originalString);
      expect(result).toEqual("submitted on DATE, by: PERSON");
    });
  });

  describe("appendDateSuffixIfMissing", () => {
    const { appendDateSuffixIfMissing } = utils;

    // labels that already contain “Date” should stay the same
    test.each([
      ["Termination Date", "Termination Date"],
      ["termination DATE", "termination DATE"],
      ["Date", "Date"],
      ["Date of Termination", "Date of Termination"],
    ])("does not change '%s'", (input, expected) => {
      expect(appendDateSuffixIfMissing(input)).toBe(expected);
    });

    // labels lacking “Date” get “ Date” appended
    test.each([
      ["Termination", "Termination Date"],
      ["End", "End Date"],
      ["SomethingWithDateInBetween Date", "SomethingWithDateInBetween Date"],
    ])("appends 'Date' suffix to '%s'", (input, expected) => {
      expect(appendDateSuffixIfMissing(input)).toBe(expected);
    });

    // preserves casing of the word “date”
    test.each([
      ["end", "end date"],
      ["END", "END DATE"],
      ["End", "End Date"],
    ])("matches casing for '%s'", (input, expected) => {
      expect(appendDateSuffixIfMissing(input)).toBe(expected);
    });
  });
});
