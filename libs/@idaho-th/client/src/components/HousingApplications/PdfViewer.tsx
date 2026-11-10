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

import type { PDFDocumentProxy } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { Icon } from "~design-system";

import * as Styled from "./PdfViewer.styles";
import { PdfViewerLoader } from "./PdfViewerLoader";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const documentOptions = { wasmUrl: "/wasm/" };

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

type PdfViewerProps = {
  signedUrl: string | null;
  pageNumber?: number;
  scale?: number;
  onLoadSuccess?: (pdf: PDFDocumentProxy) => void;
};

export const PdfViewer: React.FC<PdfViewerProps> = ({
  signedUrl,
  pageNumber = 1,
  scale: initialScale = MIN_SCALE,
  onLoadSuccess,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const [pageWidth, setPageWidth] = useState<number | undefined>();
  const [scale, setScale] = useState(initialScale);
  const [isPanning, setIsPanning] = useState(false);

  const canPan = scale > MIN_SCALE;

  useEffect(() => {
    setScale(initialScale);
  }, [signedUrl, initialScale]);

  const zoomIn = () => {
    setScale((current) =>
      Math.min(MAX_SCALE, Math.round((current + SCALE_STEP) * 100) / 100),
    );
  };

  const zoomOut = () => {
    setScale((current) =>
      Math.max(MIN_SCALE, Math.round((current - SCALE_STEP) * 100) / 100),
    );
  };

  const handlePanStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canPan) {
      return;
    }
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: scrollContainerRef.current?.scrollLeft ?? 0,
      scrollTop: scrollContainerRef.current?.scrollTop ?? 0,
    };
    setIsPanning(true);
  };

  useEffect(() => {
    if (!isPanning) {
      return undefined;
    }

    const handlePanMove = (event: MouseEvent) => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) {
        return;
      }
      scrollContainer.scrollLeft =
        panStartRef.current.scrollLeft -
        (event.clientX - panStartRef.current.x);
      scrollContainer.scrollTop =
        panStartRef.current.scrollTop - (event.clientY - panStartRef.current.y);
    };

    const handlePanEnd = () => setIsPanning(false);

    window.addEventListener("mousemove", handlePanMove);
    window.addEventListener("mouseup", handlePanEnd);

    return () => {
      window.removeEventListener("mousemove", handlePanMove);
      window.removeEventListener("mouseup", handlePanEnd);
    };
  }, [isPanning]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const updatePageWidth = () => {
      const nextWidth = Math.floor(container.clientWidth);
      setPageWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      );
    };

    updatePageWidth();

    const observer = new ResizeObserver(updatePageWidth);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!signedUrl) {
    return <PdfViewerLoader />;
  }

  return (
    <Styled.PdfViewerRoot ref={containerRef}>
      <Styled.PdfScrollContainer
        ref={scrollContainerRef}
        $canPan={canPan}
        $isPanning={isPanning}
        onMouseDown={handlePanStart}
      >
        <Document
          file={signedUrl}
          options={documentOptions}
          suspense={false}
          loading={<PdfViewerLoader />}
          onLoadSuccess={onLoadSuccess}
        >
          {pageWidth !== undefined ? (
            <Page
              key={pageNumber}
              pageNumber={pageNumber}
              width={pageWidth}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={<PdfViewerLoader />}
            />
          ) : (
            <PdfViewerLoader />
          )}
        </Document>
      </Styled.PdfScrollContainer>
      <Styled.ZoomControls>
        <Styled.ZoomButton
          type="button"
          aria-label="Zoom out"
          disabled={scale <= MIN_SCALE}
          onClick={zoomOut}
        >
          <Icon kind="Minus" size={14} />
        </Styled.ZoomButton>
        <Styled.ZoomButton
          type="button"
          aria-label="Zoom in"
          disabled={scale >= MAX_SCALE}
          onClick={zoomIn}
        >
          <Icon kind="AddFilled" size={14} />
        </Styled.ZoomButton>
      </Styled.ZoomControls>
    </Styled.PdfViewerRoot>
  );
};
