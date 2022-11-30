// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
/* eslint-disable class-methods-use-this */
import Page from ".";

class LanternPage extends Page {
  open() {
    super.open(`${browser.config.baseUrl}/community/revocations`);
  }

  async lanternLayout() {
    return $(".LanternLayout");
  }

  async revocationsOverTimeTitle() {
    return $(".RevocationsOverTime h4.RevocationsByDimension__title");
  }

  async districtChartCanvas() {
    return $("canvas#admissionsByDistrict");
  }

  async officerChartCanvas() {
    return $("canvas#admissionsByOfficer");
  }

  async riskLevelChartCanvas() {
    return $("canvas#admissionsByRiskLevel");
  }

  async districtFilter() {
    return $(".FilterField.DistrictFilter .DistrictFilterDropdown");
  }

  async disabledDistrictFilter() {
    return $(".DistrictFilter .Select--is-disabled");
  }

  async districtFilterMenu() {
    return $(".MultiSelect__menu-list");
  }

  async caseTable() {
    return $(".CaseTable");
  }

  async caseTableDistrictColumns() {
    return $$("td.CaseTable--district");
  }

  async getDistrictChartWrapperByDistrictIds(districtIds) {
    return $(
      `.RevocationsByDimension--admissionsByDistrict--${districtIds.join("-")}`
    );
  }

  async getRevocationsLink(linkText) {
    return $(`button*=${linkText}`);
  }

  async navigateToProfile() {
    (await this.userMenu()).click();
    await browser.pause(this.redirectPause);
  }
}

export default new LanternPage({ redirectPause: 2000 });
