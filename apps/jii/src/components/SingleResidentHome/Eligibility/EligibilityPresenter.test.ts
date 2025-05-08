// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { when } from "mobx";

import { usMeResidents } from "~datatypes";
import { isHydrated } from "~hydration-utils";

import { usMeEligibilityConfig } from "../../../configs/US_ME/eligibility/config";
import { usMeResidentsConfig } from "../../../configs/US_ME/residents/residentsConfig";
import { ResidentsStore } from "../../../datastores/ResidentsStore";
import { RootStore } from "../../../datastores/RootStore";
import { SingleResidentHydratorPresenter } from "../../SingleResidentHydrator/SingleResidentHydratorPresenter";
import { EligibilityPresenter } from "./EligibilityPresenter";

let presenter: EligibilityPresenter;

describe("with NA opportunities", () => {
  beforeEach(async () => {
    // this resident should have an associated NA work release opportunity
    const residentPseudoId = usMeResidents[3].pseudonymizedId;
    const hydrator = new SingleResidentHydratorPresenter(
      new ResidentsStore(new RootStore(), "US_ME", usMeResidentsConfig),
      residentPseudoId,
    );

    hydrator.hydrate();
    await when(() => isHydrated(hydrator));

    presenter = new EligibilityPresenter(
      hydrator.residentData.opportunities,
      usMeEligibilityConfig,
    );
  });

  test("opportunities are filtered", async () => {
    expect(
      presenter.opportunities.find(
        (data) => data.opportunityId === "usMeWorkRelease",
      ),
    ).toBeUndefined();
    expect(presenter.opportunities.length).toBe(
      Object.keys(usMeEligibilityConfig.incarcerationOpportunities).length - 1,
    );
  });

  test("comparison is excluded", () => {
    expect(presenter.comparison).toBeUndefined();
  });
});

describe("without NA opportunities", () => {
  beforeEach(async () => {
    const residentPseudoId = usMeResidents[0].pseudonymizedId;
    const hydrator = new SingleResidentHydratorPresenter(
      new ResidentsStore(new RootStore(), "US_ME", usMeResidentsConfig),
      residentPseudoId,
    );

    hydrator.hydrate();
    await when(() => isHydrated(hydrator));

    presenter = new EligibilityPresenter(
      hydrator.residentData.opportunities,
      usMeEligibilityConfig,
    );
  });

  test("opportunities are not filtered", () => {
    Object.keys(usMeEligibilityConfig.incarcerationOpportunities).forEach(
      (key) => {
        expect(
          presenter.opportunities.find((d) => d.opportunityId === key),
        ).toBeDefined();
      },
    );
  });

  test("comparison is included", () => {
    expect(presenter.comparison).toBeDefined();
    expect(presenter.comparison).toEqual(
      usMeEligibilityConfig.comparisons?.[0],
    );
  });
});

describe("opportunity sorting", () => {
  test("config order when statuses match", async () => {
    const residentPseudoId = usMeResidents[5].pseudonymizedId;
    const hydrator = new SingleResidentHydratorPresenter(
      new ResidentsStore(new RootStore(), "US_ME", usMeResidentsConfig),
      residentPseudoId,
    );

    hydrator.hydrate();
    await when(() => isHydrated(hydrator));

    presenter = new EligibilityPresenter(
      hydrator.residentData.opportunities,
      usMeEligibilityConfig,
    );

    const { opportunities } = presenter;
    expect(opportunities).toHaveLength(2);
    expect(opportunities[0].opportunityId).toBe("usMeWorkRelease");
    expect(opportunities[0].eligibilityReport.status.value).toBe("ELIGIBLE");

    expect(opportunities[1].opportunityId).toBe("usMeSCCP");
    expect(opportunities[1].eligibilityReport.status.value).toBe("ELIGIBLE");
  });

  test("in status order", async () => {
    const residentPseudoId = usMeResidents[7].pseudonymizedId;
    const hydrator = new SingleResidentHydratorPresenter(
      new ResidentsStore(new RootStore(), "US_ME", usMeResidentsConfig),
      residentPseudoId,
    );

    hydrator.hydrate();
    await when(() => isHydrated(hydrator));

    presenter = new EligibilityPresenter(
      hydrator.residentData.opportunities,
      usMeEligibilityConfig,
    );

    const { opportunities } = presenter;
    expect(opportunities).toHaveLength(2);
    expect(opportunities[0].opportunityId).toBe("usMeSCCP");
    expect(opportunities[0].eligibilityReport.status.value).toBe(
      "ALMOST_ELIGIBLE",
    );

    expect(opportunities[1].opportunityId).toBe("usMeWorkRelease");
    expect(opportunities[1].eligibilityReport.status.value).toBe("INELIGIBLE");
  });
});
