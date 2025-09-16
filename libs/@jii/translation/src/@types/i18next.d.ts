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

// import the original type declarations
import "i18next";

// import all namespaces (for the default language, only)
import common from "../namespaces/common/resources/en";
import US_MA from "../namespaces/US_MA/resources/en";

declare module "i18next" {
  // extends CustomTypeOptions
  interface CustomTypeOptions {
    resources: {
      common: typeof common;
      US_MA: typeof US_MA;
    };
    strictKeyChecks: true;
    enableSelector: true;
  }
}
