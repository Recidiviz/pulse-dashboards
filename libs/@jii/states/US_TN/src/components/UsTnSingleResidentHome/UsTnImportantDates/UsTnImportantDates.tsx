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

import {
  ActivityList,
  ActivityRow,
  ActivityRowDivider,
  Card,
  Chip,
  GoButton,
  HomepageSectionHeading,
} from "~@jii/common-ui";
import { hydrateTemplate, useSingleResidentContext } from "~@jii/data";
import { CardDateInfo } from "~@jii/earned-good-time";
import { State } from "~@jii/paths";
import { useUsTnTranslations } from "~@jii/translation";
import { UsTnResidentMetadata } from "~datatypes";
import { withPresenterManager } from "~hydration-utils";

import { UsTnImportantDatesPresenter } from "./UsTnImportantDatesPresenter";

const ImportantDateCard = ({
  section,
  metadata,
  children,
  infoPageAnchorTag,
}: {
  section: "releaseEligibilityDate" | "expirationDate";
  metadata: UsTnResidentMetadata;
  children?: React.ReactNode;
  infoPageAnchorTag?: "expiration-date";
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
          {},
          infoPageAnchorTag,
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
      <ImportantDateCard
        section="expirationDate"
        metadata={metadata}
        infoPageAnchorTag="expiration-date"
      >
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
        <ActivityList>
          <ActivityRow>
            <div>Full Expiration Date</div>
            <div>
              {hydrateTemplate(
                "{{formatFullDateOptional expirationDateOriginal 'No original FXP date on record'}}",
                metadata,
              )}
            </div>
          </ActivityRow>
          <ActivityRowDivider />
          <ActivityRow>
            <div>Total reduction</div>
            <div>
              <Chip color="green">{`-${expirationDateReduction}`}</Chip>
            </div>
          </ActivityRow>
          <ActivityRowDivider />
          <ActivityRow>
            <div>Adjusted FXP date</div>
            <div>
              {hydrateTemplate(
                "{{formatFullDateOptional expirationDate 'No updated FXP date on record'}}",
                metadata,
              )}
            </div>
          </ActivityRow>
          <ActivityRowDivider />
        </ActivityList>
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
