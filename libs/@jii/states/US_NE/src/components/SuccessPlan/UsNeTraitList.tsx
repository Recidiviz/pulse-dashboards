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

import { rem } from "polished";
import { FC, useState } from "react";
import styled from "styled-components";

import { RowDivider, SlateCopy } from "~@jii/common-ui";
import { useUsNeTranslations } from "~@jii/translation";
import { Icon, palette, spacing, typography } from "~design-system";

import { EmptySuccessPlanArea } from "./EmptySuccessPlanArea";

const Heading = styled.h2`
  ${typography.Serif24}
  margin-bottom: ${rem(spacing.sm)};
`;

const Description = styled(SlateCopy)`
  margin-bottom: ${rem(spacing.lg)};
`;

const TraitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

const Trait = styled.div`
  ${typography.Sans16}
`;

const ShowMoreButton = styled.button`
  border: 0;
  background-color: unset;
  padding: 0;
  margin-top: ${rem(spacing.lg)};

  min-height: ${rem(48)};

  ${typography.Sans16}
  color: ${palette.signal.links};
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
`;

const ButtonIcon = styled(Icon)`
  margin-left: ${rem(spacing.sm)};
  vertical-align: bottom;
`;

type UsNeTraitListProps = {
  kind: "strengths" | "skills";
  traits: string[];
};

const MAX_INITIALLY_SHOWN_TRAITS = 5;

export const UsNeTraitList: FC<UsNeTraitListProps> = ({ kind, traits }) => {
  const { t } = useUsNeTranslations();
  const { heading, description, empty } = t(($) => $.successPlan[kind], {
    returnObjects: true,
  });

  const [displayAll, setDisplayAll] = useState(false);
  const { showMore, showLess } = t(($) => $.successPlan.disclosure, {
    returnObjects: true,
  });

  const renderButton = traits.length > MAX_INITIALLY_SHOWN_TRAITS;
  const buttonText = displayAll ? showLess : showMore;
  const displayedTraits = displayAll
    ? traits
    : traits.slice(0, MAX_INITIALLY_SHOWN_TRAITS);

  return (
    <section>
      <Heading>{heading}</Heading>
      <Description options={{ forceBlock: true }}>{description}</Description>

      {traits.length === 0 ? (
        <EmptySuccessPlanArea {...empty} />
      ) : (
        <>
          <TraitList>
            <RowDivider />
            {displayedTraits.map((trait) => (
              <>
                <Trait key={trait}>{trait}</Trait>
                <RowDivider />
              </>
            ))}
            <RowDivider />
          </TraitList>
          {renderButton && (
            <ShowMoreButton onClick={() => setDisplayAll(!displayAll)}>
              {buttonText}

              <ButtonIcon
                kind="ChevronDown"
                size={18}
                strokeWidth={2}
                rotate={displayAll ? 180 : 0}
              />
            </ShowMoreButton>
          )}
        </>
      )}
    </section>
  );
};
