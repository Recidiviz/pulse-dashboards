/* eslint-disable class-methods-use-this */
import Page from ".";

class WorkflowsHomepage extends Page {
  open() {
    super.open(`${browser.config.baseUrl}/workflows/home`);
  }

  async promptText() {
    return $(".WorkflowsHomepageText");
  }

  async opportunitySummaries() {
    return browser.$$(".OpportunityTypeSummaryWrapper");
  }

  async clientAvatars() {
    return browser.$$(".OpportunityClientsWrapper");
  }
}

export default new WorkflowsHomepage({ redirectPause: 3000 });
