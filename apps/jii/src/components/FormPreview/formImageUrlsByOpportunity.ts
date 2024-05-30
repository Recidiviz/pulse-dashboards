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

import p1 from "~shared-assets/images/form-previews/US_ME/SCCP/p1.png";
import p2 from "~shared-assets/images/form-previews/US_ME/SCCP/p2.png";
import p3 from "~shared-assets/images/form-previews/US_ME/SCCP/p3.png";
import p4 from "~shared-assets/images/form-previews/US_ME/SCCP/p4.png";
import p5 from "~shared-assets/images/form-previews/US_ME/SCCP/p5.png";
import p6 from "~shared-assets/images/form-previews/US_ME/SCCP/p6.png";
import p7 from "~shared-assets/images/form-previews/US_ME/SCCP/p7.png";
import p8 from "~shared-assets/images/form-previews/US_ME/SCCP/p8.png";
import p9 from "~shared-assets/images/form-previews/US_ME/SCCP/p9.png";
import p10 from "~shared-assets/images/form-previews/US_ME/SCCP/p10.png";

import { IncarcerationOpportunityId } from "../../configs/types";

export const formImageUrlsByOpportunity: Partial<
  Record<IncarcerationOpportunityId, [string, ...Array<string>]>
> = {
  usMeSCCP: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
};
