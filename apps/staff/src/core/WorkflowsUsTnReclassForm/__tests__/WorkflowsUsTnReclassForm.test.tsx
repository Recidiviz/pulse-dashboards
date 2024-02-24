import { templateValuesForFormData } from "..";

describe("templateValuesForFormData", () => {
  test("Passes through fields by default", () => {
    const out = templateValuesForFormData({
      omsId: "foo",
      q6Note: "bar",
    });
    expect(out.omsId).toBe("foo");
    expect(out.q6Note).toBe("bar");
  });

  test("Expands multiple choice", () => {
    const out = templateValuesForFormData({
      statusAtHearing: "GEN",
    });
    expect(out.statusAtHearingSelectedGEN).toBe(true);
    expect(out).not.toHaveProperty("statusAtHearingOther");
  });

  test("Expands multiple choice (other)", () => {
    const out = templateValuesForFormData({
      statusAtHearing: "SEG",
    });
    expect(out.statusAtHearingOther).toBe("SEG");
  });

  describe("CAF", () => {
    test("Full form", () => {
      const out = templateValuesForFormData({
        q1Selection: 0,
        q2Selection: 0,
        q3Selection: 0,
        q4Selection: 0,
        q5Selection: 0,
        q6Selection: 0,
        q7Selection: 0,
        q8Selection: 0,
        q9Selection: 0,
      });
      expect(out.q1Selected0).toBe(true);
      expect(out.q1Score).toBe(3);
      expect(out.scheduleAText).toBe("Complete Schedule B");
      expect(out.scheduleAScore).toBe(3);
      expect(out.q5Selected0).toBe(true);
      expect(out.q5Score).toBe(-2);
      expect(out.totalText).toBe("Minimum");
      expect(out.totalScore).toBe(4);
    });

    test("Blank in Schedule A", () => {
      const out = templateValuesForFormData({
        // q1 is missing
        q2Selection: 1,
        q3Selection: 3,
        q4Selection: 3,
        q5Selection: 0,
        q6Selection: 0,
        q7Selection: 0,
        q8Selection: 0,
        q9Selection: 0,
      });
      expect(out).not.toHaveProperty("q1Selected0");
      expect(out).not.toHaveProperty("q1Score");
      expect(out.scheduleAText).toBe("");
      expect(out.scheduleAScore).toBe("");
      expect(out.q5Selected0).toBe(true); // Schedule B questions are still filled out
      expect(out.q5Score).toBe(-2);
      expect(out.totalText).toBe("");
      expect(out.totalScore).toBe("");
    });

    test("Blank in Schedule B", () => {
      const out = templateValuesForFormData({
        q1Selection: 0,
        q2Selection: 0,
        q3Selection: 0,
        q4Selection: 0,
        // q5 is missing
        q6Selection: 0,
        q7Selection: 0,
        q8Selection: 0,
        q9Selection: 0,
      });
      expect(out.q1Selected0).toBe(true);
      expect(out.q1Score).toBe(3);
      expect(out.scheduleAText).toBe("Complete Schedule B");
      expect(out.scheduleAScore).toBe(3);
      expect(out).not.toHaveProperty("q5Selected0");
      expect(out).not.toHaveProperty("q5Score");
      expect(out.totalText).toBe("");
      expect(out.totalScore).toBe("");
    });

    test("High Schedule A Score", () => {
      const out = templateValuesForFormData({
        q1Selection: 2,
        q2Selection: 1,
        q3Selection: 3,
        q4Selection: 3,
        q5Selection: 0,
        q6Selection: 0,
        q7Selection: 0,
        q8Selection: 0,
        q9Selection: 0,
      });
      expect(out.scheduleAText).toBe("Maximum");
      expect(out.scheduleAScore).toBe(18);
      expect(out).not.toHaveProperty("q5Selected0"); // Schedule B is skipped
      expect(out).not.toHaveProperty("q5Score");
      expect(out.totalText).toBe("Maximum");
      expect(out.totalScore).toBe(18);
    });
  });
});
