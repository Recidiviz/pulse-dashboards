/* eslint-disable class-methods-use-this */
import Page from ".";

class LoginPage extends Page {
  async open() {
    await super.open(browser.config.baseUrl);
  }

  async usernameInput() {
    return $('input[type="email"]');
  }

  async passwordInput() {
    return $('input[type="password"]');
  }

  async submitBtn() {
    return $('form button[type="submit"]');
  }

  async login(username, password) {
    await (await this.usernameInput()).addValue(username);
    await (await this.passwordInput()).addValue(password);
    await (await this.submitBtn()).click();
    await browser.pause(this.redirectPause);
  }
}

export default new LoginPage({ redirectPause: 3000 });
