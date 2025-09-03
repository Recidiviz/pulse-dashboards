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

import { Card } from "~@jii/common-ui";
import { withPresenterManager } from "~hydration-utils";

import { BulletTimeline } from "../../common/components/BulletTimeline";
import { CardDateInfo } from "../../common/components/CardDateInfo";
import { useSingleResidentContext } from "../../components/SingleResidentHydrator/context";
import { hydrateTemplate } from "../../configs/hydrateTemplate";
import {
  HomepageSectionHeading,
  SlateCopy,
} from "../../US_MA/earnedGoodTime/components/Homepage/styles";
import { UsTnImportantDatesPresenter } from "./UsTnImportantDatesPresenter";

const ManagedComponent: FC<{
  presenter: UsTnImportantDatesPresenter;
}> = observer(function UsTnImportantDates({ presenter }) {
  const { resident } = presenter;

  // TODO(#9283):[JII][TN] Move copy into a central location
  return (
    <section>
      <HomepageSectionHeading>Important Dates</HomepageSectionHeading>
      <Card>
        <CardDateInfo
          label="Release Eligibility Date"
          tag="RED"
          value={hydrateTemplate(
            "{{formatFullDateOptional metadata.releaseEligibilityDate 'No release eligibility date on record'}}",
            resident,
          )}
        />
        <SlateCopy>
          The earliest date when you may be eligible for release for parole
        </SlateCopy>
      </Card>
      <Card>
        <CardDateInfo
          label="Expiration Date"
          tag="EXP"
          value={hydrateTemplate(
            "{{formatFullDateOptional metadata.expirationDate 'No expiration date on record'}}",
            resident,
          )}
        />
        <SlateCopy>
          The latest date you can be held in a TDOC facility
        </SlateCopy>
        <ExpirationDateReduction presenter={presenter} />
      </Card>
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
