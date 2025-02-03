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

import { Icon, palette, spacing, typography } from "@recidiviz/design-system";
import Markdown from "markdown-to-jsx";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import { FC, Fragment } from "react";
import styled from "styled-components/macro";

import { RequirementsSectionContent } from "../../models/EligibilityReport/interface";
import { GoButton } from "../ButtonLink/GoButton";
import { EligibilityStatusChip } from "../EligibilityStatusChip/EligibilityStatusChip";
import { OpportunityEligibilityPresenter } from "./OpportunityEligibilityPresenter";
import { Section, SectionHeading } from "./styles";

const LIST_PAD = spacing.xl;
const BULLET_PAD = 12;

const Header = styled.header`
  align-items: flex-start;
  display: flex;
  justify-content: space-between;

  /* put margin on the header instead so it collapses with the following element */
  margin-bottom: ${rem(spacing.xl)};
  ${SectionHeading} {
    margin: 0;
  }
`;

const Highlights = styled.dl`
  border-bottom: 1px solid ${palette.slate20};
  margin: 0 0 ${rem(spacing.xl)};
  padding-bottom: ${rem(spacing.md)};

  dt {
    ${typography.Sans18}

    color: ${palette.slate85};
    margin-bottom: ${rem(spacing.xs)};
  }

  dd {
    ${typography.Sans24}

    color: ${palette.pine1};
    margin: 0 0 ${rem(spacing.md)};
  }
`;

const RequirementsGroupings = styled.dl`
  dt {
    ${typography.Sans18}

    color: ${palette.text.caption};
    margin-bottom: ${rem(BULLET_PAD)};
    text-wrap: balance;
  }

  dd {
    margin: 0;
    margin-bottom: ${rem(spacing.xxl)};

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  ul {
    margin: 0;

    padding-inline-start: ${rem(LIST_PAD)};
    list-style-type: none;

    li {
      margin-bottom: ${rem(BULLET_PAD)};
    }
  }
`;

const MARKER_SIZE = 18;
const RequirementMarker = styled(Icon).attrs({ size: MARKER_SIZE })`
  margin-right: calc(${rem(LIST_PAD)} - ${MARKER_SIZE}px);
  margin-left: -${rem(LIST_PAD)};
  vertical-align: bottom;

  @media (forced-colors: active) {
    fill: currentColor;
  }
`;

const IneligibleReason = styled.div`
  ${typography.Sans14}
  margin-top: ${rem(spacing.xs)};
`;

const RequirementsList: FC<{ section: RequirementsSectionContent }> = observer(
  function RequirementsList({ section }) {
    return (
      <ul>
        {section.requirements.map((r) => (
          <li key={r.criterion}>
            <RequirementMarker
              kind={section.icon}
              color={
                section.icon === "Success"
                  ? palette.signal.highlight
                  : section.icon === "CloseOutlined"
                    ? palette.pine3
                    : rgba(palette.slate, 0.4)
              }
            />
            {r.criterion}
            {r.ineligibleReason && (
              <IneligibleReason>{r.ineligibleReason}</IneligibleReason>
            )}
          </li>
        ))}
      </ul>
    );
  },
);

export const RequirementsSection: FC<{
  presenter: OpportunityEligibilityPresenter;
}> = observer(function RequirementsSection({ presenter }) {
  return (
    <Section id={presenter.requirementsContent.id}>
      <Header>
        <SectionHeading>{presenter.requirementsContent.heading}</SectionHeading>
        <EligibilityStatusChip {...presenter.status} />
      </Header>
      {presenter.highlights && (
        <Highlights>
          {presenter.highlights.map(({ label, value }) => (
            <Fragment key={label}>
              <dt>
                <Markdown>{label}</Markdown>
              </dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </Highlights>
      )}
      <RequirementsGroupings>
        {presenter.requirementsContent.sections.map((section) => (
          <Fragment key={section.label}>
            <dt>
              <Markdown>{section.label}</Markdown>
            </dt>
            <dd>
              <RequirementsList section={section} />
            </dd>
          </Fragment>
        ))}
      </RequirementsGroupings>
      {presenter.requirementsContent.linkUrl && (
        <GoButton to={presenter.requirementsContent.linkUrl}>
          {presenter.requirementsContent.linkText}
        </GoButton>
      )}
    </Section>
  );
});
