// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { StateCode } from "@prisma/jii-texting/client";
import type { i18n } from "i18next";

export function isValidStateCode(stateCode: string) {
  return (Object.values(StateCode) as string[]).includes(stateCode);
}

export function isOptOut(optOutString: string) {
  // Based on values detailed here https://help.twilio.com/articles/223134027-Twilio-support-for-opt-out-keywords-SMS-STOP-filtering
  switch (optOutString) {
    case "STOP":
    case "STOPALL":
    case "UNSUBSCRIBE":
    case "CANCEL":
    case "END":
    case "QUIT":
      return true;
    case "START":
    case "YES":
    case "UNSTOP":
      return false;
    default:
      console.log(`Received unexpected OptOutType: ${optOutString}`);
      return undefined;
  }
}

export function setPreferredLanguage(body: string, i18n: i18n) {
  // this assumes that the entire body of the incoming text only contains a keyword
  const responseBodyClean = body.trim().toLowerCase();

  const spanishKeyWords = i18n.t("languagePreferenceKeywords", { lng: "es" });
  const englishKeyWords = i18n.t("languagePreferenceKeywords", { lng: "en" });

  if (spanishKeyWords.includes(responseBodyClean)) {
    // Current preference is switched to Spanish
    return "es";
  } else if (englishKeyWords.includes(responseBodyClean)) {
    // Current preference is switched to English
    return "en";
  }
  // No preference noted. Do not change what is already stored
  return undefined;
}
