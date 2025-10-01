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

import { observer } from "mobx-react-lite";
import { FC } from "react";

import { Card, GoButton, HomepageSectionHeading } from "~@jii/common-ui";
import { hydrateTemplate, useSingleResidentContext } from "~@jii/data";
import { BulletTimeline, CardDateInfo } from "~@jii/earned-good-time";
import { State } from "~@jii/paths";
import { useUsTnTranslations } from "~@jii/translation";
import { UsTnResidentMetadata } from "~datatypes";
import { withPresenterManager } from "~hydration-utils";

import { UsTnImportantDatesPresenter } from "./UsTnImportantDatesPresenter";

const ImportantDateCard = ({
  section,
  metadata,
  children,
}: {
  section: "releaseEligibilityDate" | "expirationDate";
  metadata: UsTnResidentMetadata;
  children?: React.ReactNode;
}) => {
  const { t } = useUsTnTranslations();

  return (
    <Card>
      <CardDateInfo
        label={t(($) => $.importantDates[section].label)}
        //@ts-expect-error TS2322 - The templating function can accept a Date
        value={t(($) => $.importantDates[section].contents, {
          [section]: metadata[section] ?? undefined,
        })}
      />
      {children}
      <GoButton
        to={State.Resident.$.UsTnMoreInformation.ImportantDates.buildRelativePath(
          {},
        )}
      >
        Learn More
      </GoButton>
    </Card>
  );
};

const ManagedComponent: FC<{
  presenter: UsTnImportantDatesPresenter;
}> = observer(function UsTnImportantDates({ presenter }) {
  const { metadata } = presenter;
  const { t } = useUsTnTranslations();

  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.importantDates.sectionHeading)}
      </HomepageSectionHeading>
      <ImportantDateCard section="releaseEligibilityDate" metadata={metadata} />
      <ImportantDateCard section="expirationDate" metadata={metadata}>
        <ExpirationDateReduction presenter={presenter} />
      </ImportantDateCard>
    </section>
  );
});

// TODO(#9283):[JII][TN] Move copy into a central location
const ExpirationDateReduction = ({
  presenter,
}: {
  presenter: UsTnImportantDatesPresenter;
}) => {
  const {
    expirationDateReduced,
    expirationDateReduction,
    resident: { metadata },
  } = presenter;

  if (!expirationDateReduced) return null;

  return (
    <>
      <hr />
      <div>
        You've earned {expirationDateReduction} off your Expiration Date
      </div>
      <div>
        <BulletTimeline
          items={[
            {
              label: "Original EXP date",
              value: hydrateTemplate(
                "{{formatFullDateOptional expirationDateOriginal 'No original EXP date on record'}}",
                metadata,
              ),
            },
            {
              label: "Total reduction",
              value: `-${expirationDateReduction}`,
            },
            {
              label: "Adjusted EXP date",
              value: hydrateTemplate(
                "{{formatFullDateOptional expirationDate 'No updated EXP date on record'}}",
                metadata,
              ),
            },
          ]}
        />
      </div>
    </>
  );
};

function usePresenter() {
  const { resident } = useSingleResidentContext();

  return new UsTnImportantDatesPresenter(resident);
}

export const UsTnImportantDates = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
