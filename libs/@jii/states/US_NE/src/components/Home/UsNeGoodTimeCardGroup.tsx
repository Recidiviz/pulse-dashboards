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
import { useUsNeTranslations } from "~@jii/translation";
import type { UsNeResidentMetadata } from "~datatypes";

const goodTimeCards = [
  { id: "gbmd", metadataField: "goodTimeBalanceDays", definitionSlug: "gbmd" },
  {
    id: "lgtr",
    metadataField: "goodTimeLostDaysRestorable",
    definitionSlug: "gbmd",
  },
  {
    id: "lgtn",
    metadataField: "goodTimeLostDaysNonRestorable",
    definitionSlug: "gbmd",
  },
  { id: "lb191", metadataField: "lb191Credits", definitionSlug: "lb191" },
  {
    id: "jailCredits",
    metadataField: "jailTimeDays",
    definitionSlug: "jailCredits",
  },
] as const satisfies {
  id: string;
  metadataField: keyof UsNeResidentMetadata;
  definitionSlug: string;
}[];

const UsNeGoodTimeCardGroup = () => {
  const metadata = useResidentMetadata("US_NE");
  const { t } = useUsNeTranslations();

  const cards = goodTimeCards.map((card) => {
    const { id, metadataField, definitionSlug } = card;

    const count = metadata[metadataField];
    if (count === null) return null;

    // Are we building the lb191 card for a resident it doesn't apply to?
    const non191GoodTimeLaw =
      id === "lb191" && metadata.goodTimeLawNumber !== "191";

    const summary = non191GoodTimeLaw
      ? t(($) => $.home.goodTimeBalances.cards.lb191.summaryOtherLaw, {
          lawNumber: metadata.goodTimeLawNumber,
        })
      : t(($) => $.home.goodTimeBalances.cards[id].summary, { count });

    return (
      <Card key={id}>
        <CardDateInfo
          label={t(($) => $.home.goodTimeBalances.cards[id].label)}
          value={t(($) => $.home.goodTimeBalances.cards[id].value, { count })}
        />
        <SlateCopy options={{ forceBlock: true }}>{summary}</SlateCopy>
        {!non191GoodTimeLaw && (
          <GoLink
            to={State.Resident.$.UsNeMoreInformation.buildRelativePath({
              pageSlug: definitionSlug,
            })}
          >
            {t(($) => $.home.goodTimeBalances.moreInfoLink)}
          </GoLink>
        )}
      </Card>
    );
  });

  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.home.goodTimeBalances.sectionTitle)}
      </HomepageSectionHeading>
      {cards}
    </section>
  );
};

export default UsNeGoodTimeCardGroup;
