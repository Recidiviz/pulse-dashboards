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

import { DocumentData } from "firebase/firestore";

import { OpportunityUpdate } from "../../../../FirestoreStore";
import { JusticeInvolvedPerson } from "../../../types";
import { OpportunityBase } from "../../OpportunityBase";

export abstract class UsAzTprDtpOpportunityBase<
  Resident extends JusticeInvolvedPerson,
  ReferralRecord extends DocumentData,
  UpdateRecord extends OpportunityUpdate,
> extends OpportunityBase<Resident, ReferralRecord, UpdateRecord> {
  get agreementStatus(): string {
    return (
      this.record.caseNotes["Agreement Form Signature Status"]?.[0].noteTitle ??
      "\u{2014}"
    );
  }

  get homePlanStatus(): string {
    return (
      this.record.caseNotes["Home Plan Information"]?.[0].noteTitle ??
      "\u{2014}"
    );
  }

  get mandatoryLiteracyStatus(): string {
    return (
      this.record.caseNotes["Mandatory Literacy Enrollment Information"]?.[0]
        .noteTitle ?? "\u{2014}"
    );
  }
}
