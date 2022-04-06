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

import { palette, Pill } from "@recidiviz/design-system";
import { throttle } from "lodash";
import { observer } from "mobx-react-lite";
import moment from "moment";
import { rem, transparentize } from "polished";
import * as React from "react";
import { useEffect } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import type { Client } from "../../PracticesStore/Client";
import { generate } from "./FormGenerator";
import { PrintablePage, PrintablePageMargin } from "./US_TN/styles";

const FormViewerControls = styled.div`
  padding: ${rem(32)};
  display: flex;
  justify-content: space-between;
`;

const FormViewerGrid = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
`;

interface FormViewerProps {
  fileName: string;
}

const Status = styled(Pill)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 16px;

  background-color: ${transparentize(0.9, palette.signal.highlight)};
  color: white;
`;

export interface FormViewerContextData {
  isPrinting: boolean;
}

export const FormViewerContext = React.createContext<FormViewerContextData>({
  isPrinting: false,
});

const useResizeForm = (formRef: React.MutableRefObject<HTMLDivElement>) => {
  useEffect(() => {
    const resize = throttle(() => {
      const container = formRef.current;
      const page = formRef.current?.querySelector(
        `${PrintablePageMargin}`
      ) as HTMLDivElement;

      if (!page || !container) return;

      const margin = 0.075 * container.offsetWidth;
      const scale = (container.offsetWidth - margin * 2) / page.offsetWidth;
      const scaledMargin = margin / scale;
      const scaledHeight = page.offsetHeight * scale;

      page.style.transform = `scale(${scale})
         translateX(${rem(scaledMargin)})
         translateY(${rem(scaledMargin / 2)})`;

      container.style.minHeight = rem(scaledHeight + scaledMargin * 2);
    }, 1000 / 60);

    resize();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [formRef]);
};

const FormViewer: React.FC<FormViewerProps> = ({ fileName, children }) => {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;
  useResizeForm(formRef);

  const client = useRootStore().practicesStore.selectedClient;
  const isPrinting = client?.formIsPrinting ?? false;

  // Generate the form and save it once the print styles have been rendered
  useEffect(() => {
    if (isPrinting && formRef.current) {
      generate(formRef.current, `${PrintablePage}`).then((pdf) => {
        pdf.save(fileName);
        // if isPrinting is defined then client is too
        (client as Client).setFormIsPrinting(false);
      });
    }
  }, [formRef, isPrinting, fileName, client]);

  // TODO(#1729) Remove compliant-reporting specific content
  const { practicesStore } = useRootStore();
  const draft = practicesStore.selectedClient?.compliantReportingReferralDraft;
  let lastEdited;
  if (draft) {
    lastEdited = `Last edited by ${draft.updated.by} ${moment(
      draft.updated.date.seconds * 1000
    ).fromNow()}`;
  } else {
    lastEdited = `Prefilled with data from TDOC on ${
      practicesStore.selectedClient?.getCompliantReportingReferralDataField(
        "dateToday"
      ) ?? moment().format("MM-DD-YYYY")
    }`;
  }

  return (
    <FormViewerGrid>
      <FormViewerControls>
        <Status color={palette.slate85}>{lastEdited}</Status>
      </FormViewerControls>

      <FormViewerContext.Provider value={{ isPrinting }}>
        <div ref={formRef}>{children}</div>
      </FormViewerContext.Provider>
    </FormViewerGrid>
  );
};

export default observer(FormViewer);
