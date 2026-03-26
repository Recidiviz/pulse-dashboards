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

import { AnalyticsBrowser } from "@segment/analytics-next";
import { clone } from "lodash";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";

import { PopulationFilterValues } from "~shared-pathways";

import type { RootStore } from "./RootStore";

const SEGMENT_WRITE_KEY = import.meta.env[
  "VITE_PUBLIC_PATHWAYS_SEGMENT_WRITE_KEY"
];

const isAnalyticsDisabled =
  !SEGMENT_WRITE_KEY ||
  !["staging", "production"].includes(import.meta.env.MODE);

export default class AnalyticsStore {
  private readonly rootStore: RootStore;

  private readonly segment: AnalyticsBrowser;

  readonly sessionId = uuidv4();

  constructor({
    rootStore,
    isTestMode,
  }: {
    rootStore: RootStore;
    isTestMode?: boolean;
  }) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
    this.segment = AnalyticsBrowser.load(
      { writeKey: SEGMENT_WRITE_KEY ?? "disabled" },
      { disable: isTestMode || !SEGMENT_WRITE_KEY },
    );
  }

  private get isRecidivizUser(): boolean {
    try {
      return this.rootStore.userStore.isRecidivizUser;
    } catch {
      return false;
    }
  }

  private get shouldLog(): boolean {
    return isAnalyticsDisabled || this.isRecidivizUser;
  }

  private get shouldSkipSegment(): boolean {
    return (
      isAnalyticsDisabled ||
      (this.isRecidivizUser && import.meta.env.MODE !== "staging")
    );
  }

  track(eventName: string, metadata?: Record<string, unknown>): void {
    const fullMetadata = clone(metadata) || {};
    fullMetadata["sessionId"] = this.sessionId;

    if (this.shouldLog)
      // eslint-disable-next-line no-console
      console.log(
        `[Analytics] Tracking: ${eventName}, metadata: ${JSON.stringify(fullMetadata)}`,
      );
    if (this.shouldSkipSegment) return;
    this.segment.track(eventName, fullMetadata);
  }

  page(pagePath: string): void {
    if (this.shouldLog)
      // eslint-disable-next-line no-console
      console.log(`[Analytics] Tracking pageview: ${pagePath}`);
    if (this.shouldSkipSegment) return;
    this.segment.page(pagePath);
  }

  // --- Domain-specific tracking methods ---

  trackMetricSelected({ metricId }: { metricId: string }): void {
    this.track("frontend.public_pathways_metric_selected", { metricId });
  }

  trackApplyFilters({
    metricId,
    filters,
  }: {
    metricId: string;
    filters: PopulationFilterValues;
  }): void {
    this.track("frontend.public_pathways_apply_filters", {
      metricId,
      filters: { ...filters },
    });
  }

  trackDownloadClicked({ metricId }: { metricId: string }): void {
    this.track("frontend.public_pathways_download_clicked", { metricId });
  }

  trackMethodologyLinkClicked(): void {
    this.track("frontend.public_pathways_methodology_link_clicked");
  }
}
