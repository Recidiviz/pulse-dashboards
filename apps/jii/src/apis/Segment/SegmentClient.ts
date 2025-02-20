// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

/* eslint-disable no-console */

import { AnalyticsBrowser } from "@segment/analytics-next";
import { v4 as uuidv4 } from "uuid";

import { isTestEnv } from "~client-env-utils";

export type SegmentClientExternals = {
  isRecidivizUser: boolean;
  stateCode: string;
};

/**
 * Provides a wrapper around the Segment analytics client to support per-environment configuration.
 * Depends on the VITE_SEGMENT_WRITE_KEY environment variable to configure a Segment connection;
 * if this value is missing the client will operate in offline mode (events will only be logged to the console)
 */
export class SegmentClient {
  private segment: AnalyticsBrowser;

  readonly sessionId = uuidv4();

  constructor(private externals: SegmentClientExternals) {
    this.segment = new AnalyticsBrowser();

    const writeKey = import.meta.env["VITE_SEGMENT_WRITE_KEY"];
    if (writeKey) {
      this.segment.load({ writeKey });
    }
  }

  get isDisabled(): boolean {
    return (
      // will be undefined if `this.segment.load()` has not been called
      !this.segment.instance ||
      // only log events from internal users in staging
      (this.externals.isRecidivizUser && import.meta.env.MODE !== "staging")
    );
  }

  get isSilent(): boolean {
    return isTestEnv();
  }

  private get defaultTrackingProperties() {
    return {
      sessionId: this.sessionId,
      // this is part of a user's pseudonymized ID, but not all users are guaranteed to have one of those
      stateCode: this.externals.stateCode,
      // in most cases these users will be untracked and Segment will just be disabled,
      // but sometimes we do track them intentionally (and sometimes by accident!), so it may
      // be helpful to have an explicit flag for filtering downstream
      isRecidivizUser: this.externals.isRecidivizUser,
    };
  }

  identify(userId: string): void {
    const traits = { ...this.defaultTrackingProperties };

    if (this.isDisabled) {
      if (this.isSilent) return;
      return console.log(
        `[Analytics] Identifying user: ${userId}, with traits: ${JSON.stringify(
          traits,
        )}`,
      );
    }

    this.segment.identify(userId, traits);
  }

  track(
    eventName: `frontend_${string}`,
    properties?: Record<string, unknown>,
  ): void {
    const fullProperties = { ...this.defaultTrackingProperties, ...properties };

    if (this.isDisabled) {
      if (this.isSilent) return;
      return console.log(
        `[Analytics] Tracking event name: ${eventName}, with properties: ${JSON.stringify(
          fullProperties,
        )}`,
      );
    }

    this.segment.track(eventName, fullProperties);
  }

  page() {
    const properties = { ...this.defaultTrackingProperties };
    if (this.isDisabled) {
      if (this.isSilent) return;
      return console.log(
        `[Analytics] Tracking pageview: ${window.location.href}, with properties: ${JSON.stringify(
          properties,
        )}`,
      );
    }
    this.segment.page(properties);
  }
}
