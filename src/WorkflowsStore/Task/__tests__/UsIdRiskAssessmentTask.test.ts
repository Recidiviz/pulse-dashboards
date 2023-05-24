/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import { JusticeInvolvedPerson } from "../../types";
import { SupervisionTaskRecord } from "../types";
import UsIdRiskAssessmentTask from "../UsIdRiskAssessmentTask";

const mockPerson = {} as JusticeInvolvedPerson;
describe("UsIdRiskAssessmentTask", () => {
  let mockTaskRecord: SupervisionTaskRecord<"assessment">;
  let task;

  describe("additionalDetails", () => {
    test("lastAssessedOn is present", () => {
      mockTaskRecord = {
        type: "assessment",
        details: {
          lastAssessedOn: "2023-03-01",
          riskLevel: "LOW",
        },
        dueDate: "2023-04-01",
      } as SupervisionTaskRecord<"assessment">;
      task = new UsIdRiskAssessmentTask(mockTaskRecord, mockPerson);
      expect(task.additionalDetails).toEqual(
        "Last assessed on 3/1/23; Score: LOW"
      );
    });

    test("lastAssessedOn is null", () => {
      mockTaskRecord = {
        type: "assessment",
        details: {
          lastAssessedOn: null,
          riskLevel: "LOW",
        },
        dueDate: "2023-04-01",
      } as SupervisionTaskRecord<"assessment">;
      task = new UsIdRiskAssessmentTask(mockTaskRecord, mockPerson);
      expect(task.additionalDetails).toEqual("Score: LOW");
    });

    test("riskLevel is null", () => {
      mockTaskRecord = {
        type: "assessment",
        details: {
          lastAssessedOn: "2023-03-01",
          riskLevel: null,
        },
        dueDate: "2023-04-01",
      } as SupervisionTaskRecord<"assessment">;
      task = new UsIdRiskAssessmentTask(mockTaskRecord, mockPerson);
      expect(task.additionalDetails).toEqual("Last assessed on 3/1/23; ");
    });

    test("details is null", () => {
      mockTaskRecord = {
        type: "assessment",
        details: {
          lastAssessedOn: null,
          riskLevel: null,
        },
        dueDate: "2023-04-01",
      } as SupervisionTaskRecord<"assessment">;
      task = new UsIdRiskAssessmentTask(mockTaskRecord, mockPerson);
      expect(task.additionalDetails).toEqual("");
    });
  });
});
