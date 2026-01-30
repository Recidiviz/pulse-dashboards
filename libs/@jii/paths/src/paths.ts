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

import { number, route, string, types } from "react-router-typesafe-routes/dom";

export const EmailVerification = route("verify");

export const AfterLogin = route("after-login", {
  // search params are optional by default so it's fine if these are missing
  // (which they will be when login succeeds)
  searchParams: { error: string(), error_description: string() },
});

export const ReturnToPathFragment = route("", {
  searchParams: { returnToPath: string() },
});

export const OrijinSSOPage = route("orijin/sso");

export const EdovoLandingPage = route("edovo/:token");

export const EGT = route(
  "earned-good-time",
  {},
  {
    Definition: route("definition/:pageSlug"),
    Intro: route("intro"),
    AllMonths: route("report/all"),
    MonthlyReport: route("report/:reportDate"),
  },
);

export const UsTnMoreInformation = route(
  "more-information",
  {},
  {
    About: route("about"),
    ImportantDates: route("dates", { hash: ["expiration-date"] }),
    Credits: route("credits"),
  },
);

export const UsAzMoreInformation = route(
  "more-information",
  {},
  {
    Intro: route("intro"),
    About: route("about"),
    ImportantDates: route("important-dates", { hash: [] }),
  },
);

export const UsNcRNA = route(
  "rna",
  {},
  {
    Landing: route(""),
    FormPage: route("page/:pageNum", {
      params: { pageNum: number().defined() },
    }),
  },
);

export const UsNeReentryChecklist = route("reentry-checklist");

export const UsCoMoreInformation = route(
  "more-information",
  {},
  {
    EarnedTime: route("earned-time"),
  },
);

export const State = route(":stateSlug", types(ReturnToPathFragment), {
  Resident: route(
    ":personPseudoId",
    {},
    {
      EGT,
      UsTnMoreInformation,
      UsAzMoreInformation,
      UsCoMoreInformation,
      UsNcRNA,
      UsNeReentryChecklist,
    },
  ),
  Search: route("search"),
});

export const SiteRoot = route("", types(ReturnToPathFragment));

export const StateSelect = route("state-select");
