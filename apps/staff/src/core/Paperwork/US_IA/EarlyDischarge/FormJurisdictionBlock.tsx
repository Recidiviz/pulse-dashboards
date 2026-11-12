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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { UsIaEarlyDischargeCharge } from "~datatypes";
import { palette } from "~design-system";
import { pluralize } from "~utils";

import { CharacterCountTextField } from "../../../../components/CharacterCountTextField/CharacterCountTextField";
import { useRootStore } from "../../../../components/StoreProvider";
import { formatWorkflowsDateString } from "../../../../utils";
import {
  narrativeKey,
  UsIaEarlyDischargeForm,
} from "../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { resolveCurrentUserName } from "../../../../WorkflowsStore/Opportunity/Forms/utils";
import { WorkflowsBadgePill } from "../../../BadgePill/BadgePill";
import {
  DEFAULT_MAX_CHAR_LENGTH,
  DEFAULT_MIN_CHAR_LENGTH,
} from "../../../constants";
import { hideWhenPrintingStyle } from "../../../sharedComponents";
import { SecureDetailsContent } from "../../../WorkflowsJusticeInvolvedPersonProfile/styles";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { useReactiveInput } from "../../utils";
import {
  FieldLabel,
  FieldRow,
  FieldValue,
  ScreenOnly,
  SectionHeader,
  SectionLabel,
} from "./styles";
import { chargeMetaLine, jurisdictionSlug } from "./utils";

// Block and ChargeTableScroller drop their overflow on paper, because clipped
// or scrolling boxes don't continue onto the next printed page.
const Block = styled.section`
  border: 1px solid ${palette.slate10};
  border-radius: ${rem(8)};
  margin-top: ${rem(spacing.lg)};
  overflow: hidden;

  @media print {
    overflow: visible;
  }
`;

const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  background-color: ${palette.slate05};
  border-bottom: 1px solid ${palette.slate10};
`;

// TODO(IA-397): color the dot by the jurisdiction's submission status.
const StatusDot = styled.span`
  width: ${rem(10)};
  height: ${rem(10)};
  border-radius: 50%;
  flex: none;
  background-color: ${palette.pine4};
  ${hideWhenPrintingStyle}
`;

const BlockBody = styled.div`
  padding: 0 ${rem(spacing.md)} ${rem(spacing.md)};
`;

// Block clips its overflow to keep the header inside its rounded corners, so
// the table scrolls here rather than losing columns when the page is narrow.
const ChargeTableScroller = styled.div`
  overflow-x: auto;

  @media print {
    overflow: visible;
  }
`;

const ChargeTable = styled.table.attrs({ className: "fs-exclude" })`
  ${typography.Sans14}
  width: 100%;
  text-align: left;
  border-collapse: collapse;
  color: ${palette.pine1};

  th {
    color: ${palette.slate80};
    font-weight: unset;
  }

  th,
  td {
    padding: ${rem(spacing.sm)};
    border-bottom: 1px solid ${palette.slate10};
    vertical-align: top;
  }
`;

const BlockTitle = styled(SecureDetailsContent).attrs({ as: "h3" })`
  margin: 0;
`;

const NarrativeField = styled(CharacterCountTextField).attrs({
  className: "fs-exclude",
})`
  margin-top: ${rem(spacing.md)};
  ${hideWhenPrintingStyle}
`;

// A textarea prints only its visible rows, so paper gets the full text instead.
const PrintedNarrative = styled.div.attrs({ className: "fs-exclude" })`
  display: none;
  margin-top: ${rem(spacing.md)};

  @media print {
    display: block;
  }
`;

const PrintedNarrativeText = styled.p`
  ${typography.Sans14}
  margin: ${rem(spacing.xs)} 0 0;
  white-space: pre-wrap;
  color: ${palette.pine1};
`;

const Signatures = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${rem(spacing.lg)};
`;

const SignatureRole = FieldLabel;

const BLANK = "—";

const NARRATIVE_LABEL =
  "Progress of Supervision / Restitution Status / Recommendations";

