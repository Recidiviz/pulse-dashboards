// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

// Vitest's jest-compatible globals (describe/it/expect/...) for the test files this
// project's single tsconfig.json typechecks. Previously these resolved only by tsc's
// implicit autoload of @types/jest; moduleResolution "bundler" under TypeScript 7 does not, so
// we reference them explicitly. This config has no `types` array, so a reference (rather
// than a `types` entry) is used to avoid disabling the default @types autoinclusion.
/// <reference types="vitest/globals" />

// Side-effect stylesheet imports (global.css, component .css, package .css) carry no
// types; declare them so bundler resolution doesn't flag TS2882.
declare module "*.css";
