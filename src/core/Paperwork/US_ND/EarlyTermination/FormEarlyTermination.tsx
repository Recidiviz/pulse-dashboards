// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { DIMENSIONS_PX } from "../../PDFFormGenerator";
import { useResizeForm } from "../../utils";
import AdditionalDepositionLines from "./AdditionalDepositionLines";
import FormHeading from "./FormHeading";
import FormInput from "./FormInput";
import FormPrompts from "./FormPrompts";
import FormTextarea from "./FormTextarea";

const FORM_FONT_FAMILY = `"Times New Roman", serif`;
const FORM_LINE_HEIGHT = 1.3;

const FormPage = styled.div`
  font-family: ${FORM_FONT_FAMILY};
  line-height: ${FORM_LINE_HEIGHT};
  letter-spacing: 0;
  font-size: ${rem(11)};
  color: black;
  background-color: white;
  box-sizing: content-box;

  min-height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  padding: ${rem(18)};

  ol li {
    margin-bottom: ${rem(spacing.xs)};
  }
`;

// Needed for specificity
const FormParagraph = styled.p`
  p& {
    font-family: ${FORM_FONT_FAMILY};
    line-height: ${FORM_LINE_HEIGHT};
  }
`;

const SectionHeading = styled.strong`
  display: block;
  text-align: center;
  font-size: ${rem(11)};
  margin: 1em 0;
`;

const SectionDefendantDate = styled.section`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;

  > :first-child {
    margin-right: 12px;
  }
`;

const SectionOfficerDate = styled.section`
  display: flex;
  justify-content: flex-start;

  > :first-child {
    margin-right: 12px;
  }
`;

interface FormManualEntryProps {
  size: number;
}
const FormManualEntry: React.FC<FormManualEntryProps> = ({
  size,
}: FormManualEntryProps) => {
  return <>{"_".repeat(size)}</>;
};

const FormTransformContainer = styled.section`
  transform-origin: 0 0;
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
`;

export const FormEarlyTermination: React.FC = () => {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  const {
    layout: { margin },
    resize,
  } = useResizeForm(formRef, `${FormTransformContainer}`);

  return (
    <div
      ref={formRef}
      onClickCapture={() => resize()}
      onKeyDownCapture={() => resize()}
      onChangeCapture={() => resize()}
    >
      <FormPrompts style={{ marginLeft: margin, marginRight: margin }} />

      <FormTransformContainer>
        <FormPage>
          <FormHeading />
          <br />
          <section>
            [1]{" "}
            <strong>
              The Defendant, being first duly sworn, deposes and states:
            </strong>
          </section>
          <br />
          <ol type="a">
            <li>
              That the Defendant appeared before Judge{" "}
              <FormInput name="judgeName" placeholder="Judge name" /> on{" "}
              <FormInput name="priorCourtDate" placeholder="Court date" />, and
              was sentenced to{" "}
              <FormInput
                name="sentenceLengthYears"
                placeholder="Sentence length"
              />{" "}
              supervised probation for the crime(s) of: <br />
              <FormTextarea name="crimeNames" style={{ width: "100%" }} />
            </li>
            <li>
              That the Defendant owes{" "}
              <FormInput name="finesAndFees" placeholder="Dollar amount" /> in
              fines, costs, and fees to the District Court.
            </li>
            <li>
              That the Defendant has satisfactorily met all other conditions of
              the Defendant’s probation.
            </li>
            <li>
              That the Defendant&apos;s probation will expire{" "}
              <FormInput name="probationExpirationDate" />.
            </li>

            <AdditionalDepositionLines />
          </ol>
          <section>
            [2] Therefore, the Defendant requests the Court to terminate the
            probation pursuant to N.D.C.C. § 12.1-32-06.1(7).
          </section>
          <br />
          <SectionDefendantDate>
            <section>
              <FormManualEntry size={30} />
              <br />
              Defendant
            </section>
            <section>
              <FormManualEntry size={18} />
              <br />
              Date
            </section>
          </SectionDefendantDate>
          <section>
            Subscribed and sworn to before me, a notary public, this{" "}
            <FormManualEntry size={5} /> day of <FormManualEntry size={16} />,
            20 <FormManualEntry size={2} />.
          </section>
          <br />
          <br />
          <FormManualEntry size={38} />
          <br />
          Notary Public
          <SectionHeading>Approval of Termination of Probation</SectionHeading>
          <section>
            [3]{" "}
            <FormInput
              name="probationOfficerFullName"
              placeholder="Probation officer name"
            />{" "}
            states:
          </section>
          <br />
          <ol type="a">
            <li>
              That I am a Probation Officer employed with the North Dakota
              Department of Corrections and Rehabilitation.
            </li>
            <li>
              That, to the best of my information and belief, the Defendant has
              fines, costs, and fees owing to the District Court but has
              otherwise satisfactorily met all other conditions of the
              Defendant&apos;s probation.
            </li>
            <li>
              That I approve the termination of the Defendant&apos;s probation.
            </li>
            <li>
              That a copy of the Defendant’s motion has been sent to the
              prosecuting attorney.
            </li>
          </ol>
          <SectionOfficerDate>
            <section>
              <FormManualEntry size={30} />
              <br />
              Probation Officer
            </section>
            <section>
              <FormManualEntry size={26} />
              <br />
              Date
            </section>
          </SectionOfficerDate>
          <FormParagraph>I concur,</FormParagraph>
          <SectionOfficerDate>
            <section>
              <FormManualEntry size={39} />
              <br />
              States Attorney
            </section>
            <section>
              <FormManualEntry size={26} />
              <br />
              Date
            </section>
          </SectionOfficerDate>
          <FormTextarea
            name="statesAttorneyMailingAddress"
            placeholder="SA mailing address"
            minRows={3}
            style={{ boxSizing: "content-box", width: "210px" }}
          />
          <br />
          <FormInput
            name="statesAttorneyPhoneNumber"
            placeholder="SA phone number"
            style={{ minWidth: "210px" }}
          />
          <br />
          <FormInput
            name="statesAttorneyEmailAddress"
            placeholder="SA e-mail service address"
            style={{ minWidth: "210px" }}
          />
          <hr />
          <SectionHeading>ORDER</SectionHeading>
          <FormParagraph>
            [1] The Court, finding that the Defendant has satisfactorily met the
            conditions of the Defendant&apos;s probation and that termination of
            probation is warranted by the conduct of the Defendant and the ends
            of justice, <strong>ORDERS</strong> that the probation imposed upon
            the Defendant is terminated pursuant to N.D.C.C. 12.1-32-06.1(7).
          </FormParagraph>
          <FormParagraph>
            [2] The Court orders the remaining fines, fees, and costs shall be
            docketed to a civil judgment pursuant to N.D.C.C. § 29-26-22.1.
          </FormParagraph>
          <section>
            <FormManualEntry size={38} />
            <br />
            District Court Judge
          </section>
        </FormPage>
      </FormTransformContainer>
    </div>
  );
};

export default FormEarlyTermination;
