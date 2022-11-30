// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import fs from "fs";
import path from "path";

import users from "./fixtures/users";

const TEMP_DOWNLOAD_PATH = path.join("/tmp", "tempDownloads");

async function clickOutsideElement() {
  const body = await $("body");
  await body.click();
}

async function allowHeadlessDownloads() {
  /* Allow downloads for headless mode */
  await browser.cdp("Page", "setDownloadBehavior", {
    behavior: "allow",
    downloadPath: TEMP_DOWNLOAD_PATH,
  });
}

async function respondWithOfflineUser(stateCode) {
  const offlineUserMock = await browser.mock("**/api/offlineUser");
  const offlineUser = users[stateCode];
  return offlineUserMock.respond(offlineUser);
}

async function waitForElementsToExist(elements) {
  await browser.waitUntil(
    async () => {
      return elements.length > 0;
    },
    { timeout: 5000 }
  );
}

async function waitForNavigation(navigationEvent) {
  const pup = await browser.getPuppeteer();
  const pages = await pup.pages();
  await Promise.all([pages[0].waitForNavigation(), navigationEvent]);
}

async function waitForFileToExist(filePath, timeout) {
  return new Promise(function (resolve, reject) {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath);

    function handleTimeout() {
      reject(
        new Error("File did not exists and was not created during the timeout.")
      );
    }
    const timer = setTimeout(handleTimeout, timeout);

    const watcher = fs.watch(dir, function (eventType, filename) {
      if (eventType === "rename" && filename === basename) {
        clearTimeout(timer);
        watcher.close();
        resolve();
      }
    });

    fs.access(filePath, fs.constants.R_OK, function (err) {
      if (!err) {
        console.error(err);
        clearTimeout(timer);
        watcher.close();
        resolve();
      }
    });
  });
}

export {
  allowHeadlessDownloads,
  clickOutsideElement,
  respondWithOfflineUser,
  TEMP_DOWNLOAD_PATH,
  waitForElementsToExist,
  waitForFileToExist,
  waitForNavigation,
};
