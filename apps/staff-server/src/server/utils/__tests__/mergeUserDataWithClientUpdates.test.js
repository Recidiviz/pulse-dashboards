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

import { mergeUserDataWithClientUpdates } from "../mergeUserDataWithClientUpdates";

describe("mergeUserDataWithClientUpdates", () => {
  const baseRow = {
    state_code: "US_TX",
    transfer_type: "usTxAnnualReportStatus",
    region: "Region 1",
    office_name: "Houston DPO",
    client_name: "Jane Doe",
    sid_number: "12345",
    officer_name: "Officer Friendly",
    officer_id: "OFF1",
    unit_supervisor_name: "Sarge",
  };

  it("returns exactly one output row per input row, regardless of firestore matches", () => {
    const rows = [
      { ...baseRow, sid_number: "1" },
      { ...baseRow, sid_number: "2" },
      { ...baseRow, sid_number: "3" },
      { ...baseRow, sid_number: "4" },
    ];
    // sid 2 has a denial; sid 4 has both a denial AND a submitted update.
    // Neither should cause row fan-out or row drop.
    const updates = {
      2: {
        usTxAnnualReportStatus: {
          denial: true,
          submitted: false,
          denialReasons: ["FEES"],
          denialOtherReason: null,
          denialDate: new Date("2026-04-01T00:00:00Z"),
          submittedDate: null,
        },
      },
      4: {
        usTxAnnualReportStatus: {
          denial: true,
          submitted: true,
          denialReasons: ["DISCRETION"],
          denialOtherReason: "needs review",
          denialDate: new Date("2026-04-05T00:00:00Z"),
          submittedDate: new Date("2026-03-30T00:00:00Z"),
        },
      },
    };
    const result = mergeUserDataWithClientUpdates(rows, updates);
    expect(result).toHaveLength(rows.length);
    expect(result.map((r) => r.sid_number)).toEqual(["1", "2", "3", "4"]);
  });

  it("strips state_code and humanizes ARS transfer_type", () => {
    const result = mergeUserDataWithClientUpdates([baseRow], {});
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("state_code");
    expect(result[0].transfer_type).toBe("Annual Report Status");
  });

  it("humanizes ERS transfer_type", () => {
    const result = mergeUserDataWithClientUpdates(
      [{ ...baseRow, transfer_type: "usTxEarlyReleaseFromSupervision" }],
      {},
    );
    expect(result[0].transfer_type).toBe("Early Release from Supervision");
  });

  it("emits false booleans and blank detail columns when no firestore update exists", () => {
    const result = mergeUserDataWithClientUpdates([baseRow], {});
    expect(result[0]).toMatchObject({
      denial: "false",
      submitted: "false",
      denial_reason: "",
      denial_date: "",
      submitted_date: "",
    });
  });

  it("emits false booleans when externalId has updates for a different opportunity", () => {
    const result = mergeUserDataWithClientUpdates([baseRow], {
      12345: {
        usTxEarlyReleaseFromSupervision: {
          denial: true,
          submitted: false,
          denialReasons: ["FEES"],
          denialOtherReason: null,
          denialDate: new Date("2026-04-01T12:00:00Z"),
          submittedDate: null,
        },
      },
    });
    expect(result[0]).toMatchObject({
      denial: "false",
      submitted: "false",
      denial_reason: "",
      denial_date: "",
      submitted_date: "",
    });
  });

  it("combines denial reasons and free-text other reason into a single column", () => {
    const result = mergeUserDataWithClientUpdates([baseRow], {
      12345: {
        usTxAnnualReportStatus: {
          denial: true,
          submitted: false,
          denialReasons: ["FEES", "DISCRETION"],
          denialOtherReason: "needs court order",
          denialDate: new Date("2026-04-01T12:00:00Z"),
        },
      },
    });
    expect(result[0]).toMatchObject({
      denial: "true",
      submitted: "false",
      denial_reason: "FEES, DISCRETION, needs court order",
      denial_date: "04/01/2026",
      submitted_date: "",
    });
  });

  it("populates submitted columns when only submitted exists", () => {
    const result = mergeUserDataWithClientUpdates([baseRow], {
      12345: {
        usTxAnnualReportStatus: {
          denial: false,
          submitted: true,
          submittedDate: new Date("2026-03-15T08:00:00Z"),
        },
      },
    });
    expect(result[0]).toMatchObject({
      denial: "false",
      submitted: "true",
      denial_reason: "",
      denial_date: "",
      submitted_date: "03/15/2026",
    });
  });

  it("populates both denial and submitted columns when both exist", () => {
    const result = mergeUserDataWithClientUpdates([baseRow], {
      12345: {
        usTxAnnualReportStatus: {
          denial: true,
          submitted: true,
          denialReasons: ["FEES"],
          denialOtherReason: null,
          denialDate: new Date("2026-04-10T00:00:00Z"),
          submittedDate: new Date("2026-03-15T00:00:00Z"),
        },
      },
    });
    expect(result[0]).toMatchObject({
      denial: "true",
      submitted: "true",
      denial_reason: "FEES",
      denial_date: "04/10/2026",
      submitted_date: "03/15/2026",
    });
  });

  it.each([
    ["=", '=CMD("calc.exe")'],
    ["+", "+1+1"],
    ["-", "-2+3"],
    ["@", "@SUM(A1:A5)"],
    ["\\t", "\tinjected"],
    ["\\r", "\rinjected"],
  ])(
    "prefixes denial_reason starting with %s to neutralize CSV formula injection",
    (_label, payload) => {
      const result = mergeUserDataWithClientUpdates([baseRow], {
        12345: {
          usTxAnnualReportStatus: {
            denial: true,
            submitted: false,
            denialReasons: null,
            denialOtherReason: payload,
            denialDate: new Date("2026-04-01T00:00:00Z"),
            submittedDate: null,
          },
        },
      });
      expect(result[0].denial_reason).toBe(`'${payload}`);
    },
  );

  it("sanitizes formula-injection prefixes on baseline fields too (defense in depth)", () => {
    const malicious = '=HYPERLINK("http://evil.example.com")';
    const result = mergeUserDataWithClientUpdates(
      [{ ...baseRow, client_name: malicious }],
      {},
    );
    expect(result[0].client_name).toBe(`'${malicious}`);
  });

  it("leaves benign strings untouched", () => {
    const result = mergeUserDataWithClientUpdates(
      [{ ...baseRow, client_name: "Jane Doe" }],
      {
        12345: {
          usTxAnnualReportStatus: {
            denial: true,
            submitted: false,
            denialReasons: ["FEES"],
            denialOtherReason: "needs court order",
            denialDate: new Date("2026-04-01T00:00:00Z"),
            submittedDate: null,
          },
        },
      },
    );
    expect(result[0].client_name).toBe("Jane Doe");
    expect(result[0].denial_reason).toBe("FEES, needs court order");
  });

  it("emits denial=true with blank detail columns when boolean is set but details are absent", () => {
    const result = mergeUserDataWithClientUpdates([baseRow], {
      12345: {
        usTxAnnualReportStatus: {
          denial: true,
          submitted: false,
          denialReasons: null,
          denialOtherReason: null,
          denialDate: null,
          submittedDate: null,
        },
      },
    });
    expect(result[0]).toMatchObject({
      denial: "true",
      submitted: "false",
      denial_reason: "",
      denial_date: "",
      submitted_date: "",
    });
  });
});
