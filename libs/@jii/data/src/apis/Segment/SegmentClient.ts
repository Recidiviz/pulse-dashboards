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
import { matchPath } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { AfterLogin, EdovoLandingPage, OrijinSSOPage } from "~@jii/paths";
import type { IntakeAnalytics } from "~@reentry/frontend-shared";
import { isTestEnv } from "~client-env-utils";

import { proxyHost } from "../../utils/proxy";
import { stateCodeFromCurrentUrl } from "../../utils/stateCodeFromCurrentUrl";

/**
 * Routes that exist only to move users through a login flow. Their URLs can contain
 * credentials (an Auth0 authorization code, an Edovo login token), and Segment copies the
 * current URL onto every event it sends, so nothing should be sent while a user is on one of
 * them. They have no real value for analytics anyway.
 */
const UNTRACKED_ROUTES = [AfterLogin, EdovoLandingPage, OrijinSSOPage];

export type SegmentClientExternals = {
  isRecidivizUser: boolean;
  currentLanguage: string;
};

/** Where an AET credit-earning callout was rendered */
export type AetCalloutPlacement = "homepage" | "programCatalog";

/**
 * Provides a wrapper around the Segment analytics client to support per-environment configuration.
 * Depends on the VITE_SEGMENT_WRITE_KEY environment variable to configure a Segment connection;
 * if this value is missing the client will operate in offline mode (events will only be logged to the console)
 */
export class SegmentClient implements IntakeAnalytics {
  private segment: AnalyticsBrowser;

  /**
   * Whether a Segment connection was configured for this environment. Note that this is
   * not the same as Segment being ready to send: `load()` resolves asynchronously, and
   * events created before it does are buffered by Segment to be sent when the SDK is ready.
   */
  private readonly isConfigured: boolean;

  readonly sessionId = uuidv4();

  constructor(private externals: SegmentClientExternals) {
    this.segment = new AnalyticsBrowser();

    const writeKey = import.meta.env["VITE_SEGMENT_WRITE_KEY"];
    const reverseProxyHost = proxyHost();
    this.isConfigured = !!writeKey;

    if (writeKey) {
      if (reverseProxyHost) {
        this.segment.load(
          {
            writeKey,
            cdnURL: `https://${reverseProxyHost}/segment-cdn`,
          },
          {
            integrations: {
              "Segment.io": {
                apiHost: `${reverseProxyHost}/segment-api/v1`,
              },
            },
          },
        );
      } else {
        this.segment.load({ writeKey });
      }
    }
  }

  /**
   * Whether the user is currently somewhere whose URL must not be sent to Segment.
   * See {@link UNTRACKED_ROUTES}.
   */
  private get isOnUntrackedRoute(): boolean {
    return UNTRACKED_ROUTES.some(({ path }) =>
      matchPath(path, window.location.pathname),
    );
  }

  get isDisabled(): boolean {
    return (
      !this.isConfigured ||
      // note that the value of this one changes as the user navigates
      this.isOnUntrackedRoute ||
      // only log events from internal users in staging
      (this.externals.isRecidivizUser && import.meta.env.MODE !== "staging")
    );
  }

  get isSilent(): boolean {
    return isTestEnv();
  }

  private get disabledNote(): string {
    const prefix = "Analytics Disabled";
    if (!this.isConfigured) {
      return `${prefix} (For Environment)`;
    }
    // per-route suppression is silent other than this
    if (this.isOnUntrackedRoute) {
      return `${prefix} (Untracked Route)`;
    }
    // it's not necessary to check the environment here like we do
    // for the actual isDisabled logic, this message is applicable regardless
    // if we've gotten this far
    if (this.externals.isRecidivizUser) {
      return `${prefix} (Internal User)`;
    }
    // not reachable as of this writing; a fallback for future or unexpected cases
    return prefix;
  }

  private get defaultTrackingProperties() {
    return {
      sessionId: this.sessionId,
      // this is part of a user's pseudonymized ID, but not all users are guaranteed to have one of those
      stateCode: stateCodeFromCurrentUrl(),
      // in most cases these users will be untracked and Segment will just be disabled,
      // but sometimes we do track them intentionally (and sometimes by accident!), so it may
      // be helpful to have an explicit flag for filtering downstream
      isRecidivizUser: this.externals.isRecidivizUser,
    };
  }

  private get trackingContextOverrides() {
    return { locale: this.externals.currentLanguage };
  }

  identify(userId: string): void {
    const traits = { ...this.defaultTrackingProperties };

    if (this.isDisabled) {
      if (this.isSilent) return;
      return console.log(
        `[${this.disabledNote}] Identifying user: ${userId}, with traits ${JSON.stringify(
          traits,
        )} and context overrides ${JSON.stringify(this.trackingContextOverrides)}`,
      );
    }

    this.segment.identify(userId, traits, {
      context: this.trackingContextOverrides,
    });
  }

