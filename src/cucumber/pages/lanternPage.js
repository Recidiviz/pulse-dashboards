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
