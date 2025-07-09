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

import createAuth0Client, {
  Auth0Client,
  Auth0ClientOptions,
  GetTokenSilentlyOptions,
  LogoutOptions,
  User,
} from "@auth0/auth0-spa-js";
import * as Sentry from "@sentry/react";
import { intersection } from "lodash";
import {
  action,
  computed,
  entries,
  makeAutoObservable,
  observable,
  runInAction,
  when,
} from "mobx";
import { now } from "mobx-utils";
import qs from "qs";

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import { castToError } from "~hydration-utils";

import { fetchImpersonatedUserAppMetadata } from "../api/fetchImpersonatedUserAppMetadata";
import { fetchOfflineUser } from "../api/fetchOfflineUser";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import {
  Navigation,
  NavigationSection,
  RoutePermission,
} from "../core/types/navigation";
import {
  DASHBOARD_VIEWS,
  PATHWAYS_SECTIONS,
  PathwaysPageIdList,
  UNRESTRICTED_PAGES,
} from "../core/views";
import { TENANT_CONFIGS } from "../tenants";
import { capitalizeName } from "../utils";
import isIE11 from "../utils/isIE11";
import { getAllowedMethodology } from "../utils/navigation";
import type RootStore from ".";
import {
  ActiveFeatureVariantRecord,
  defaultRecidivizUserFeatureVariantsActive,
  FeatureVariant,
  FeatureVariantOverrideRecord,
  InternalTenantId,
  TenantId,
  UserAppMetadata,
} from "./types";

const METADATA_NAMESPACE = import.meta.env.VITE_METADATA_NAMESPACE;
export const SESSION_FEATURE_VARIANT_OVERRIDES = "featureVariantOverrides";

type ConstructorProps = {
  authSettings?: Auth0ClientOptions;
  rootStore?: typeof RootStore;
};

/**
 * Reactive wrapper around Auth0 client.
 * Call `authorize` to retrieve credentials or start login flow.
 *
 * @example
 *
 * ```js
 * const store = new UserStore({ authSettings: { domain, client_id, redirect_uri } });
 * if (!store.isAuthorized) {
 *   await store.authorize();
 *   // this may trigger a redirect to the Auth0 login domain;
 *   // if we're still here and user has successfully logged in,
 *   // store.isAuthorized should now be true.
 * }
 * ```
 */
export default class UserStore {
  authError?: Error;

  impersonationError?: Error;

  readonly authSettings?: Auth0ClientOptions;

  auth0?: Auth0Client;

  isAuthorized: boolean;

  userIsLoading: boolean;

  user?: User;

  getToken?: (options?: GetTokenSilentlyOptions) => Promise<any> | undefined;

  logout?: (options?: LogoutOptions) => void;

  featureVariantOverrides: FeatureVariantOverrideRecord;

  readonly rootStore?: typeof RootStore;

  constructor({ authSettings, rootStore }: ConstructorProps) {
    makeAutoObservable(this, {
      rootStore: false,
      authSettings: false,
      setAuthError: action.bound,
      setImpersonationError: action.bound,
      userHasAccess: action.bound,
      getTokenSilently: action.bound,
      loginWithRedirect: action.bound,
      activeFeatureVariants: computed.struct,
      featureVariantOverrides: observable,
    });

    this.featureVariantOverrides = this.getFeatureVariantOverrides();
    this.authSettings = authSettings;
    this.rootStore = rootStore;

    this.isAuthorized = false;
    this.userIsLoading = true;
  }

