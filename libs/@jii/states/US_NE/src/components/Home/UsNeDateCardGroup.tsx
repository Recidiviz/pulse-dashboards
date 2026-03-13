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

import {
  Card,
  GoLink,
  HomepageSectionHeading,
  SlateCopy,
} from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { CardDateInfo } from "~@jii/earned-good-time";
import { State } from "~@jii/paths";
import { useUsNeTranslations, UsNeTranslationsObject } from "~@jii/translation";
import type { UsNeResidentMetadata } from "~datatypes";

const dateCards = [
  { id: "trd", metadataField: "tentativeReleaseDate" },
  { id: "ped", metadataField: "paroleEligibilityDate" },
  { id: "mmtd", metadataField: "mandatoryMinimumDate" },
] as const satisfies {
  id: keyof UsNeTranslationsObject["home"]["dates"]["cards"];
  metadataField: keyof UsNeResidentMetadata;
}[];

const UsNeDateCardGroup = () => {
  const metadata = useResidentMetadata("US_NE");
  const { t } = useUsNeTranslations();

  const cards = dateCards.map(({ id, metadataField }) => {
    const value = metadata[metadataField];
    if (value === null) return null;

    return (
      <Card key={id}>
        <CardDateInfo
          label={t(($) => $.home.dates.cards[id].label)}
          value={t(($) => $.home.dates.cards[id].value, { value })}
        />
        <SlateCopy options={{ forceBlock: true }}>
          {t(($) => $.home.dates.cards[id].summary)}
        </SlateCopy>
        <GoLink
          to={State.Resident.$.UsNeMoreInformation.buildRelativePath({
            pageSlug: id,
          })}
        >
          {t(($) => $.home.dates.moreInfoLink)}
        </GoLink>
      </Card>
    );
  });

  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.home.dates.sectionTitle)}
      </HomepageSectionHeading>
      {cards}
    </section>
  );
};

export default UsNeDateCardGroup;
