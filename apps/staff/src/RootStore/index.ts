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

import { Auth0ClientOptions, User } from "@auth0/auth0-spa-js";
import * as Sentry from "@sentry/react";
import { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { computed, configure, makeObservable, onReactionError } from "mobx";

import { CPAStore } from "~@cpa/staff-client";
import type { JiiStaffAppRouter } from "~@jii/trpc-types";
import { isTestEnv } from "~client-env-utils";
import { FirebaseAuthClient } from "~firebase-auth";
import { SentencingStore } from "~sentencing-client";
import {
  demoAuthConfig,
  devAuthConfig,
  productionAuthConfig,
} from "~staff-shared-server";

import OpportunitiesFilterStore from "../FilterStore/OpportunitiesFilterStore";
import TasksFilterStore from "../FilterStore/TasksFilterStore";
import FirestoreStore from "../FirestoreStore";
import { InsightsStore } from "../InsightsStore/InsightsStore";
import { TENANT_CONFIGS } from "../tenants";
import { createJiiTrpcClient } from "../trpc/jii";
import { getFirestoreProjectId } from "../utils/getFirestoreProjectId";
import { WorkflowsStore } from "../WorkflowsStore";
import { WorkflowsRootStore } from "../WorkflowsStore/WorkflowsRootStore";
import AnalyticsStore from "./AnalyticsStore";
import { APIStore } from "./APIStore";
import PageStore from "./PageStore";
import TenantStore from "./TenantStore";
import { TenantId } from "./types";
import UserStore from "./UserStore";

/**
 * Returns the auth settings configured for the current environment, if any.
 */
export function getAuthSettings(): Auth0ClientOptions {
  const authEnv = import.meta.env.VITE_AUTH_ENV;
  let config: { [k: string]: string };
  if (authEnv === "production") {
    config = productionAuthConfig;
  } else if (authEnv === "demo") {
    config = demoAuthConfig;
  } else {
    config = devAuthConfig;
  }
  return {
    clientId: config.clientId,
    useFormData: false,
    domain: config.domain,
    authorizationParams: {
      audience: config.audience,
      redirect_uri: `${window.location.origin}`,
    },
  };
}

// This needs to be called from the RootStore so the instance is exported after
// mobx is configured.
if (import.meta.env.MODE !== "test") {
  configure({
    // activate runtime linting
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    // This linter gives too many false positives when propTypes is defined
    // https://mobx.js.org/configuration.html#observablerequiresreaction-boolean
    observableRequiresReaction: false,
  });

  if (!import.meta.env.PROD) {
    configure({
      disableErrorBoundaries: true,
    });
  }

  // log errors in Mobx reactions (e.g. autoruns) which are otherwise swallowed
  onReactionError((error) => {
    Sentry.captureException(error, (scope) => {
      scope.setTag("currentTenantId", globalStore.currentTenantId);
      return scope;
    });
  });
}

export class RootStore {
  tenantStore: TenantStore;

  userStore: UserStore;

  pageStore: PageStore;

  workflowsStore: WorkflowsStore;

  workflowsRootStore: WorkflowsRootStore;

  apiStore: APIStore;

  analyticsStore: AnalyticsStore;

  firestoreStore: FirestoreStore;

  opportunitiesFilterStore: OpportunitiesFilterStore;

  tasksFilterStore: TasksFilterStore;

  insightsStore: InsightsStore;

  sentencingStore: SentencingStore;

  cpaStore: CPAStore;

  firebaseAuthClient: FirebaseAuthClient;

  jiiTrpcClient: TRPCOptionsProxy<JiiStaffAppRouter>;

  constructor() {
    makeObservable(this, {
      currentTenantId: computed,
      isImpersonating: computed,
      user: computed,
    });

    this.userStore = new UserStore({
      authSettings: getAuthSettings(),
      rootStore: this,
    });

    this.tenantStore = new TenantStore({
      rootStore: this,
      tenantConfigs: TENANT_CONFIGS,
    });

    this.pageStore = new PageStore({ rootStore: this });

    this.workflowsRootStore = new WorkflowsRootStore(this);

    this.workflowsStore = new WorkflowsStore({ rootStore: this });

    this.apiStore = new APIStore(this.userStore);

    this.analyticsStore = new AnalyticsStore({
      rootStore: this,
      isTestMode: isTestEnv(),
    });

    this.firebaseAuthClient = new FirebaseAuthClient(
      getFirestoreProjectId(),
      import.meta.env.VITE_FIREBASE_API_KEY,
    );

    this.firestoreStore = new FirestoreStore({ rootStore: this });

    this.opportunitiesFilterStore = new OpportunitiesFilterStore(
      this.analyticsStore,
      this.tenantStore,
      this.workflowsStore,
    );

    this.tasksFilterStore = new TasksFilterStore(
      this.analyticsStore,
      this.tenantStore,
      this.workflowsStore,
    );

    this.insightsStore = new InsightsStore(this);

    this.sentencingStore = new SentencingStore(this);

    this.cpaStore = new CPAStore(this);

    this.jiiTrpcClient = createJiiTrpcClient({
      firebaseAuthClient: this.firebaseAuthClient,
      currentTenantId: () => this.currentTenantId,
    });
  }

  get currentTenantId(): TenantId | undefined {
    return this.tenantStore.currentTenantId;
  }

  get user(): User | undefined {
    return this.userStore.user;
  }

  get isImpersonating(): boolean {
    return this.userStore.isImpersonating;
  }

  get availableStateCodes(): string[] {
    return this.userStore.availableStateCodes;
  }

  get getTokenSilently(): UserStore["getTokenSilently"] {
    return this.userStore.getTokenSilently;
  }
}

const globalStore = new RootStore();
export default globalStore;
