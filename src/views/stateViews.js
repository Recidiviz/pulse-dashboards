// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2019 Recidiviz, Inc.
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

import UsNdFreeThroughRecovery from './tenants/us_nd/FreeThroughRecovery';
import UsNdReincarcerations from './tenants/us_nd/Reincarcerations';
import UsNdRevocations from './tenants/us_nd/Revocations';
import UsNdSnapshots from './tenants/us_nd/Snapshots';
import UsNdCommunityGoals from './tenants/us_nd/community/Goals';
import UsNdCommunityExplore from './tenants/us_nd/community/Explore';
import UsNdFacilitiesGoals from './tenants/us_nd/facilities/Goals';
import UsNdFacilitiesExplore from './tenants/us_nd/facilities/Explore';
import UsNdProgrammingExplore from './tenants/us_nd/programming/Explore';
import UsMoRevocations from './tenants/us_mo/community/Revocations';

const STATE_VIEW_COMPONENTS = {
  us_mo: {
    '/community/revocations': UsMoRevocations,
  },
  us_nd: {
    '/community/goals': UsNdCommunityGoals,
    '/community/explore': UsNdCommunityExplore,
    '/facilities/goals': UsNdFacilitiesGoals,
    '/facilities/explore': UsNdFacilitiesExplore,
    '/programming/explore': UsNdProgrammingExplore,
  },
};

const STATE_LANDING_VIEWS = {
  us_mo: '/community/revocations',
  us_nd: '/community/goals',
};

const REDIRECTS = {
  us_mo: {
    '/revocations': '/community/revocations',
  },
  us_nd: {
    '/snapshots': '/community/goals',
    '/revocations': '/community/goals',
    '/reincarcerations': '/facilities/goals',
    '/programEvaluation/freeThroughRecovery': '/programming/explore',
  },
};

const LANTERN_STATE_CODES = ['us_mo'];

const ADMIN_STATE_CODES = ['recidiviz', 'lantern'];

/**
 * Returns the list of states which are available to view data for, across the entire app.
 */
function getAvailableStates() {
  return Object.keys(STATE_VIEW_COMPONENTS).sort();
}

/**
 * Returns the list of states which are accessible to admin users to view data for.
 */
function getAvailableStatesForAdminUser(isRecidivizUser, isLanternUser) {
  if (isRecidivizUser) {
    return getAvailableStates();
  }
  if (isLanternUser) {
    return LANTERN_STATE_CODES;
  }

  // This function should only be called for admin users who have access to multiple states
  return [];
}

/**
 * Returns the first available state in ABC order from among the available states
 * for this type of admin user.
 */
function getFirstAvailableState(isRecidivizUser, isLanternUser) {
  if (isRecidivizUser) {
    const stateCodes = getAvailableStates();
    return stateCodes[0];
  }
  if (isLanternUser) {
    return LANTERN_STATE_CODES[0];
  }

  // This function should only be called for admin users who have access to multiple states
  return null;
}

/**
 * Returns the first available state in ABC order from among the available states
 * for this type of admin user.
 */
function getFirstAvailableStateFromStateCode(stateCode) {
  const isRecidivizUser = stateCode.toLowerCase() === 'recidiviz';
  const isLanternUser = stateCode.toLowerCase() === 'lantern';
  return getFirstAvailableState(isRecidivizUser, isLanternUser);
}

/**
 * Returns the list of views that are available for the given state.
 */
function getAvailableViewsForState(stateCode) {
  const views = STATE_VIEW_COMPONENTS[stateCode.toLowerCase()];
  if (!views) {
    return [];
  }
  return Object.keys(views);
}

/**
 * Returns whether the given "state code" is indicative of an admin user.
 */
function isAdminStateCode(stateCode) {
  return ADMIN_STATE_CODES.includes(stateCode.toLowerCase());
}

const CURRENT_STATE_IN_SESSION = 'adminUserCurrentStateInSession';

/*
 * For admin users, returns the current state that should be viewed. This is retrieved from
 * the sessionStorage cache if already set. Otherwise, picks the first available state in ABC order.
 */
function getCurrentStateForAdminUsersFromStateCode(stateCode) {
  const fromStorage = sessionStorage.getItem(CURRENT_STATE_IN_SESSION);
  if (!fromStorage) {
    return getFirstAvailableStateFromStateCode(stateCode);
  }
  return fromStorage.toLowerCase();
}

/*
 * For admin users, returns the current state that should be viewed. This is retrieved from
 * the sessionStorage cache if already set. Otherwise, picks the first available state in ABC order.
 */
function getCurrentStateForAdminUsers(isRecidivizUser, isLanternUser) {
  const fromStorage = sessionStorage.getItem(CURRENT_STATE_IN_SESSION);
  if (!fromStorage) {
    return getFirstAvailableState(isRecidivizUser, isLanternUser);
  }
  return fromStorage.toLowerCase();
}

/**
 * For admin users, sets the current state that should be viewed in the sessionStorage cache.
 */
function setCurrentStateForAdminUsers(stateCode) {
  sessionStorage.setItem(CURRENT_STATE_IN_SESSION, stateCode.toLowerCase());
}

/**
 * For the given state code and view, returns the actual React component that should be rendered.
 * For example, two states could have "Snapshots" views, but they might have unique components to
 * allow for different visualizations.
 * Throw an error if the given state is not available, or if the given view is not available for
 * the state.
 */
function getComponentForStateView(stateCode, view) {
  const normalizedCode = isAdminStateCode(stateCode)
    ? getCurrentStateForAdminUsersFromStateCode(stateCode) : stateCode.toLowerCase();

  const stateComponents = STATE_VIEW_COMPONENTS[normalizedCode];
  if (!stateComponents) {
    throw Error(`No components registered for state ${normalizedCode}`);
  }

  const component = stateComponents[view.toLowerCase()];
  if (!component) {
    throw Error(`No components registered for state ${normalizedCode}
      for view ${view.toLowerCase()}`);
  }

  return component;
}

/**
 * Returns whether the given stateCode is a Lantern state.
 */
function isLanternState(stateCode) {
  let normalizedStateCode = stateCode;
  if (isAdminStateCode(stateCode)) {
    normalizedStateCode = getCurrentStateForAdminUsersFromStateCode(stateCode);
  }
  return LANTERN_STATE_CODES.includes(normalizedStateCode);
}

/**
 * Returns what should be the landing view, i.e. what you first see after login
 * or when you navigate to '/', for a given state.
 */
function getLandingViewForState(stateCode) {
  let normalizedStateCode = stateCode;
  if (isAdminStateCode(stateCode)) {
    normalizedStateCode = getCurrentStateForAdminUsersFromStateCode(stateCode);
  }
  return STATE_LANDING_VIEWS[normalizedStateCode] || '/';
}

function getRedirectedViewForState(view, stateCode) {
  return REDIRECTS[stateCode.toLowerCase()][view] || '/';
}

export {
  isLanternState,
  getAvailableStates,
  getAvailableStatesForAdminUser,
  getAvailableViewsForState,
  getLandingViewForState,
  getRedirectedViewForState,
  getComponentForStateView,
  getCurrentStateForAdminUsers,
  getCurrentStateForAdminUsersFromStateCode,
  setCurrentStateForAdminUsers,
  isAdminStateCode,
};
