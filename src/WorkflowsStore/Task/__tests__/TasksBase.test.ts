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

import tk from "timekeeper";

import { taskDueDateComparator } from "../TasksBase";
import { SupervisionTask } from "../types";

describe("taskDueDateComparator", () => {
  beforeEach(() => {
    tk.freeze(new Date(2023, 2, 7));
  });

  it("sorts by overdue dates when all tasks are overdue", () => {
    const tasks = [
      { dueDate: new Date(2020, 1, 1), type: "assessment" },
      { dueDate: new Date(2018, 1, 1), type: "contact" },
      { dueDate: new Date(2019, 1, 1), type: "homeVisit" },
    ] as SupervisionTask[];

    expect(tasks.sort(taskDueDateComparator).map((t) => t.type)).toEqual([
      "contact",
      "homeVisit",
      "assessment",
    ]);
  });

  it("sorts by upcoming by dates", () => {
    const tasks = [
      { dueDate: new Date(2025, 1, 4), type: "homeVisit" },
      { dueDate: new Date(2025, 1, 2), type: "assessment" },
      { dueDate: new Date(2025, 1, 3), type: "contact" },
    ] as SupervisionTask[];

    expect(tasks.sort(taskDueDateComparator).map((t) => t.type)).toEqual([
      "assessment",
      "contact",
      "homeVisit",
    ]);
  });
});