  /**
   * If user already has a valid Auth0 credential, this method will retrieve it
   * and update class properties accordingly. If not, user will be redirected
   * to the Auth0 login domain for fresh authentication.
   * Returns an Error if Auth0 configuration is not present.
   */
  async authorize(handleTargetUrl: (targetUrl: string) => void): Promise<void> {
    if (isOfflineMode()) {
      const offlineUser = await fetchOfflineUser({
        allowedStates: TENANT_CONFIGS.RECIDIVIZ.availableStateCodes,
      });
      await this.rootStore?.firestoreStore.authenticate(
        "fakeAuth0Token",
        offlineUser[`${METADATA_NAMESPACE}app_metadata`],
      );
      runInAction(() => {
        this.user = offlineUser;
        this.isAuthorized = true;
        this.userIsLoading = false;
      });
      this.getToken = () => Promise.resolve("");
      this.logout = () => null;
      return;
    }

    if (!this.authSettings) {
      this.authError = new Error(ERROR_MESSAGES.auth0Configuration);
      return;
    }

    try {
      const auth0 = await createAuth0Client(this.authSettings);
      this.auth0 = auth0;
      const urlQuery = qs.parse(window.location.search, {
        ignoreQueryPrefix: true,
      });

      if (urlQuery.error) {
        throw new Error(urlQuery.error_description as string);
      }

      if (urlQuery.code && urlQuery.state) {
        const { appState } = await auth0.handleRedirectCallback();
        // auth0 params are single-use, must be removed from history or they can cause errors
        let replacementUrl;
        if (appState && appState.targetUrl) {
          replacementUrl = appState.targetUrl;
        } else {
          // strip away all query params just to be safe
          replacementUrl = `${window.location.origin}${window.location.pathname}`;
        }
        window.history.replaceState({}, document.title, replacementUrl);
        handleTargetUrl(replacementUrl);
      }
      if (await auth0.isAuthenticated()) {
        const user = await auth0.getUser();
        if (user) {
          await this.rootStore?.firestoreStore.authenticate(
            await auth0.getTokenSilently(),
            user[`${METADATA_NAMESPACE}app_metadata`],
          );
          runInAction(() => {
            this.user = user;
            this.getToken = (options?: GetTokenSilentlyOptions) =>
              this.auth0?.getTokenSilently(options);
            this.logout = (...p: any) => this.auth0?.logout(...p);
            this.isAuthorized = true;
            this.userIsLoading = false;
          });
          this.trackIdentity();
        } else {
          runInAction(() => {
            this.isAuthorized = false;
          });
        }
      } else {
        this.auth0.loginWithRedirect({
          appState: { targetUrl: window.location.href },
        });
      }
    } catch (caught) {
      const error = castToError(caught);
      if (error.message === "Invalid state" && this.auth0) {
        this.auth0.logout();
        this.auth0.loginWithRedirect();
      } else {
        this.setAuthError(error);
      }
    }
  }

  /**
   * Impersonates a user, returns true if the impersonation was successful
   */
  async impersonateUser(impersonatedEmail: string): Promise<boolean> {
    this.userIsLoading = true;
    this.rootStore?.workflowsStore.disposeUserProfileSubscriptions();

    try {
      if (!this.isRecidivizUser && !this.isImpersonating) {
        throw new Error("Impersonation is only allowed for Recidiviz users");
      }

      const auth0Token = await this.getTokenSilently();
      if (!auth0Token) {
        throw new Error(
          "Missing required auth0 authentication for impersonation.",
        );
      }

      // Fetch dashboard userAppMetadata to build mocked auth0 user
      const impersonatedUserAppMetadata =
        await fetchImpersonatedUserAppMetadata(impersonatedEmail, auth0Token);

      const { stateCode } = impersonatedUserAppMetadata;

      // Firestore authentication
      await this.rootStore?.firestoreStore.authenticate(
        auth0Token,
        impersonatedUserAppMetadata,
        impersonatedEmail,
      );

      runInAction(() => {
        this.user = {
          email: impersonatedEmail,
          email_verified: true,
          given_name: "Impersonated User",
          [`${METADATA_NAMESPACE}app_metadata`]: {
            ...impersonatedUserAppMetadata,
            allowedStates: [stateCode],
          },
          impersonator: true,
          name: "Impersonated User",
          stateCode,
        };
        this.rootStore?.tenantStore.setCurrentTenantId(stateCode as TenantId);
        this.userIsLoading = false;
      });
      return true;
    } catch (error) {
      runInAction(() => {
        this.setImpersonationError(error as Error);
        this.userIsLoading = false;
      });
      return false;
    }
  }

  /**
   * Returns whether a Recidiviz user is impersonating a user
   */
  get isImpersonating(): boolean {
    return this.user?.impersonator;
  }

  async trackIdentity(): Promise<void> {
    await when(() => this.userAppMetadata !== undefined);
    const userId = this.userAppMetadata?.userHash;
    if (userId) {
      this.rootStore?.analyticsStore.identify(userId);
      Sentry.setUser({ id: userId });
    } else {
      // if we don't have a user ID make sure we don't have a lingering Sentry identity
      Sentry.setUser(null);
    }
  }

