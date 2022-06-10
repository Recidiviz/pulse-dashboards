/* eslint-disable class-methods-use-this */
import Page from ".";

class ProfilePage extends Page {
  open() {
    super.open(`${browser.config.baseUrl}/profile`);
  }

  async promptText() {
    return $(".StateSelection__heading");
  }

  async stateSelector() {
    return $(".StateSelector");
  }

  async viewDashboardBtn() {
    return $(".Profile__submit");
  }

  async selectStateOption(stateName) {
    const option = await $(`button=${stateName}`);
    await option.click();
  }
}

export default new ProfilePage({ redirectPause: 1000 });
