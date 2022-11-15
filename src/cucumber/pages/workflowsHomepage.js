/* eslint-disable class-methods-use-this */
import Page from ".";

class WorkflowsHomepage extends Page {
  open() {
    super.open(`${browser.config.baseUrl}/workflows/home`);
  }

  async promptText() {
    return $(".WorkflowsHomepageText");
  }
}

export default new WorkflowsHomepage({ redirectPause: 3000 });
