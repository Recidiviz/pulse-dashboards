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

import { formatSpeakerLabel } from "./formatMeetingSpeakers";

describe("formatSpeakerLabel", () => {
  const mockLabels = {
    supervisionStaff: "Test Supervision Label",
    facilitiesStaff: "Test Facilities Label",
    client: "Test Client Label",
    resident: "Test Resident Label",
  };
  const meetingStaffEmail = "officer@example.com";
  const jiiName = "Test Client";

  describe("base label is 'Client'", () => {
    it("returns the jii name", () => {
      const result = formatSpeakerLabel({
        baseLabel: "Client",
        meetingStaffEmail,
        personType: "client",
        labels: mockLabels,
        jiiName,
      });
      expect(result).toBe(jiiName);
    });
  });

  describe("base label is 'Staff'", () => {
    describe("user email matches meeting staff email", () => {
      it("returns the user's name when it exists", () => {
        const testOfficerName = "Test Officer Name";
        const result = formatSpeakerLabel({
          baseLabel: "Staff",
          meetingStaffEmail,
          personType: "client",
          labels: mockLabels,
          jiiName,
          currentUserEmail: meetingStaffEmail,
          currentUserName: testOfficerName,
        });
        expect(result).toBe(testOfficerName);
      });
      it("returns relevant config label when user name is not set", () => {
        const result = formatSpeakerLabel({
          baseLabel: "Staff",
          meetingStaffEmail,
          personType: "client",
          labels: mockLabels,
          jiiName,
          currentUserEmail: meetingStaffEmail,
          currentUserName: undefined,
        });
        expect(result).toBe(mockLabels.supervisionStaff);
      });
    });

    describe("user email doesn't match meeting staff email", () => {
      it("returns the supervisionOfficer label when personType is 'client'", () => {
        const result = formatSpeakerLabel({
          baseLabel: "Staff",
          meetingStaffEmail,
          personType: "client",
          labels: mockLabels,
          jiiName,
          currentUserEmail: "other@example.com",
        });
        expect(result).toBe(mockLabels.supervisionStaff);
      });
      it("returns the facilitiesOfficer label when personType is 'resident'", () => {
        const result = formatSpeakerLabel({
          baseLabel: "Staff",
          meetingStaffEmail,
          personType: "resident",
          labels: mockLabels,
          jiiName,
          currentUserEmail: "other@example.com",
        });
        expect(result).toBe(mockLabels.facilitiesStaff);
      });
    });
  });

  it("defaults to the base label when base label is not 'Client' or 'Staff'", () => {
    const result = formatSpeakerLabel({
      baseLabel: "Unknown",
      meetingStaffEmail,
      personType: "client",
      labels: mockLabels,
      jiiName,
    });
    expect(result).toBe("Unknown");
  });
});
