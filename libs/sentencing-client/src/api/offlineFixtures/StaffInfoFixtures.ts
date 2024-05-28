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

import { Staff } from "../APIClient";

export const StaffInfoFixture: Staff = {
  externalId: "ABC123",
  fullName: "",
  givenNames: "Firstname",
  surname: "Lastname",
  middleNames: null,
  nameSuffix: null,
  email: "firstlast@test.com",
  stateCode: "ID",
  Case: [
    {
      id: "f9c7ad42-949c-4f11-9ece-caf66df9f913",
      stateCode: "ID",
      staffId: "c007d72e-315a-4849-a11a-fb88828141dd",
      Client: {
        id: "87fb5f22-b92a-4443-a413-f0c36c3033bd",
        stateCode: "ID",
        fullName: "",
        givenNames: "Furman",
        surname: "Blanda",
        middleNames: null,
        nameSuffix: null,
        gender: "FTM",
        county: "Gwynedd County",
        birthDate: "1990-11-13T21:37:16.551Z",
      },
      clientId: "b76edbdf-bb13-44e7-82cd-d80a9ada3c03",
      dueDate: "2025-01-19T13:52:20.338Z",
      completionDate: "2025-02-22T08:00:12.071Z",
      sentenceDate: "2023-12-16T04:52:18.339Z",
      assignedDate: "2023-10-20T20:19:13.149Z",
      county: "Borders",
      lsirScore: "8836933717327872",
      lsirLevel: "6584455049248768",
      reportType: "k",
      primaryCharge: "Misdemeanor",
      secondaryCharges: [],
      previouslyIncarcerated: false,
      previouslyUnderSupervision: false,
      hasPreviousFelonyConviction: true,
      hasPreviousViolentOffenseConviction: false,
      hasPreviousSexOffenseConviction: false,
      previousTreatmentCourt: null,
      substanceUseDisorderDiagnosis: "None",
      asamCareRecommendation: null,
      mentalHealthDiagnoses: [],
      hasDevelopmentalDisability: false,
      veteranStatus: "NonVeteran",
      plea: "NotGuilty",
      hasOpenChildProtectiveServicesCase: false,
      needsToBeAddressed: [],
    },
  ],
};
