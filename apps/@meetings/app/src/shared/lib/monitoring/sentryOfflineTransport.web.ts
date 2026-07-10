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

import { makeBrowserOfflineTransport } from "@sentry/browser";
import type * as Sentry from "@sentry/react-native";

type SentryTransportFactory = NonNullable<
  Parameters<typeof Sentry.init>[0]
>["transport"];

// Web has no native transport, so Sentry falls back to the fetch transport,
// which drops events that fail while offline
export const offlineTransport: SentryTransportFactory =
  makeBrowserOfflineTransport();
