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

// Contact compliance rules taken from:
// https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/pipeline/utils/state_utils/us_id/us_id_supervision_compliance.py
import { TenantId } from "../../RootStore/types";
import { SupervisionTasksCaseType } from "./types";

type ContactStandard = { contacts: number; days: number };

export const US_ID_SUPERVISION_LEVEL_CONTACT_COMPLIANCE: Record<
  SupervisionTasksCaseType,
  Record<string, ContactStandard>
> = {
  GENERAL: {
    MINIMUM: {
      contacts: 1,
      days: 180,
    },
    MEDIUM: {
      contacts: 1,
      days: 45,
    },
    HIGH: {
      contacts: 1,
      days: 15,
    },
    MAXIMUM: {
      contacts: 1,
      days: 15,
    },
  },
  SEX_OFFENSE: {
    MINIMUM: {
      contacts: 1,
      days: 90,
    },
    MEDIUM: {
      contacts: 1,
      days: 30,
    },
    HIGH: {
      contacts: 2,
      days: 30,
    },
    MAXIMUM: {
      contacts: 2,
      days: 30,
    },
  },
};

// Home visit compliance rules taken from:
// https://drive.google.com/file/d/1qx1S0Z8zfNe53YBImW4As-LoeKH0-YEl/view
export const US_ID_SUPERVISION_LEVEL_HOME_VISIT_COMPLIANCE: Record<
  SupervisionTasksCaseType,
  Record<string, ContactStandard>
> = {
  GENERAL: {
    MINIMUM: {
      contacts: 1,
      days: 365,
    },
    MEDIUM: {
      contacts: 1,
      days: 365,
    },
    HIGH: {
      contacts: 1,
      days: 180,
    },
  },
  SEX_OFFENSE: {
    MINIMUM: {
      contacts: 1,
      days: 90,
    },
    MEDIUM: {
      contacts: 1,
      days: 60,
    },
    HIGH: {
      contacts: 1,
      days: 30,
    },
  },
};

// Employment Verification standards
export const US_ID_SUPERVISION_EMPLOYMENT_VERIFICATION_COMPLIANCE: Record<
  string,
  ContactStandard
> = {
  MINIMUM: {
    contacts: 1,
    days: 60,
  },
  MEDIUM: {
    contacts: 1,
    days: 60,
  },
  HIGH: {
    contacts: 1,
    days: 30,
  },
};

export function taskPageDescriptionForState(state?: TenantId): React.ReactNode {
  switch (state) {
    case "US_ID":
      return "The clients below might have upcoming requirements this month. Hiding a below task will not change an officer's timeliness percentage in the Operations metrics.";
    case "US_TX":
      return (
        <>
          The clients listed below have upcoming requirements due this month
          that have not yet been completed. Data is refreshed from OIMS nightly.
          For more information on how this tool calculates contacts & due dates
          for most offices click{" "}
          <a
            href="https://docs.google.com/document/d/e/2PACX-1vQamrgWtwG-kUfm6sBTRjRCYlFAZmMUQRHvoZ-fLU_YO0YfEElrVG7Rgq9NFdIq-NbcD_aILsZvWT2Z/pub"
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>{" "}
          and for designated 'Critically Understaffed' offices click{" "}
          <a
            href={
              "https://docs.google.com/document/d/e/2PACX-1vTIXGLHHXQ0STYmapw4pzAcW3j3I8455jaaEH6d61-btlzkiPzS-GQaYJu3aG32o8B1i1mzRWwXbHbV/pub"
            }
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>
          .
        </>
      );
    default:
      return "The clients below might have upcoming requirements this month.";
  }
}
