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

import type { IntakeTenantOverride } from "../types";

export const US_UT_OVERRIDES: IntakeTenantOverride = {
  preIntakeFlow: "video",
  video: {
    src: "/videos/us-ut-intake-video.mp4",
    subtitlesSrc: "/videos/us-ut-intake-subtitles.vtt",
  },
  docId: {
    label: "DOC ID / Offender Number",
    placeholder: "Enter DOC ID / Offender Number",
  },
};
