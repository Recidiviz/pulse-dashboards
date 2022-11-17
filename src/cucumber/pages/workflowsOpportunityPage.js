/* eslint-disable class-methods-use-this */
import Page from ".";

class WorkflowsOpportunityPage extends Page {
  async open(opportunityType) {
    await super.open(`${browser.config.baseUrl}/workflows/${opportunityType}`);
  }

  async pageHeading() {
    return $(".PersonList__Heading");
  }

  async pageSubheading() {
    return $(".PersonList__Subheading");
  }

  async eligibleClientList() {
    return $("ul.PersonList");
  }

  async almostEligibleClientList() {
    return $("ul.PersonList__AlmostEligible");
  }

  async navigateToFormButton() {
    return $("button.NavigateToFormButton");
  }
}

export default new WorkflowsOpportunityPage({ redirectPause: 3000 });
