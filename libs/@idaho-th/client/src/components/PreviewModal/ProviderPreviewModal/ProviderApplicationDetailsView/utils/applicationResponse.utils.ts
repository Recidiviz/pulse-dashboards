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

type InfoRequestMessage = {
  senderType: string;
  body: string;
  createdAt: Date;
};

export function getLatestProviderMessage(messages: InfoRequestMessage[]) {
  return messages.reduce<InfoRequestMessage | null>((latest, message) => {
    if (message.senderType !== "PROVIDER") {
      return latest;
    }
    if (!latest || message.createdAt > latest.createdAt) {
      return message;
    }
    return latest;
  }, null);
}
