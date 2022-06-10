// https://webdriver.io/docs/pageobjects/
/* eslint-disable class-methods-use-this */
export default class Page {
  constructor({ redirectPause = 2000 }) {
    this.redirectPause = redirectPause;
  }

  async open(path) {
    await browser.url(path);
    await browser.pause(this.redirectPause);
  }

  async userMenu() {
    return $(".ProfileLink");
  }
}
