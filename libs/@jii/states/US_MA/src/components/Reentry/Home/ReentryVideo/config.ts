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

import type { OnboardingVideoAssets } from "~@jii/onboarding-video";

// TODO(REE-200): import the mp4 and vtt here once the video is ready, then
// drop `| undefined` here and on ReentryVideoModal's video prop, along with
// the modal's placeholder. libs/@jii/onboarding-video/README.md describes
// how to prepare both files.
export const REENTRY_VIDEO: OnboardingVideoAssets | undefined = undefined;
