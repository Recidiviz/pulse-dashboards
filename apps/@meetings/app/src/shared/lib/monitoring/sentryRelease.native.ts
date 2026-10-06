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

import Constants from "expo-constants";

// Named after the JS version rather than left to the SDK, whose native default
// (bundle id, version and build number) only changes when a binary is built. An
// OTA carries its own version in expoConfig, so this tells OTAs apart. The SDK
// still fills in dist from the native build number.
const version = Constants.expoConfig?.version;

export const sentryRelease = version ? `meetings-native@${version}` : undefined;
