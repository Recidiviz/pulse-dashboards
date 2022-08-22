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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import { useEffect } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import type { Client } from "../../WorkflowsStore";
import { generate } from "./FormGenerator";
import { PrintablePage } from "./styles";
import { useResizeForm } from "./utils";

const FormViewerHeader = styled.div`
  padding: ${rem(spacing.xl)} ${rem(spacing.lg)};
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: -${rem(spacing.sm)};
`;

const FormViewerGrid = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
`;

interface FormViewerProps {
  fileName: string;
  statuses: (React.ReactChild | null)[];
}

export interface FormViewerContextData {
  isPrinting: boolean;
}

export const FormViewerContext = React.createContext<FormViewerContextData>({
  isPrinting: false,
});

const FormViewer: React.FC<FormViewerProps> = ({
  fileName,
  statuses,
  children,
}) => {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;
  useResizeForm(formRef);

  const client = useRootStore().workflowsStore.selectedClient;
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

  return (
    <FormViewerGrid>
      <FormViewerHeader>{statuses}</FormViewerHeader>

      <FormViewerContext.Provider value={{ isPrinting }}>
        <div ref={formRef}>{children}</div>
      </FormViewerContext.Provider>
    </FormViewerGrid>
  );
};

export default observer(FormViewer);
