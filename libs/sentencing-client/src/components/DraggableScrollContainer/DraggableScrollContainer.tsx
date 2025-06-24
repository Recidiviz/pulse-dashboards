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

import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components/macro";

import ChevronIcon from "../assets/chevron-down.svg?react";
import * as Styled from "../CaseDetails/CaseDetails.styles";

const ScrollControlsContainer = styled.div`
  position: relative;
`;

const ScrollContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  cursor: grab;
  user-select: none;
  padding: 0 22px 0 22px;
  margin-right: 40px;
`;

const SCROLL_SPEED_OFFSET = 200;

const DraggableScrollContainer: React.FC<
  PropsWithChildren & { hideArrowButtons?: boolean }
> = ({ children, hideArrowButtons = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentScrollLeft, setCurrentScrollLeft] = useState(0);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (scrollRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - scrollRef.current.offsetLeft);
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      const xOffset = e.pageX;
      const scrollSpeedDelta = (xOffset - startX) * 0.5;
      setCurrentScrollLeft(scrollLeft - scrollSpeedDelta);
    },
    [isDragging, scrollLeft, startX],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const calculateNewOffset = (currentOffset: number, delta: number) => {
    if (!scrollRef.current) return currentOffset;

    const nextOffset = currentOffset + delta;
    const maxOffset =
      scrollRef.current.scrollWidth - scrollRef.current.offsetWidth;

    return delta < 0
      ? Math.max(nextOffset, 0) // Scrolling left
      : Math.min(nextOffset, maxOffset); // Scrolling right
  };

  const handleScrollLeft = () => {
    setCurrentScrollLeft((prev) =>
      calculateNewOffset(prev, -SCROLL_SPEED_OFFSET),
    );
  };

  const handleScrollRight = () => {
    setCurrentScrollLeft((prev) =>
      calculateNewOffset(prev, SCROLL_SPEED_OFFSET),
    );
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("mousedown", handleMouseDown);
      scrollContainer.addEventListener("mousemove", handleMouseMove);
      scrollContainer.addEventListener("mouseup", handleMouseUp);
      scrollContainer.addEventListener("mouseleave", handleMouseUp);

      return () => {
        scrollContainer.removeEventListener("mousedown", handleMouseDown);
        scrollContainer.removeEventListener("mousemove", handleMouseMove);
        scrollContainer.removeEventListener("mouseup", handleMouseUp);
        scrollContainer.removeEventListener("mouseleave", handleMouseUp);
      };
    }
    return;
  }, [
    isDragging,
    startX,
    scrollLeft,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  ]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft = currentScrollLeft;
  }, [currentScrollLeft]);

  return (
    <ScrollControlsContainer>
      {!hideArrowButtons && (
        <Styled.CarouselButtons>
          <Styled.CarouselButton onClick={handleScrollLeft}>
            <ChevronIcon />
          </Styled.CarouselButton>
          <Styled.CarouselButton onClick={handleScrollRight}>
            <ChevronIcon />
          </Styled.CarouselButton>
        </Styled.CarouselButtons>
      )}
      <ScrollContainer ref={scrollRef}>{children}</ScrollContainer>
    </ScrollControlsContainer>
  );
};

export default DraggableScrollContainer;
