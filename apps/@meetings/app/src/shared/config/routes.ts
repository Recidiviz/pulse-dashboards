// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { NavigatorScreenParams } from "@react-navigation/native";

export type ClientsStackParamList = {
  Clients: undefined;
  ClientProfile: {
    personId: string;
  };
  ClientNewMeeting: {
    personId: string;
    fullName: string;
    displayPersonExternalId: string;
    primaryMetadata: string;
    meetingId: string;
  };
  ClientMeeting: {
    personId: string;
    meetingId: string;
  };
};

export type ResidentsStackParamList = {
  Residents: undefined;
  ResidentProfile: {
    personId: string;
  };
  ResidentNewMeeting: {
    personId: string;
    fullName: string;
    displayPersonExternalId: string;
    primaryMetadata: string;
    meetingId: string;
  };
  ResidentMeeting: {
    personId: string;
    meetingId: string;
  };
};

export type RootStackParamList = {
  ClientsRoot: NavigatorScreenParams<ClientsStackParamList>;
  ResidentsRoot: NavigatorScreenParams<ResidentsStackParamList>;
  StateSelection: undefined;
};

export type AppStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<RootStackParamList>;
};
