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

import { outputFixture, usMeResidents, usMeSccpFixtures } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import {
  IncarcerationOpportunityId,
  OpportunityConfig,
} from "../../configs/types";
import { UsMeSCCPEligibilityReport } from "../../models/EligibilityReport/UsMe/UsMeSCCPEligibilityReport";
import { OpportunityInfoPagePresenter } from "./OpportunityInfoPagePresenter";

const stateConfig = residentsConfigByState.US_ME;

const opportunityId: IncarcerationOpportunityId = "usMeSCCP";
const oppConfig = stateConfig.incarcerationOpportunities[
  opportunityId
] as OpportunityConfig;

const allPages = [
  oppConfig.requirements.fullPage,
  ...oppConfig.sections.map((s) => s.fullPage),
].filter((c) => c !== undefined);
const eligibleResident = usMeResidents[0];

test.each(allPages)(
  "SCCP page $urlSlug links to all other pages",
  (pageConfig) => {
    const presenter = new OpportunityInfoPagePresenter(
      oppConfig,
      pageConfig.urlSlug,
      new UsMeSCCPEligibilityReport(
        eligibleResident,
        oppConfig,
        outputFixture(usMeSccpFixtures.RES001almostEligibleMonthsRemaining),
      ),
    );

    const otherPages = allPages.filter((p) => p !== pageConfig);
    otherPages.forEach((p) => {
      expect(
        presenter.pageLinks.find((l) => l.url.endsWith(p.urlSlug)),
      ).toBeDefined();
    });

    expect.assertions(allPages.length - 1);
  },
);
