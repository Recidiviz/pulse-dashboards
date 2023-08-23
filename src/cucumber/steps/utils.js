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

async function clickOutsideElement(element = "body") {
  const body = await $(element);
  await body.click();
}

async function allowHeadlessDownloads() {
  /* Allow downloads for headless mode */
  await browser.cdp("Page", "setDownloadBehavior", {
    behavior: "allow",
    downloadPath: global.downloadDir,
  });
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

async function waitForNetworkIdle() {
  const pup = await browser.getPuppeteer();
  const pages = await pup.pages();
  const page = pages[0];

  let inflight = 0;
  let resolve;
  const maxInflightRequests = 2;
  const timeout = 1500;

  // Puppeteer's method waitForNetworkIdle is not currently included in the latest release of wdio. There are plans to include it
  // in the next release, but in the meantime we try to roll our own. This was borrowed / adapted by several comments in this thread:
  // https://github.com/puppeteer/puppeteer/issues/1353#issuecomment-629271737
  /* eslint-disable no-use-before-define */
  let timeoutId = setTimeout(onTimeout, timeout);

  function onRequestStarted() {
    inflight += 1;
    if (inflight > maxInflightRequests) {
      // Clear timeout and wait for inflight requests to finish
      clearTimeout(timeoutId);
    }
  }

  function onRequestFinished() {
    inflight -= 1;
    if (inflight === 0) {
      // If there's no more inflight requests cancel timeout and resolve promise
      clearTimeout(timeoutId);
      resolve();
    }
    if (inflight === maxInflightRequests) {
      // If inflight requests equal max allowed requests reset timeout
      timeoutId = setTimeout(onTimeout, timeout);
    }
  }

  function onTimeout() {
    // Remove listeners and resolve promise on timeout. This will not raise an error on timeouts,
    // but the test may fail if it didn't wait long enough.
    page.removeListener("request", onRequestStarted);
    page.removeListener("requestfinished", onRequestFinished);
    page.removeListener("requestfailed", onRequestFinished);
    resolve();
  }

  page.on("request", onRequestStarted);
  page.on("requestfinished", onRequestFinished);
  page.on("requestfailed", onRequestFinished);
  /* eslint-enable no-use-before-define */

  return new Promise((res) => {
    resolve = res;
  });
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

async function switchUserStateCode(stateCode) {
  const avatarDropdown = await $(".UserAvatar");
  await avatarDropdown.waitForExist();
  await avatarDropdown.click();
  const profileLink = await $(".AccountLink");
  await profileLink.waitForExist();
  await browser.pause(500);
  await waitForNavigation(profileLink.click());
  const stateSelection = await $(`.StateSelection__${stateCode}`);
  await stateSelection.waitForExist();
  await stateSelection.click();
}

export {
  allowHeadlessDownloads,
  clickOutsideElement,
  switchUserStateCode,
  waitForElementsToExist,
  waitForFileToExist,
  waitForNavigation,
  waitForNetworkIdle,
};