type SignatureProps = {
  signer: string;
  name?: string;
  title?: string;
  autoFilled?: boolean;
};

function Signature({ signer, name, title, autoFilled }: SignatureProps) {
  return (
    <div>
      <SectionHeader>
        <SignatureRole>{signer}</SignatureRole>
        {autoFilled && (
          <ScreenOnly>
            <WorkflowsBadgePill text="Auto-filled" palette="GREEN" />
          </ScreenOnly>
        )}
      </SectionHeader>
      <FieldRow>
        <FieldLabel>Name</FieldLabel>
        <FieldValue>{name || BLANK}</FieldValue>
      </FieldRow>
      <FieldRow>
        <FieldLabel>Title</FieldLabel>
        <FieldValue>{title || BLANK}</FieldValue>
      </FieldRow>
    </div>
  );
}

type FormJurisdictionBlockProps = {
  jurisdiction: string;
  charges: UsIaEarlyDischargeCharge[];
};

export const FormJurisdictionBlock = observer(function FormJurisdictionBlock({
  jurisdiction,
  charges,
}: FormJurisdictionBlockProps) {
  const form = useOpportunityFormContext() as UsIaEarlyDischargeForm;
  const { userStore, workflowsStore } = useRootStore();
  const [narrative, , setNarrative] = useReactiveInput<HTMLTextAreaElement>(
    narrativeKey(jurisdiction),
    form,
  );

  const officer = form.getCurrentUserFromFormRecord();
  const officerName = resolveCurrentUserName(
    userStore,
    workflowsStore.user?.info,
    officer,
  );

  const headerLabel =
    charges.length === 1
      ? chargeMetaLine(charges[0])
      : `${jurisdiction} · ${pluralize(charges.length, "charge")}`;

  const slug = jurisdictionSlug(jurisdiction);

  return (
    <Block
      id={`jurisdiction-${slug}`}
      aria-labelledby={`jurisdiction-${slug}-label`}
    >
      <BlockHeader>
        <StatusDot />
        <BlockTitle id={`jurisdiction-${slug}-label`}>{headerLabel}</BlockTitle>
      </BlockHeader>
      <BlockBody>
        <ChargeTableScroller
          role="group"
          aria-label={`${jurisdiction} charges`}
          tabIndex={0}
        >
          <ChargeTable>
            <thead>
              <tr>
                <th scope="col">Jurisdiction</th>
                <th scope="col">Cause number</th>
                <th scope="col">Charge</th>
                <th scope="col">Count</th>
                <th scope="col">Class</th>
                <th scope="col">TDD</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge) => (
                <tr key={charge.chargeExternalId}>
                  <td>{charge.jurisdiction}</td>
                  <td>{charge.causeNumber}</td>
                  <td>{charge.description}</td>
                  <td>{charge.counts}</td>
                  <td>{charge.classificationTypeRawText}</td>
                  <td>{formatWorkflowsDateString(charge.tdd, BLANK)}</td>
                </tr>
              ))}
            </tbody>
          </ChargeTable>
        </ChargeTableScroller>
        <NarrativeField
          id={`narrative-${slug}`}
          label={NARRATIVE_LABEL}
          value={String(narrative ?? "")}
          onChange={setNarrative}
          minLength={DEFAULT_MIN_CHAR_LENGTH}
          maxLength={DEFAULT_MAX_CHAR_LENGTH}
          showRequired
          showCountBottomRight
        />
        <PrintedNarrative>
          <FieldLabel>{NARRATIVE_LABEL}</FieldLabel>
          <PrintedNarrativeText>
            {String(narrative ?? "") || BLANK}
          </PrintedNarrativeText>
        </PrintedNarrative>
        <SectionHeader>
          <SectionLabel>Signatures</SectionLabel>
        </SectionHeader>
        <Signatures>
          <Signature
            signer="Officer"
            name={officerName}
            title={officer?.staffTitle ?? undefined}
            autoFilled
          />
          {/* TODO(IA-449): fill in the supervisor's name and title. */}
          <Signature signer="Supervisor" />
        </Signatures>
      </BlockBody>
    </Block>
  );
});
