// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import * as React from "react";

import DOCXFormInput from "../../DOCXFormInput";
import {
  FormManualEntry,
  FormPage,
  FormParagraph,
  FormSkeleton,
  SectionDefendantDate,
  SectionHeading,
  SectionOfficerDate,
} from "./FormEarlyTermination";
import FormHeading from "./FormHeading";
import FormTextarea from "./FormTextarea";

export const FormEarlyTerminationDeferred: React.FC = () => {
  return (
    <FormSkeleton>
      <FormPage>
        <FormHeading
          title="Petition to withdraw plea of guilty"
          saNumberTitle="SA File No."
          sfnNumber={9278}
        />
        <br />
        <section>
          [1] Comes now the above named Defendant and respectfully petitions the
          Court for permission to withdraw the plea of guilty theretofore
          entered and enter a plea of not guilty in lieu thereof; and further
          petitions that the charges heretofore made be dismissed.
        </section>
        <br />
        <section>
          [2] The petitioner appeared on the{" "}
          <DOCXFormInput name="priorCourtDay" placeholder="Court day" /> day of{" "}
          <DOCXFormInput name="priorCourtMonth" placeholder="Court month" /> ,{" "}
          <DOCXFormInput name="priorCourtYear" placeholder="Court year" />,
          before the Honorable{" "}
          <DOCXFormInput name="judgeName" placeholder="Judge name" /> having
          been charged with the crime of{" "}
          <DOCXFormInput name="crimeNames" placeholder="Crime names" /> and was
          placed on a deferred imposition of sentence for a period of{" "}
          <DOCXFormInput name="sentenceLengthMonths" placeholder="months" />.
        </section>
        <br />
        <section>
          [3] The petitioner has complied with the terms and conditions set
          forth in the deferred order.
        </section>
        <br />
        <section>
          [4] That the time period of the Order would expire on{" "}
          <DOCXFormInput name="probationExpirationDate" /> and this Petition is
          submitted thereto.
        </section>
        <br />
        <section>
          Dated this <FormManualEntry size={5} /> day of{" "}
          <FormManualEntry size={16} />, 20 <FormManualEntry size={2} />.
        </section>
        <br />
        <SectionDefendantDate>
          <section>
            <FormManualEntry size={40} />
            <br />
            Petitioner and Defendant
          </section>
        </SectionDefendantDate>
        <section>
          Subscribed and sworn to before me, a notary public, this{" "}
          <FormManualEntry size={5} /> day of <FormManualEntry size={16} />, 20{" "}
          <FormManualEntry size={2} />.
        </section>
        <br />
        <br />
        <SectionDefendantDate>
          <section>
            <FormManualEntry size={40} />
            <br />
            Notary Public
          </section>
        </SectionDefendantDate>
        <br />
        <section>
          I,{" "}
          <DOCXFormInput
            name="probationOfficerFullName"
            placeholder="Probation officer name"
          />
          , ND Parole/Probation Officer, do hereby request granting the above
          Petition.
        </section>
        <br />
        <FormParagraph>I concur,</FormParagraph>
        <SectionOfficerDate>
          <section>
            <FormManualEntry size={40} />
            <br />
            Asst&emsp;&emsp;County States Attorney
          </section>
          <section>
            <FormManualEntry size={40} />
            <br />
            ND Parole/Probation Officer
          </section>
        </SectionOfficerDate>
        <FormTextarea
          name="statesAttorneyMailingAddress"
          placeholder="SA mailing address"
          minRows={3}
          style={{ boxSizing: "content-box", width: "210px" }}
        />
        <br />
        <DOCXFormInput
          name="statesAttorneyPhoneNumber"
          placeholder="SA phone number"
          style={{ minWidth: "210px" }}
        />
        <br />
        <DOCXFormInput
          name="statesAttorneyEmailAddress"
          placeholder="SA e-mail service address"
          style={{ minWidth: "210px" }}
        />{" "}
      </FormPage>
      <FormPage>
        <FormHeading
          title="Order to withdraw plea of guilty"
          saNumberTitle="SA File No."
          sfnNumber={9278}
        />
        <br />
        <SectionHeading>ORDER OF THE COURT</SectionHeading>
        <FormParagraph>
          [1] Upon reading and filing the Petition of{" "}
          <DOCXFormInput name="clientName" placeholder="Client name" /> for an
          order granting{" "}
          <DOCXFormInput name="pronoun" placeholder="him / her" /> permission to
          withdraw{" "}
          <DOCXFormInput name="pronounPossessive" placeholder="his / her" />{" "}
          plea of guilty for the crime of{" "}
          <DOCXFormInput name="crimeNames" placeholder="Crime names" /> and to
          enter a plea of not guilty in being thereof, and for an order to
          dismiss the information filed against{" "}
          <DOCXFormInput name="pronoun" placeholder="him / her" /> upon
          recommendation of{" "}
          <DOCXFormInput
            name="probationOfficerFullName"
            placeholder="Probation officer name"
          />
          , ND Parole/Probation Officer for the State of North Dakota; and good
          cause appearing therefore.
        </FormParagraph>
        <FormParagraph>
          [2] IT IS ORDERED that the Petition is granted; that the plea of
          guilty is withdrawn; and a plea of not guilty is entered; and that the
          charges heretofore made are dismissed.
        </FormParagraph>
        <SectionDefendantDate>
          <section>
            BY THE COURT:
            <br />
            <br />
            <br />
            <FormManualEntry size={40} />
            <br />
            Judge
          </section>
        </SectionDefendantDate>
      </FormPage>
    </FormSkeleton>
  );
};

export default FormEarlyTerminationDeferred;
