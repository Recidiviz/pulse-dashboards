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

import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import type {
  PreIntakeNoteOneCopy,
  PreIntakeNoteTwoCopy,
} from "../../../configs/types";
import { InfoIcon } from "../../icons/InfoIcon";
import styles from "./styles/InfoPopover.module.css";

const hasMoreToScroll = (el: HTMLDivElement) =>
  el.scrollHeight - el.scrollTop > el.clientHeight + 4;

interface InfoPopoverProps {
  noteOneCopy: PreIntakeNoteOneCopy;
  noteTwoCopy: PreIntakeNoteTwoCopy;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  noteOneCopy,
  noteTwoCopy,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFade, setShowFade] = useState(false);
  const arrowRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-end",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 16 }),
      arrow({ element: arrowRef }),
    ],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
  ]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      setShowFade(hasMoreToScroll(el));
    });
  }, [isOpen]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowFade(hasMoreToScroll(el));
  };

  return (
    <>
      <button
        ref={refs.setReference}
        className={styles["triggerButton"]}
        aria-label="About this assessment"
        aria-expanded={isOpen}
        {...getReferenceProps()}
      >
        <InfoIcon />
      </button>

      {isOpen && (
        <FloatingPortal>
          <div className={styles["backdrop"]} aria-hidden="true" />
          <div
            ref={refs.setFloating}
            className={styles["floatingRoot"]}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <FloatingArrow
              ref={arrowRef}
              context={context}
              fill="white"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={1}
            />
            <div className={styles["panel"]}>
              <div className={styles["panelHeader"]}>
                <span className={styles["panelTitle"]}>
                  About this assessment
                </span>
              </div>
              <div className={styles["scrollWrapper"]}>
                <div
                  className={styles["scrollContent"]}
                  ref={scrollRef}
                  onScroll={handleScroll}
                >
                  <div className={styles["section"]}>
                    {noteOneCopy.paragraphs.map((paragraph) => (
                      <p key={paragraph} className={styles["paragraph"]}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {noteTwoCopy.faqItems.length > 0 && (
                    <div className={styles["section"]}>
                      {noteTwoCopy.faqItems.map((item) => (
                        <div key={item.question} className={styles["faqItem"]}>
                          <p className={styles["faqQuestion"]}>
                            {item.question}
                          </p>
                          <p className={styles["faqAnswer"]}>{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {noteTwoCopy.importantItems.length > 0 && (
                    <ul className={styles["importantList"]}>
                      {noteTwoCopy.importantItems.map((item) => (
                        <li
                          key={item.label}
                          className={styles["importantItem"]}
                        >
                          <span className={styles["importantLabel"]}>
                            {item.label}
                          </span>{" "}
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {showFade && (
                  <div className={styles["scrollFade"]} aria-hidden="true" />
                )}
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
