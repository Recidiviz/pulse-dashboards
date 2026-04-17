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

import { PlanSection } from "~@reentry/frontend/components/action-plan/types";

// Mock action plan data

const HOUSING_SECTION = `
You can start by talking with your mom about your stay and then look online and through local housing offices for shared or transitional housing options.

**Goal:** Secure a stable, affordable shared or transitional housing arrangement within 3 months.

**Action Items**

1. Talk with your mom about how long you can stay, what chores or rent you can contribute, and set clear expectations.
   - Due Date: End of Week 1
2. Call or visit your county housing authority to learn about transitional or subsidized housing waitlists and eligibility.
   - Due Date: End of Week 2

<notes>
Be ready to discuss how long you can stay with your mom and what you can contribute (rent or chores). Talk through your budget for rent, deposits, and any application fees. Review the documents you'll need for housing applications (ID, release papers, proof of income). Explain typical waitlist times for subsidized or transitional programs and explore interim options if lists are long. Discuss transportation to visits and background-check requirements for shared housing.
</notes>

<annotations>
<annotation text="Temporary stay with his mother; plans to find shared or roommate housing and explore transitional/subsidized options" location="Housing" source="Client intake summary" />
</annotations>
`.trim();

const EMPLOYMENT_SECTION = `
You can build on your construction experience to find a full-time framing or carpentry job by updating your resume, tapping into job services, and applying regularly.

**Goal:** Find and start a full-time framing or carpentry job with at least 40 hours per week within three months.

**Action Items**

1. Update your resume to highlight framing, carpentry, and general labor experience.
   - Due Date: End of Week 1
2. Register with your state workforce agency or local American Job Center for job search help.
   - Due Date: End of Week 1

<notes>
Be prepared to discuss any costs or barriers to updating and printing your resume (for example, access to a computer or printer, potential fees at a copy shop). Check internet or phone access for online job searches and applications. Confirm available hours each week, including probation check-in times, to ensure job search steps and interviews fit your schedule. Discuss potential challenges of a background check and brainstorm strategies for addressing work history and references.
</notes>

<annotations>
<annotation text="Four years of construction experience and seeking full-time work" location="Employment" source="Client intake summary" />
<annotation text="Lining up some construction labor leads" location="Employment" source="Client intake" />
</annotations>
`.trim();

export const MOCK_SECTIONS: PlanSection[] = [
  { id: "housing", title: "housing", markdown: HOUSING_SECTION },
  { id: "employment", title: "employment", markdown: EMPLOYMENT_SECTION },
];
