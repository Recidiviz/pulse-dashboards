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

import { View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { SupportSystemContact } from "../model/successPlanner";

export function SuccessPlannerSupportSystemTable({
  contacts,
}: {
  contacts: SupportSystemContact[];
}) {
  return (
    <View className="overflow-hidden rounded-xl border border-subtle">
      <View className="flex-row bg-secondary px-4 py-2">
        <Typography
          variant="caption-s-medium"
          className="flex-1 uppercase text-secondary"
        >
          Name
        </Typography>
        <Typography
          variant="caption-s-medium"
          className="flex-1 uppercase text-secondary"
        >
          How do you know them?
        </Typography>
      </View>
      {contacts.map((contact) => (
        <View
          key={`${contact.name}-${contact.relationship}`}
          className="flex-row border-t border-subtle px-4 py-3"
        >
          <Typography variant="body-s-regular" className="flex-1 text-primary">
            {contact.name}
          </Typography>
          <Typography variant="body-s-regular" className="flex-1 text-primary">
            {contact.relationship}
          </Typography>
        </View>
      ))}
    </View>
  );
}
