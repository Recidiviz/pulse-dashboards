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

import { ParoleAttachment, ParolePlan } from "~datatypes";
import { Icon, IconSVG } from "~design-system";

import { SectionCard, SectionCardHeader } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import {
  AlertBanner,
  AlertBody,
  AlertHeading,
  DocumentInfo,
  DocumentLink,
  DocumentList,
  DocumentRow,
  EmptyState,
  FactLabel,
  formatDate,
  isParolePlanStale,
} from "./shared";

type AttachmentListItem = {
  key: string;
  name: string;
  detailLabel: string;
  url: string;
  uploadDate: string;
};

// Merges the parole plan's documents in with the standalone attachments into
// a single reverse-chronological list -- the design treats a parole plan
// upload as just another attachment row, distinguished only by its name.
function buildAttachmentList(
  parolePlan: ParolePlan,
  attachments: Array<ParoleAttachment>,
): Array<AttachmentListItem> {
  const parolePlanItems: Array<AttachmentListItem> = parolePlan.documents.map(
    (doc) => ({
      key: doc.url,
      name: "Parole Plan",
      detailLabel: `Uploaded: ${formatDate(doc.uploadDate)}`,
      url: doc.url,
      uploadDate: doc.uploadDate,
    }),
  );

  const attachmentItems: Array<AttachmentListItem> = attachments.map(
    (attachment) => ({
      key: attachment.url,
      name: attachment.name,
      detailLabel: `Uploaded: ${formatDate(attachment.uploadDate)}`,
      url: attachment.url,
      uploadDate: attachment.uploadDate,
    }),
  );

  return [...parolePlanItems, ...attachmentItems].sort(
    (a, b) =>
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime(),
  );
}

export function AttachmentsSection({
  parolePlan,
  attachments,
}: {
  parolePlan: ParolePlan;
  attachments: Array<ParoleAttachment>;
}) {
  const attachmentList = buildAttachmentList(parolePlan, attachments);

  return (
    <SectionCard>
      <SectionCardHeader>Attachments</SectionCardHeader>
      <PaddedSectionCardBody>
        {!parolePlan.onFile && (
          <AlertBanner>
            <Icon kind={IconSVG.Alert} width={20} />
            <div>
              <AlertHeading>NO PAROLE PLAN ON FILE</AlertHeading>
              <AlertBody>
                This individual does not have a parole plan submitted. A
                complete parole plan is required before parole consideration.
              </AlertBody>
            </div>
          </AlertBanner>
        )}

        {parolePlan.onFile &&
          parolePlan.lastUpdated &&
          isParolePlanStale(parolePlan.lastUpdated) && (
            <AlertBanner>
              <Icon kind={IconSVG.Alert} width={20} />
              <div>
                <AlertHeading>PAROLE PLAN NOT RECENTLY UPDATED</AlertHeading>
                <AlertBody>
                  The parole plan has not been updated in over 90 days. Last
                  update: {formatDate(parolePlan.lastUpdated)}
                </AlertBody>
              </div>
            </AlertBanner>
          )}

        {attachmentList.length === 0 ? (
          <EmptyState>No attachments found for this resident.</EmptyState>
        ) : (
          <DocumentList>
            {attachmentList.map((item) => (
              <DocumentRow key={item.key}>
                <DocumentInfo>
                  <div>{item.name}</div>
                  <FactLabel>{item.detailLabel}</FactLabel>
                </DocumentInfo>
                <DocumentLink href={item.url} download>
                  <Icon kind={IconSVG.Download} width={14} />
                  View
                </DocumentLink>
              </DocumentRow>
            ))}
          </DocumentList>
        )}
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
