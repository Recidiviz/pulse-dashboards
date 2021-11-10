/* eslint-disable class-methods-use-this */
import Page from ".";

class ProjectionsPage extends Page {
  open() {
    super.open(`${browser.config.baseUrl}/community/projections`);
  }

  get viewSelector() {
    return $(".CoreViewNavigation");
  }

  selectView(view) {
    this.viewSelector.click();
    const option = $(`button.CoreViewNavigation__item=${view}`);
    option.waitForClickable();
    option.click();
  }

  selectPage(page) {
    const pageButton = $(`a*=${page}`);
    pageButton.click();
  }

  get projectionsChartHeader() {
    return $(".PopulationTimeSeriesChart__header");
  }
}

export default new ProjectionsPage({ redirectPause: 1000 });