  /**
   * Returns the Auth0 app_metadata for the given user id token.
   */
  get userAppMetadata(): UserAppMetadata | undefined {
    if (!this.user) return undefined;
    const appMetadataKey = `${METADATA_NAMESPACE}app_metadata`;
    const appMetadata = this.user[appMetadataKey];
    if (!appMetadata) {
      throw Error("No app_metadata available for user");
    }
    return appMetadata;
  }

  /**
   * Returns a list of tenant IDs that Recidiviz users can access.
   */
  get recidivizAllowedStates(): TenantId[] {
    const { availableStateCodes } = TENANT_CONFIGS[this.stateCode];
    if (isDemoMode()) {
      return availableStateCodes;
    }
    return intersection(
      availableStateCodes,
      this.userAppMetadata?.allowedStates ?? [],
    );
  }

  get userHash(): string {
    return this.userAppMetadata?.userHash ?? "";
  }

  get userPseudoId(): string | undefined {
    return this.userAppMetadata?.pseudonymizedId;
  }

  /**
   * Returns the state code of the authorized state for the given user.
   * For Recidiviz users or users in demo mode, this will be 'recidiviz'.
   * For CSG users this will be 'csg'.
   */
  get stateCode(): TenantId | InternalTenantId {
    const stateCode = this.userAppMetadata?.stateCode;
    if (!stateCode) {
      throw Error("No state code set for user");
    }
    return stateCode.toUpperCase() as TenantId | InternalTenantId;
  }

  /**
   * Returns the route permissions for the given user.
   */
  get routes(): RoutePermission[] {
    if (!this.userAppMetadata?.routes) return [];
    const routePermissions = entries(this.userAppMetadata?.routes);
    const routes: RoutePermission[] = routePermissions.map(
      ([fullRoute, permission]: RoutePermission) => {
        const urlComponents = fullRoute.split("_");
        const route = urlComponents[urlComponents.length - 1];
        return [route, permission];
      },
    );
    return routes;
  }

  /**
   * Returns the district this user is affiliated with, or undefined if not set.
   */
  get district(): string | undefined {
    return this.userAppMetadata?.district;
  }

  /**
   * Returns the user's external ID, or undefined if not set.
   * Returns "RECIDIVIZ" if it is a recidiviz user.
   */
  get externalId(): string | undefined {
    if (this.isRecidivizUser) return "RECIDIVIZ";
    return this.userAppMetadata?.externalId;
  }

  /**
   * Returns the allowedSupervisionLocationIds for the given user.
   */
  get allowedSupervisionLocationIds(): string[] {
    const allowedSupervisionLocationIds =
      this.userAppMetadata?.allowedSupervisionLocationIds;
    return allowedSupervisionLocationIds || [];
  }

  /**
   * Returns the list of states which are accessible to users to view data for.
   */
  get availableStateCodes(): TenantId[] {
    if (this.isRecidivizUser) {
      return this.recidivizAllowedStates;
    }
    return TENANT_CONFIGS[this.stateCode].availableStateCodes;
  }

