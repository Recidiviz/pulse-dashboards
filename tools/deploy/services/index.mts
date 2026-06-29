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

import type { ServiceDefinition } from "../types.mts";
import { caseNotes } from "./case-notes.mts";
import { demoFixtures, oppsTestData } from "./fixtures.mts";
import { jiiTexting } from "./jii-texting.mts";
import { meetingsBackend, meetingsFrontend } from "./meetings.mts";
import {
  oppsBackend,
  oppsFrontend,
  oppsFunctions,
  oppsStorybook,
} from "./opportunities.mts";
import { sentencing } from "./sentencing.mts";
import { staffBackend, staffFrontend } from "./staff.mts";

/**
 * The registry of every deployable service, keyed by a short id. Insertion order is the order
 * services deploy in (and the order they appear in the selection prompt). Adding a service is
 * just defining a {@link ServiceDefinition} in `services/*.mts` and adding it here.
 */
export const services = {
  staffBackend,
  staffFrontend,
  sentencing,
  jiiTexting,
  caseNotes,
  oppsFunctions,
  oppsBackend,
  oppsFrontend,
  oppsStorybook,
  oppsTestData,
  demoFixtures,
  meetingsBackend,
  meetingsFrontend,
} satisfies Record<string, ServiceDefinition>;

export type ServiceKey = keyof typeof services;