  track(
    eventName: `frontend_${string}`,
    properties?: Record<string, unknown>,
  ): void {
    const fullProperties = { ...this.defaultTrackingProperties, ...properties };

    if (this.isDisabled) {
      if (this.isSilent) return;
      return console.log(
        `[${this.disabledNote}] Tracking event name: ${eventName}, with properties ${JSON.stringify(
          fullProperties,
        )} and context overrides ${JSON.stringify(this.trackingContextOverrides)}`,
      );
    }

    this.segment.track(eventName, fullProperties, {
      context: this.trackingContextOverrides,
    });
  }

  page() {
    const properties = { ...this.defaultTrackingProperties };
    if (this.isDisabled) {
      if (this.isSilent) return;
      return console.log(
        `[${this.disabledNote}] Tracking pageview: ${window.location.href}, with properties ${JSON.stringify(
          properties,
        )} and context overrides ${JSON.stringify(this.trackingContextOverrides)}`,
      );
    }
    this.segment.page(properties, { context: this.trackingContextOverrides });
  }

  /* Program Catalog events */

  trackProgramDetailOpened(metadata: {
    justiceInvolvedPersonPseudoId: string;
    programId: string;
    title: string;
  }) {
    this.track("frontend_program_detail_opened", metadata);
  }

  /* US_MA Spanish Program List launch announcement */

  trackUsMaSpanishLaunchBannerViewed() {
    this.track("frontend_us_ma_spanish_launch_banner_viewed");
  }

  trackAetCalloutImpression(metadata: { placement: AetCalloutPlacement }) {
    this.track("frontend_aet_callout_impression", metadata);
  }

  trackAetCalloutClicked(metadata: { placement: AetCalloutPlacement }) {
    this.track("frontend_aet_callout_clicked", metadata);
  }

  /* Community Resource Explorer (CRE) events */

  trackCreCategorySelected(metadata: {
    justiceInvolvedPersonPseudoId: string;
    category: string;
  }) {
    this.track("frontend_cre_category_selected", metadata);
  }

  trackCreSubcategorySelected(metadata: {
    justiceInvolvedPersonPseudoId: string;
    category: string;
    subcategory: string;
    isOpen: boolean;
  }) {
    this.track("frontend_cre_subcategory_selected", metadata);
  }

  trackCreFiltersUpdated(metadata: {
    justiceInvolvedPersonPseudoId: string;
    category: string;
    subcategories: string[];
    tags: string[];
  }) {
    this.track("frontend_cre_filters_updated", metadata);
  }

  trackCreFilterCleared(metadata: {
    justiceInvolvedPersonPseudoId: string;
    category: string;
  }) {
    this.track("frontend_cre_filter_cleared", metadata);
  }

  trackCreResourceViewed(metadata: {
    justiceInvolvedPersonPseudoId: string;
    resourceId: number;
    resourceName: string;
    source: "category_list" | "similar_resources" | "search";
  }) {
    this.track("frontend_cre_resource_viewed", metadata);
  }

  trackCreDescriptionToggled(metadata: {
    justiceInvolvedPersonPseudoId: string;
    resourceId: number;
    resourceName: string;
    isExpanded: boolean;
  }) {
    this.track("frontend_cre_description_toggled", metadata);
  }

  // Search queries are logged server-side instead (via trackSearchQueryAnonymously), so this
  // event never carries the resident's identity via Segment's identify()-driven userId. See
  // useCreAnalytics.ts and the resident.resources.logSearchQueryAnonymously tRPC mutation.

  /* NC RNA form events */

  trackNcRNAFormCompletion(metadata: {
    justiceInvolvedPersonPseudoId: string;
  }) {
    this.track("frontend_nc_rna_form_completed", metadata);
  }

  /* Intake events */

  // the event names seen here are the same as used in CPA.
  // not necessarily required, but convenient
  trackIntakeChatClientLogin(metadata: {
    justiceInvolvedPersonPseudoId: string;
  }) {
    this.track("frontend_cpa_intake_chat_client_login", metadata);
  }
  trackIntakeChatClientAddressSubmitted(metadata: {
    justiceInvolvedPersonPseudoId: string;
  }) {
    this.track("frontend_cpa_intake_chat_client_address_submitted", metadata);
  }

  trackIntakeChatSttEvent(
    eventName: string,
    metadata: {
      justiceInvolvedPersonPseudoId: string;
    },
  ) {
    this.track(`frontend_cpa_intake_chat_stt_${eventName}`, metadata);
  }

  trackIntakeChatTtsEvent(
    eventName: string,
    metadata: {
      justiceInvolvedPersonPseudoId: string;
    },
  ) {
    this.track(`frontend_cpa_intake_chat_tts_${eventName}`, metadata);
  }
}
