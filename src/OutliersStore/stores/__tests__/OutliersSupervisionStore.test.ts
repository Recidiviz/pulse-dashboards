// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { cloneDeep } from "lodash";
import { ValuesType } from "utility-types";

import { RootStore } from "../../../RootStore";
import { OutliersConfigFixture } from "../../models/offlineFixtures/OutliersConfig";
import { OutliersConfig } from "../../models/OutliersConfig";
import { OutliersStore } from "../../OutliersStore";
import { OutliersSupervisionStore } from "../OutliersSupervisionStore";

test("adverse metric configs", () => {
  const configFixture = cloneDeep(OutliersConfigFixture);
  const favorableMetricConfig: ValuesType<OutliersConfig["metrics"]> = {
    name: "transfers_to_liberty",
    bodyDisplayName: "successful discharge rate",
    titleDisplayName: "Successful discharge rate",
    eventName: "successful discharges",
    outcomeType: "FAVORABLE",
  };
  configFixture.metrics.push(favorableMetricConfig);

  const store = new OutliersSupervisionStore(
    new OutliersStore(new RootStore()),
    configFixture
  );

  expect(store.adverseMetricsConfig).not.toContainEqual(favorableMetricConfig);
});