  /**
   * Returns the human-readable state name for the authorized state code for
   * the given user.
   */
  get stateName(): string {
    return TENANT_CONFIGS[this.stateCode].name;
  }
  /**
   * Sets the override for a specific feature variant. This is only available for Recidiviz users.
   */
  setFeatureVariantOverride(
    featureVariant: FeatureVariant,
    override: boolean,
  ): void {
    if (!(this.isRecidivizUser || this.isImpersonating || this.isCSGUser))
      return;

    this.featureVariantOverrides[featureVariant] = override;

    sessionStorage.setItem(
      SESSION_FEATURE_VARIANT_OVERRIDES,
      JSON.stringify(this.featureVariantOverrides),
    );
  }
  /**
   * Gets the overrides for feature variants from session storage.
   */
  getFeatureVariantOverrides(): FeatureVariantOverrideRecord {
    const sessionOverrides = sessionStorage.getItem(
      SESSION_FEATURE_VARIANT_OVERRIDES,
    );
    return sessionOverrides
      ? (JSON.parse(sessionOverrides) as FeatureVariantOverrideRecord)
      : {};
  }
  /**
   * All feature variants currently active for this user, taking into account
   * the activeDate for each feature and observing the current Date for reactivity.
   * All overrides take ultimate precedence.
   */
  get activeFeatureVariants(): ActiveFeatureVariantRecord {
    if (this.userIsLoading || !this.isAuthorized) {
      return {};
    }

    let fvs = this.userAppMetadata?.featureVariants ?? {};

    if (isDemoMode() && this.userAppMetadata?.demoModeFeatureVariants)
      fvs = this.userAppMetadata?.demoModeFeatureVariants;

    if (this.isRecidivizUser)
      fvs = { ...defaultRecidivizUserFeatureVariantsActive, ...fvs };

    const tenantFeatureVariants =
      this.rootStore?.tenantStore.tenantFeatureVariants ?? {};

    fvs = { ...tenantFeatureVariants, ...fvs };

    const activeVariants: ActiveFeatureVariantRecord = Object.entries(
      fvs,
    ).reduce((activeVariants, [variantName, variantInfo]) => {
      if (!variantInfo) return activeVariants;

      const { variant, activeDate, activeTenants } = variantInfo;
      // check date once a minute so there isn't too much lag when we cross the threshold
      if (activeDate && new Date(activeDate).getTime() > now(1000 * 60))
        return activeVariants;

      const currentTenantId = this.rootStore?.currentTenantId;
      if (
        activeTenants &&
        currentTenantId &&
        !activeTenants.includes(currentTenantId)
      )
        return activeVariants;

      return {
        ...activeVariants,
        [variantName]: { ...(variant && { variant }) },
      };
    }, {});

    const sessionOverrides = this.featureVariantOverrides;
    Object.entries(sessionOverrides).forEach(([variant, override]) => {
      const typedVariant = variant as FeatureVariant;
      if (override) {
        if (activeVariants[typedVariant]) {
          delete activeVariants[typedVariant];
        } else {
          activeVariants[typedVariant] = {};
        }
      }
    });
    return activeVariants;
  }
  /**
   * Returns whether the user is authorized for specific state code.
   */
  userHasAccess(stateCode: TenantId): boolean {
    return this.availableStateCodes.includes(stateCode);
  }

  /**
   * Returns the navigation object based on the routes the user is authorized for
   */
  get userAllowedNavigation(): Navigation | undefined {
    if (!this.rootStore?.currentTenantId) return {};
    const { navigation, insightsLanternState } =
      TENANT_CONFIGS[this.rootStore.currentTenantId];

    const allowed = navigation;
    if (!allowed) return {};

    if (this.isCSGUser) {
      delete allowed.workflows;

      if (!insightsLanternState) {
        delete allowed.insights;
      }
    }

    /* Remove pages that may be allowed for the tenant but restricted for the user */
    Object.entries(navigation).forEach((navigationEntry) => {
      const [page, allConfiguredSubpages] = navigationEntry as [
        NavigationSection,
        string[],
      ];

      // The system page will be handled separately later
      if (page === DASHBOARD_VIEWS.system) return;

      // For routes with no configured subpages (e.g. psi, operations), the user
      // can keep access iff they are allowed to access the main route
      if (allConfiguredSubpages.length === 0) {
        if (!this.isUserAllowedRoute(page)) {
          delete allowed[page];
        }
        return;
      }

      // Filter the configured subpages to only the allowed ones
      const userAllowedSubpages = allConfiguredSubpages.filter((subpage) =>
        this.isUserAllowedRoute(page, subpage),
      );
      allowed[page] = userAllowedSubpages;

      // If there are no available subpages now, remove the entry from navigation
      if (userAllowedSubpages.length === 0) {
        delete allowed[page];

        // System page permissions are also included in the array associated with the
        // key `system`, so remove them as necessary from the value for `system`
        if (PathwaysPageIdList.includes(page)) {
          allowed.system?.splice(allowed.system?.indexOf(page), 1);
        }
      }
    });

    // If there are not any allowed system pages, delete the system key
    if (allowed.system?.length === 0) {
      delete allowed.system;
    }

    if (isIE11() && allowed?.supervisionToPrison) {
      const indexOfOfficerChart = allowed.supervisionToPrison?.findIndex(
        (r) => r === PATHWAYS_SECTIONS.countByOfficer,
      );
      allowed.supervisionToPrison.splice(indexOfOfficerChart, 1);
    }

    // The first key in insertion order will be the default page served by RedirectHome.
    // Because external demos often start with linestaff tools, redirect to
    // workflows home page when in demo mode.
    if (isDemoMode() && "workflows" in allowed) {
      const { workflows, ...rest } = allowed;
      return {
        workflows,
        ...rest,
        ...getAllowedMethodology(allowed),
      };
    }

    return { ...allowed, ...getAllowedMethodology(allowed) };
  }

