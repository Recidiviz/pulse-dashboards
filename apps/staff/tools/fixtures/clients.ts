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

import { RawClientRecord } from "~datatypes";

import { US_CA_CLIENTS } from "./clients/usCaClients";
import { US_IA_CLIENTS } from "./clients/usIaClients";
import { US_ID_CLIENTS } from "./clients/usIdClients";
import { US_ME_CLIENTS } from "./clients/usMeClients";
import { US_MI_CLIENTS } from "./clients/usMiClients";
import { US_ND_CLIENTS } from "./clients/usNdClients";
import { US_PA_CLIENTS } from "./clients/usPaClients";
import { US_TN_CLIENTS } from "./clients/usTnClients";
import { US_TX_CLIENTS } from "./clients/usTxClients";
import { US_UT_CLIENTS } from "./clients/usUtClients";
import { FirestoreFixture, PersonFixture } from "./utils";

export type ClientFixture = PersonFixture<RawClientRecord>;

const data: ClientFixture[] = [
  ...US_CA_CLIENTS,
  ...US_IA_CLIENTS,
  ...US_ID_CLIENTS,
  ...US_ME_CLIENTS,
  ...US_MI_CLIENTS,
  ...US_ND_CLIENTS,
  ...US_PA_CLIENTS,
  ...US_TN_CLIENTS,
  ...US_TX_CLIENTS,
  ...US_UT_CLIENTS,
];

export const clientsData: FirestoreFixture<ClientFixture> = {
  data,
  idFunc: (r) => r.personExternalId,
};
