// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { computed, configure, makeObservable, onReactionError } from "mobx";

import demoAuthConfig from "../auth_config_demo.json";
import devAuthConfig from "../auth_config_dev.json";
import productionAuthConfig from "../auth_config_production.json";
import { WorkflowsStore } from "../WorkflowsStore";
import PageStore from "./PageStore";
import TenantStore from "./TenantStore";
import { TenantId } from "./types";
import UserStore from "./UserStore";

/**
 * Returns the auth settings configured for the current environment, if any.
 */
export function getAuthSettings(): Auth0ClientOptions {
  const authEnv = process.env.REACT_APP_AUTH_ENV;
  let config: { [k: string]: string };
  if (authEnv === "production") {
    config = productionAuthConfig;
  } else if (authEnv === "demo") {
    config = demoAuthConfig;
  } else {
    config = devAuthConfig;
  }
  return {
    client_id: config.clientId,
    domain: config.domain,
    audience: config.audience,
    redirect_uri: `${window.location.origin}`,
  };
}

// This needs to be called from the RootStore so the instance is exported after
// mobx is configured.
if (process.env.NODE_ENV !== "test") {
  configure({
    // make proxies optional for IE 11 support
    useProxies: "ifavailable",
    // activate runtime linting
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    // This linter gives too many false positives when propTypes is defined
    // https://mobx.js.org/configuration.html#observablerequiresreaction-boolean
    observableRequiresReaction: false,
  });

  if (process.env.NODE_ENV !== "production") {
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

  constructor() {
    makeObservable(this, {
      currentTenantId: computed,
      user: computed,
    });

    this.userStore = new UserStore({
      authSettings: getAuthSettings(),
      rootStore: this,
    });

    this.tenantStore = new TenantStore({ rootStore: this });

    this.pageStore = new PageStore({ rootStore: this });

    this.workflowsStore = new WorkflowsStore({ rootStore: this });
  }

  get currentTenantId(): TenantId | undefined {
    return this.tenantStore.currentTenantId;
  }

  get user(): User | undefined {
    return this.userStore.user;
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
