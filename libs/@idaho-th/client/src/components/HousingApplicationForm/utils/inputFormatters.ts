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

import { format } from "date-fns";

import {
  digitsOnly,
  formatPhone,
  normalizeUsPhoneNumber,
} from "~@idaho-th/shared";

export { digitsOnly, formatPhone, normalizeUsPhoneNumber };

export const formatMmDdYyyy = (raw: Date | string | null | undefined) => {
  if (!raw) return undefined;
  if (raw instanceof Date) return format(raw, "MM/dd/yyyy");
  const d = digitsOnly(raw).slice(0, 8);
  const mm = d.slice(0, 2);
  const dd = d.slice(2, 4);
  const yyyy = d.slice(4, 8);
  if (d.length <= 2) return mm;
  if (d.length <= 4) return `${mm}/${dd}`;
  return `${mm}/${dd}/${yyyy}`;
};
