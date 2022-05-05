/* eslint-disable class-methods-use-this */
import Page from ".";

class ProfilePage extends Page {
  open() {
    super.open(`${browser.config.baseUrl}/profile`);
  }

  get promptText() {
    return $(".StateSelection__heading");
  }

  get stateSelector() {
    return $(".StateSelector");
  }

  get viewDashboardBtn() {
    return $(".Profile__submit");
  }

  selectStateOption(stateName) {
    const option = $(`button=${stateName}`);
    option.click();
  }
}

export default new ProfilePage({ redirectPause: 1000 });
