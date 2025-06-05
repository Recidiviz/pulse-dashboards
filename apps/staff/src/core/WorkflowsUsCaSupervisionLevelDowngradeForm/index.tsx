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

import { observer } from "mobx-react-lite";
import { PDFDocument, PDFForm } from "pdf-lib";
import * as React from "react";

import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { UsCaSupervisionLevelDowngradeDraftData } from "../../WorkflowsStore/Opportunity/UsCa";
import { FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import {
  fillAndSavePDF,
  fixRadioGroups,
  PDFFillerFunc,
  SetFunc,
} from "../Paperwork/PDFFormFiller";
import FormCDCR1657 from "../Paperwork/US_CA/SupervisionLevelDowngrade/FormCDCR1657";

const fillerFunc: PDFFillerFunc = async (
  formData: UsCaSupervisionLevelDowngradeDraftData,
  set: SetFunc,
  form?: PDFForm,
  doc?: PDFDocument,
): Promise<void> => {
  if (!form || !doc) return Promise.resolve();
  const totalObjectiveScore =
    formData.objectiveScore1 &&
    formData.objectiveScore2 &&
    formData.objectiveScore3 &&
    formData.objectiveScore4 &&
    formData.objectiveScore5 &&
    formData.objectiveScore1 +
      formData.objectiveScore2 +
      formData.objectiveScore3 +
      formData.objectiveScore4 +
      formData.objectiveScore5;
  let objectiveScoreRange;
  if (totalObjectiveScore === undefined) {
    objectiveScoreRange = undefined;
  } else if (totalObjectiveScore <= 6) {
    objectiveScoreRange = "5-6";
  } else if (totalObjectiveScore <= 10) {
    objectiveScoreRange = "7-10";
  } else {
    objectiveScoreRange = "11-15";
  }

  set("CDC NUMBER", formData.cdcNumber);
  set("PRINT NAME LAST FIRST MI", formData.fullName);
  set("LAST RELEASE DATE", formData.lastReleaseDate);
  set("REGIONPAROLE UNIT", formData.unit);
  set("COMMITMENT OFFENSE", formData.offense);
  set("CSRA SCORE", formData.csraScore);
  set("SUPERVISION LEVEL", formData.supervisionLevel);
  set(
    "ABBREVIATED CASE CONFERENCE REVIEW",
    formData.reviewType === "ABBREVIATED",
  );
  set("CASE CONFERENCE REVIEW", formData.reviewType === "STANDARD");
  set("DISCHARGE CONSIDERATION COMMITTEE", formData.reviewType === "DISCHARGE");
  set(
    "OBJECTIVES RATING SCORES ONE SCORE PER OBJECTIVE",
    formData.seeDischargeReport,
  );
  set("SEE DISCHARGE REVIEW REPORT DATED", formData.dischargeReportDate);
  set("OBJ 1", formData.objectiveScore1);
  set("OBJ 2", formData.objectiveScore2);
  set("OBJ 3", formData.objectiveScore3);
  set("OBJ 4", formData.objectiveScore4);
  set("OBJ 5", formData.objectiveScore5);
  set("TOTAL OBJECTIVES SCORE", totalObjectiveScore);
  set("TOTAL", objectiveScoreRange);
  set("CDCR FORM 1650D ATTACHED", formData.form1650Attached);
  set("ADDITIONAL REPORT ATTACHED", formData.additionalReportAttached);
  set("REMAIN IN CURRENT CATEGORY", !formData.moveToNewCategory);
  set("undefined_17", formData.moveToNewCategory);
  set("MOVE TO CATEGORY", formData.newCategory);
  set("DATE PAROLEE NOTIFIED", formData.dateNotified);
  set("INPERSON", formData.notifiedInPerson);
  set("MAIL", formData.notifiedByMail);
  set("BY TELEPHONE", formData.notifiedByPhone);
  set("EMAIL", formData.notifiedByEmail);
  set("LETTER LEFT AT RESIDENCE", formData.notifiedByLetter);
  set("YES", formData.paroleePresent === "YES");
  set("NO If no cite reason below", formData.paroleePresent === "NO");
  set("Not required to attend", formData.paroleePresent === "NOT_REQUIRED");
  if (formData.paroleePresent === "NO") {
    set(
      "Parolee participated telephonically",
      formData.paroleeNotPresent === "TELEPHONED",
    );
    set("Parolee failed to appear", formData.paroleeNotPresent === "FAILED");
    set(
      "Parolee declined to participate",
      formData.paroleeNotPresent === "DECLINED",
    );
    set(
      "Parolee did not respond to participation request",
      formData.paroleeNotPresent === "NOT_RESPOND",
    );
  }
  set(
    "Reasonable accommodation provided Describe",
    formData.reasonableAccommodationProvided,
  );
  set("Copy of CDCR 1502DR provided to parolee", formData.cdcr1502DRProvided);
  set("Name", formData.otherParticipant1Name);
  set("Relation To Parolee", formData.otherParticipant1Relation);
  set("Comments", formData.otherParticipant1Comments);
  set("Name_2", formData.otherParticipant2Name);
  set("Relation To Parolee_2", formData.otherParticipant2Relation);
  set("Comments_2", formData.otherParticipant2Comments);
  set("BADGE NUMBER", formData.agentSignatureBadge);
  set("DATE", formData.agentSignatureDate);
  set("SUPERVISORS COMMENTS AND INSTRUCTIONS", formData.supervisorComments);
  set("MOVE TO CATEGORY_2", formData.supervisorNewCategory);
  set("EFFECTIVE DATE", formData.supervisorEffectiveDate);
  set("REMAIN IN CURRENT CATEGORY_2", formData.supervisorDecision === "REMAIN");
  set("undefined_18", formData.supervisorDecision === "MOVE");
  set("SCHEDULE FOR CCR", formData.supervisorDecision === "SCHEDULE");
  set("DISCHARGE", formData.dischargeCommitteeAction === "DISCHARGE");
  set("RETAIN ON PAROLE", formData.dischargeCommitteeAction === "RETAIN");
  set("DEFER", formData.dischargeCommitteeAction === "DEFER");
  set("PRESIDING AUTHORITY NAMES", formData.presidingAuthorityName);
  set("COMMENTS", formData.dischargeCommitteeComments);
  set("BADGE NUMBER_2", formData.supervisorSignatureBadge);
  set("DATE_2", formData.supervisorSignatureDate);

  // Field does not exist in the raw form
  doc.getPage(0).drawText(formData.accommodationDescription ?? "", {
    x: 215,
    y: 295,
    size: 8,
  });

  form.removeField(form.getField("RESET"));

  await fixRadioGroups(form);

  form.flatten();
};

const FormUsCaSupervisionLeveDowngrade = observer(
  function FormUsCaSupervisionLeveDowngrade({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const { getTokenSilently } = useRootStore();

    const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

    const onClickDownload = async () => {
      const formData = opportunity?.form?.formData;
      if (!formData) return;

      await fillAndSavePDF(
        `${opportunity.person.displayName} - CDCR 1657.pdf`,
        "US_CA",
        "CDCR1657.pdf",
        fillerFunc,
        formData,
        getTokenSilently,
      );
    };

    if (!opportunity) {
      return null;
    }
    return (
      <FormContainer
        agencyName="CDCR"
        heading="Supervision Level Downgrade"
        onClickDownload={onClickDownload}
        downloadButtonLabel="Download PDF"
        opportunity={opportunity}
      >
        <FormViewer formRef={formRef}>
          <FormCDCR1657 />
        </FormViewer>
      </FormContainer>
    );
  },
);

export default FormUsCaSupervisionLeveDowngrade;
