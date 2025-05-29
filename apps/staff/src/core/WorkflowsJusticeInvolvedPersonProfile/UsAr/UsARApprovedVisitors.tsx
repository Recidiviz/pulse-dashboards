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

import { palette, spacing } from "@recidiviz/design-system";
import * as Sentry from "@sentry/react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import toast from "react-hot-toast";
import styled from "styled-components/macro";

import { useRootStore } from "../../../components/StoreProvider";
import { formatWorkflowsDate } from "../../../utils";
import { Opportunity } from "../../../WorkflowsStore";
import { UsArInstitutionalWorkerStatusOpportunity } from "../../../WorkflowsStore/Opportunity/UsAr/UsArInstitutionalWorkerStatusOpportunity/UsArInstitutionalWorkerStatusOpportunity";
import { UsArApprovedVisitorWithChecklist } from "../../../WorkflowsStore/Opportunity/UsAr/UsArInstitutionalWorkerStatusOpportunity/UsArInstitutionalWorkerStatusReferralRecord";
import { DownloadButton } from "../../Paperwork/FormContainer";
import {
  fillPDF,
  getPdfTemplate,
  PDFFillerFunc,
} from "../../Paperwork/PDFFormFiller";
import { createDownloadLabel, downloadZipFile } from "../../Paperwork/utils";
import { DetailsHeading, Divider } from "../styles";

const Heading = styled(DetailsHeading)`
  margin-bottom: 0;
  margin-top: 0;
  padding-bottom: ${rem(spacing.sm)};
  padding-top: ${rem(spacing.sm)};
`;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const DownloadFormsButton = styled(DownloadButton)`
  background-color: ${palette.signal.links};
`;

const fillerFunc: (
  formData: UsArApprovedVisitorWithChecklist,
) => PDFFillerFunc = (formData) => async (set, form, doc) => {
  set("firstName", formData.firstName ?? "");
  set("lastName", formData.lastName ?? "");
  set("middleName", formData.middleName ?? "");
  set("suffix", formData.suffix ?? "");
  set("partyId", formData.partyId ?? "");
  set("seqNum", formData.seqNum ?? "");
  set("dateOfBirth", formData.dateOfBirth ?? "");
  set("dobIsApproximate", formData.dateOfBirthIsApproximate ?? "");
  // TODO #8523 Re-enable address lines once data is ready
  // set("physicalAddressLine1", formData.physicalAddress?.addressLine1 ?? "");
  // set("physicalAddressLine2", formData.physicalAddress?.addressLine2 ?? "");
  // set("mailingAddressLine2", formData.mailingAddress?.addressLine2 ?? "");
  // set("mailingAddressLine2", formData.mailingAddress?.addressLine2 ?? "");
  set("relationshipType", formData.relationshipType ?? "");
  set("race", formData.race ?? "");
  set("sex", formData.sex ?? "");
  set("shareMedicalInformation", formData.checklist.canShareMedInfo ?? "");
  set("shareMentalHealthInformation", formData.checklist?.canShareMhInfo ?? "");
  set("shareDentalInformation", formData.checklist?.canShareDentalInfo ?? "");
  set("notifyInEmergency", formData.checklist.emergencyNotify ?? "");
  set(
    "notifyInEmergencyAlternate",
    formData.checklist.emergencyNotifyAlt ?? "",
  );
  set("canMakeMedicalDecisions", formData.checklist.canMakeMedDecisions ?? "");
  set("livesWithOffender", formData.checklist.livesWithResident ?? "");
  set("vistimOfOffender", formData.checklist.victimOfResident ?? "");
  set("accompliceOfOffender", formData.checklist.accompliceOfResident ?? "");
  set("criminalHistory", formData.checklist.hasCriminalHistory ?? "");
  set("lawEnforcement", formData.checklist.worksInLe ?? "");
  set("dependentCareGuardian", formData.checklist.isDepCareGuardian ?? "");
  set(
    "authorizedToClaimProperty",
    formData.checklist.authorizedToClaimProperty ?? "",
  );
  set("downloadedOnDate", `Downloaded on ${formatWorkflowsDate(new Date())}`);
  set("relationshipStatus", formData.relationshipStatus ?? "");
  set("relationshipStatusDate", formData.relationshipStatusDate ?? "");
  set("relationshipComments", formData.relationshipComments ?? "");
  set("visitationReviewDate", formData.visitationReviewDate ?? "");
  set("visitationDurDays", formData.visitationDurDays ?? "");
  set(
    "visitationSpecialCondition1",
    formData.visitationSpecialCondition1 ?? "",
  );
  set(
    "visitationSpecialCondition2",
    formData.visitationSpecialCondition2 ?? "",
  );
  set("visitationStatusReason", formData.visitationStatusReason ?? "");
};

export const UsArApprovedVisitors = observer(function UsArApprovedVisitors({
  opportunity,
}: {
  opportunity: Opportunity;
}): React.ReactElement | null {
  const { getTokenSilently } = useRootStore();
  if (!(opportunity instanceof UsArInstitutionalWorkerStatusOpportunity))
    return null;

  const resident = opportunity.person;

  const formDownloader = async (): Promise<void> => {
    const fileNameFormatter = (fullName?: string): string =>
      `${(fullName ?? "").replace(/\//g, "-")} - Approved Relative Associate Form`;

    const pdfTemplateName = "institutional_worker_status_form";

    const pdfTemplate = await getPdfTemplate(
      resident.stateCode,
      `${pdfTemplateName}.pdf`,
      getTokenSilently,
    );

    downloadZipFile(
      `Approved Relative Associate Forms - ${resident.displayName}.zip`,
      await Promise.all(
        opportunity.directDownloadForm.formData.visitors.map(
          async (visitor: UsArApprovedVisitorWithChecklist) => {
            const visitorFullName = `${visitor.firstName} ${visitor.lastName}`;
            return {
              filename: `${fileNameFormatter(visitorFullName)}.pdf`,
              fileContents: await fillPDF(
                fillerFunc({ ...toJS(visitor) }),
                pdfTemplate,
              ),
            };
          },
        ),
      ),
    );
  };

  const handleFormDownloadClick = async () => {
    opportunity.directDownloadForm.markDownloading();

    try {
      await formDownloader();
      opportunity.directDownloadForm.recordDirectDownloadFormDownloaded();
      toast("Successfully downloaded visitor forms.", {
        position: "bottom-left",
      });
    } catch (e) {
      Sentry.captureException(e);
      toast.error("Error downloading visitor forms.", {
        position: "bottom-left",
      });
    } finally {
      opportunity.directDownloadForm.formIsDownloading = false;
    }
  };

  return (
    <>
      <Divider />
      <Container>
        <Heading>Approved Visitors {`(${opportunity.numVisitors()})`}</Heading>
        {opportunity.directDownloadForm && opportunity.numVisitors() > 0 && (
          <DownloadFormsButton
            className="WorkflowsFormDownloadButton"
            disabled={opportunity.directDownloadForm.formIsDownloading}
            onClick={handleFormDownloadClick}
          >
            {createDownloadLabel(
              opportunity.directDownloadForm.formIsDownloading,
              false,
              "Download visitor forms",
            )}
          </DownloadFormsButton>
        )}
      </Container>
    </>
  );
});