  /**
   * Return true if the user should be allowed access to the route /pageName/subpageName
   * or, if subpageName is not provided, to the route /pageName
   */
  isUserAllowedRoute(pageName: string, subpageName?: string): boolean {
    return (
      this.getRoutePermission(pageName, subpageName) ||
      UNRESTRICTED_PAGES.includes(pageName)
    );
  }

  /**
   * Return true if the user has a route permission called `route`
   * or should be allowed access to the route /pageName/subpageName
   * or, if subpageName is not provided, to the route /pageName
   */
  getRoutePermission(route: string, subpage?: string): boolean {
    if (this.isRecidivizUser) return true;

    const isTasksAccessibleSubpage = Boolean(
      subpage && ["tasks", "clients", "residents"].includes(subpage),
    );

    const routePermission = this.routes.find(
      // permissionName represents a route permission of the user, such as added in the admin panel
      ([permissionName, isAllowed]) =>
        permissionName === route ||
        // special case for the "workflows" route:
        // there are actual multiple "routes" in the config that control the same URL route.
        // if any of them are true then the route should be permitted,
        // unless the subpage is "tasks", which is controlled with a different route permission
        (route === "workflows" &&
          permissionName.startsWith("workflows") &&
          isAllowed &&
          subpage !== "tasks") ||
        // special case for "tasks": the route permission tasks grants access to
        // /workflows/tasks, clients, and residents, but not other workflows routes
        (route === "workflows" &&
          permissionName === "tasks" &&
          isAllowed &&
          isTasksAccessibleSubpage) ||
        // special case for the "lantern" route, which maps to the "revocations" navigation item
        (route === "revocations" && permissionName === "lantern"),
    );
    // If the route does not exist in the RoutePermissions object, default to false;
    if (!routePermission) return false;
    return routePermission[1];
  }

  get canUserAccessTasks(): boolean {
    return this.getRoutePermission("tasks");
  }

  setAuthError(error: Error): void {
    runInAction(() => {
      this.userIsLoading = false;
      this.isAuthorized = false;
      this.authError = error;
    });
  }

  setImpersonationError(error: Error): void {
    this.impersonationError = error;
  }

  async loginWithRedirect(): Promise<void> {
    return this.auth0?.loginWithRedirect({
      appState: { targetUrl: window.location.href },
    });
  }

  get isRecidivizUser(): boolean {
    return this.stateCode === "RECIDIVIZ";
  }

  get isCSGUser(): boolean {
    return this.stateCode === "CSG";
  }

  async getTokenSilently(): Promise<any> {
    if (!this.getToken || !this.logout) return;

    const token = (await this.getToken()) as any;
    if (token instanceof Error) {
      this.userIsLoading = true;
      this.isAuthorized = false;
      this.logout();
      await this.loginWithRedirect();
    }
    return token;
  }

  get userEmail(): string | undefined {
    return this.user?.info?.email ?? this.user?.email;
  }

  get userFullName(): string | undefined {
    return [this.userGivenName ?? "", this.userSurname ?? ""].join(" ").trim();
  }

  get userGivenName(): string | undefined {
    return this.user?.info?.givenNames || this.user?.given_name;
  }

  get userMiddleName(): string | undefined {
    return this.user?.info?.middleNames || this.user?.middle_name;
  }

  get userSurname(): string | undefined {
    return this.user?.info?.family_name || this.user?.family_name;
  }

  get userFullNameFromAdminPanel() {
    if (!this.userAppMetadata) {
      return "";
    }

    const { firstName = "", lastName = "" } = this.userAppMetadata;
    return capitalizeName([firstName, lastName].join(" ").trim());
  }
}
