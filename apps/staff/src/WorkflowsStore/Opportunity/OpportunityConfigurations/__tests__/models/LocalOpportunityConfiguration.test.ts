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

import UserStore from "../../../../../RootStore/UserStore";
import {
  mockLocalOpportunityConfigurationObject,
  mockUserStore,
} from "../../__mocks__/utils";
import { LocalOpportunityConfiguration } from "../../models/LocalOpportunityConfigurationImpl";

describe("Local configuration class", () => {
  it("should be correctly initialized", () => {
    const oppConfig = new LocalOpportunityConfiguration(
      mockLocalOpportunityConfigurationObject,
      mockUserStore as UserStore,
    );

    expect(oppConfig.systemType).toEqual(
      mockLocalOpportunityConfigurationObject.systemType,
    );
    expect(oppConfig.stateCode).toEqual(
      mockLocalOpportunityConfigurationObject.stateCode,
    );
    expect(oppConfig.urlSection).toEqual(
      mockLocalOpportunityConfigurationObject.urlSection,
    );
    expect(oppConfig.label).toEqual(
      mockLocalOpportunityConfigurationObject.label,
    );
    expect(oppConfig.featureVariant).toEqual(
      mockLocalOpportunityConfigurationObject.featureVariant,
    );
    expect(oppConfig.initialHeader).toEqual(
      mockLocalOpportunityConfigurationObject.initialHeader,
    );
  });
});
