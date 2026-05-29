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

import { observer } from "mobx-react-lite";
import { useLocation } from "react-router-dom";

import { useUsAzTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { useUsAzSingleResidentContext } from "../UsAzSingleResidentContext/UsAzSingleResidentContext";
import { UsAzDateHash } from "../utils/utils";
import { AccordionSection } from "./AccordionSection";
import { ImportantDatesFAQPresenter } from "./ImportantDatesFAQPresenter";
import { ImportantDatesFilterButtons } from "./ImportantDatesFilterButtons";
import { ImportantDatesTOC } from "./ImportantDatesTOC";

const ManagedComponent = observer(function UsAzImportantDatesFAQ({
  presenter,
}: {
  presenter: ImportantDatesFAQPresenter;
}) {
  const { t } = useUsAzTranslations();

  return (
    <>
      {presenter.personalDates.length > 0 && (
        <ImportantDatesFilterButtons presenter={presenter} />
      )}

      <ImportantDatesTOC presenter={presenter} />

      {presenter.nonDateSectionHashes.map((hash) => (
        <AccordionSection
          key={hash}
          id={hash}
          accordionCopy={t(
            // @ts-expect-error This is a list of keys from the object but the types are lost by Object.keys
            ($) => $.importantDatesInfoPage.generalFAQ[hash].questions,
            {
              returnObjects: true,
            },
          )}
          sectionCopy={{
            // @ts-expect-error This is a list of keys from the object but the types are lost by Object.keys
            header: t(($) => $.importantDatesInfoPage.generalFAQ[hash].header),
            openAllCopy: t(($) => $.openAll),
            closeAllCopy: t(($) => $.closeAll),
          }}
          faqPresenter={presenter}
        />
      ))}

      {presenter.dateHashes.map((hash) => (
        <AccordionSection
          key={hash}
          id={hash}
          accordionCopy={t(($) => $.importantDatesFAQ[hash].questions, {
            returnObjects: true,
          })}
          sectionCopy={{
            header: t(($) => $.importantDatesFAQ[hash].header),
            openAllCopy: t(($) => $.openAll),
            closeAllCopy: t(($) => $.closeAll),
          }}
          faqPresenter={presenter}
        />
      ))}
    </>
  );
});

function usePresenter() {
  const { displayedDates } = useUsAzSingleResidentContext();
  const { t } = useUsAzTranslations();

  const { hash } = useLocation();

  return new ImportantDatesFAQPresenter(
    displayedDates,
    t,
    hash.slice(1) as UsAzDateHash,
  );
}

export const UsAzImportantDatesFAQ = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
