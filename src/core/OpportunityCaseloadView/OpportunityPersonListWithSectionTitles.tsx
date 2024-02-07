// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { observer } from "mobx-react-lite";

import { useRootStore } from "../../components/StoreProvider";
import { useOrderedActiveTab } from "../../hooks/useOrderedActiveTab";
import { SectionLabelText } from "../sharedComponents";
import CaseloadOpportunityGrid from "./CaseloadOpportunityGrid";
import { PersonList } from "./OpportunityPersonList";

export const OpportunityPersonListWithSectionTitles = observer(
  function OpportunityPersonListWithSectionTitles() {
    const {
      workflowsStore: {
        selectedOpportunityType: opportunityType,
        opportunitiesByTab,
      },
    } = useRootStore();
    const { displayTabs } = useOrderedActiveTab();
    if (!opportunityType) return null;
    const oppsByTabMap = opportunitiesByTab[opportunityType];

    return (
      <>
        {displayTabs.map((sectionTitle) => {
          return (
            oppsByTabMap &&
            oppsByTabMap?.[sectionTitle]?.length > 0 && (
              <div key={sectionTitle}>
                {/* Only display the section title if there are multiple sections or the one we're
            displaying isn't the first in the section order (such as "Almost Eligible") */}
                {(Object.keys(oppsByTabMap).length > 1 ||
                  sectionTitle !== displayTabs[0]) && (
                  <SectionLabelText>{sectionTitle}</SectionLabelText>
                )}
                <PersonList
                  key={`PersonList_${sectionTitle}`}
                  className={`PersonList_${sectionTitle} PersonList`}
                >
                  <CaseloadOpportunityGrid items={oppsByTabMap[sectionTitle]} />
                </PersonList>
              </div>
            )
          );
        })}
      </>
    );
  }
);
