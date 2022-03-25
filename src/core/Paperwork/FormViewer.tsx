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

import { Button, palette, Pill, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, transparentize } from "polished";
import * as React from "react";
import { useEffect } from "react";
import {
  ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper,
} from "react-zoom-pan-pinch";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import type { Client } from "../../PracticesStore/Client";
import { generate } from "./FormGenerator";
import { PrintablePage } from "./US_TN/styles";

const FormViewerControls = styled.div`
  padding: ${rem(32)};
  display: flex;
  justify-content: space-between;
`;

const FormViewerGrid = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
`;

interface FormViewerProps {
  fileName: string;
}

const ControlButton = styled(Button).attrs({
  kind: "primary",
  shape: "block",
})`
  color: white;
  margin-right: ${rem(spacing.sm)};
`;

interface ControlsProps {
  transformWrapperRef: React.MutableRefObject<ReactZoomPanPinchRef>;
}

export const Controls: React.FC<ControlsProps> = ({ transformWrapperRef }) => (
  <div style={{ display: "flex" }}>
    <ControlButton onClick={() => transformWrapperRef.current?.zoomIn()}>
      Zoom In +
    </ControlButton>
    <ControlButton onClick={() => transformWrapperRef.current?.zoomOut()}>
      Zoom Out -
    </ControlButton>
    <ControlButton
      onClick={() => transformWrapperRef.current?.resetTransform()}
    >
      Reset Zoom
    </ControlButton>
  </div>
);

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

const FormViewer: React.FC<FormViewerProps> = ({ fileName, children }) => {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;
  const transformWrapperRef = React.useRef() as React.MutableRefObject<ReactZoomPanPinchRef>;

  const client = useRootStore().practicesStore.selectedClient;
  const isPrinting = client?.formIsPrinting ?? false;

  // Generate the form and save it once the print styles have been rendered
  useEffect(() => {
    if (isPrinting && formRef.current && transformWrapperRef.current) {
      transformWrapperRef.current.resetTransform(0);

      generate(formRef.current, `${PrintablePage}`).then((pdf) => {
        pdf.save(fileName);
        // if isPrinting is defined then client is too
        (client as Client).setFormIsPrinting(false);
      });
    }
  }, [formRef, transformWrapperRef, isPrinting, fileName, client]);

  return (
    <TransformWrapper
      ref={transformWrapperRef}
      centerOnInit
      panning={{ excluded: ["input"] }}
      doubleClick={{ excluded: ["input"] }}
      zoomAnimation={{ animationTime: 50 }}
      wheel={{ disabled: true }}
    >
      <FormViewerGrid>
        <FormViewerControls>
          <Controls transformWrapperRef={transformWrapperRef} />
          <Status color={palette.slate85}>Last edited placeholder</Status>
        </FormViewerControls>

        <TransformComponent wrapperStyle={{ cursor: "grab", width: "100%" }}>
          <FormViewerContext.Provider value={{ isPrinting }}>
            <div ref={formRef}>{children}</div>
          </FormViewerContext.Provider>
        </TransformComponent>
      </FormViewerGrid>
    </TransformWrapper>
  );
};

export default observer(FormViewer);
