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

export const CaseDetailsFixture = {
  externalId: "12345",
  fullName: {
    givenNames: "Jon",
    surname: "Doe",
    middleNames: "B.",
    nameSuffix: null,
  },
  stateCode: "ID",
  gender: "Male",
  county: "Idaho County",
  birthDate: "Wed, 1 Jan 1980 15:41:00 GMT",
  dueDate: "Fri, 31 May 2024 20:41:00 GMT",
  completionDate: "Wed, 15 May 2024 21:42:00 GMT",
  sentenceDate: "Wed, 15 May 2024 21:41:00 GMT",
  assignedDate: "Wed, 1 May 2024 01:00:00 GMT",
  lsirScore: "31",
  lsirLevel: "Moderate",
  reportType: "PSI File Review Assigned",
  primaryCharge: "Felony",
  secondaryCharges: ["Misdemeanor"],
  veteranStatus: "Veteran",
  previouslyIncarcerated: true,
  previouslyUnderSupervision: true,
  hasPreviousFelonyConviction: true,
  hasPreviousViolentOffenseConviction: true,
  hasPreviousSexOffenseConviction: false,
  previousTreatmentCourt: null,
  substanceUseDisorderDiagnosis: "Moderate",
  hasOpenChildProtectiveServicesCase: false,
  hasDevelopmentalDisability: false,
  plea: "Guilty",
};
