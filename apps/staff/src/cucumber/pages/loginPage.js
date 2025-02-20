// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import Page from "./basePage";

class LoginPage extends Page {
  async open() {
    await super.open(browser.config.baseUrl);
  }

  async usernameInput() {
    return $("input#username");
  }

  async passwordInput() {
    return $('input[type="password"]');
  }

  async submitBtn() {
    return $('button[type="submit"]');
  }

  async login(username, password) {
    await (await this.usernameInput()).addValue(username);
    await (await this.submitBtn()).click();
    await (await this.passwordInput()).addValue(password);
    await (await this.submitBtn()).click();
    // eslint-disable-next-line wdio/no-pause
    await browser.pause(this.redirectPause);
  }
}

export default new LoginPage({ redirectPause: 3000 });
