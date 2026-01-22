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

interface ExtractCSSOptions {
  includeChildren?: boolean;
  includeMediaQueries?: boolean;
  includeAnimations?: boolean;
}

/**
 * Creates PDF page styles
 */
export function createPDFPageStyles(footerText: string): string {
  return `
    @page {
      size: A4;
      margin-top: 40px;
      margin-right: 40px;
      margin-bottom: 70px;
      margin-left: 40px;
      orphans: 4;
      widows: 4;
    }

    @page {
      @bottom-center {
        content: "${footerText}";
        font-size: 14px;
        color: #666;
        text-align: center;
      }
    }

    @media print {
      .markdown_annotations__PyRaq, .markdown_notes__84h8O { display: none; }
      .markdown_markdown__MnjCI > * { break-inside: avoid !important; }
      .markdown_markdown__MnjCI button { border-bottom: none !important; }
      .markdown_markdown__MnjCI img { display: none; }
    }
  `;
}

/**
 * Extracts CSS rules from stylesheets that apply to the given element and optionally its children.
 * Includes support for media queries and CSS animations.
 */
export function extractOriginalCSS(
  element: Element,
  options: ExtractCSSOptions = {},
) {
  const {
    includeChildren = true,
    includeMediaQueries = true,
    includeAnimations = true,
  } = options;

  const matchingRules = new Set<string>();
  const elements = includeChildren
    ? [element, ...element.querySelectorAll("*")]
    : [element];

  const stylesheets = Array.from(document.styleSheets);

  /**
   * Checks if a CSS rule selector matches any of the given elements
   */
  function checkRuleAgainstElements(rule: CSSStyleRule, elements: Element[]) {
    if (!rule.selectorText) return false;

    return elements.some((el) => {
      try {
        return el.matches && el.matches(rule.selectorText);
      } catch (e) {
        console.log("Invalid selector:", rule.selectorText, e);
        return false;
      }
    });
  }

  /**
   * Recursively processes CSS rules to find matches for the given elements
   */
  function processRules(rules: CSSRuleList, elements: Element[]) {
    Array.from(rules).forEach((rule) => {
      try {
        if (rule instanceof CSSStyleRule) {
          if (checkRuleAgainstElements(rule, elements)) {
            matchingRules.add(rule.cssText);
          }
        } else if (rule instanceof CSSMediaRule && includeMediaQueries) {
          const mediaRules: string[] = [];
          const mediaRule = rule as CSSMediaRule;
          Array.from(mediaRule.cssRules).forEach((nestedRule) => {
            if (
              nestedRule instanceof CSSStyleRule &&
              checkRuleAgainstElements(nestedRule, elements)
            ) {
              mediaRules.push(nestedRule.cssText);
            }
          });

          if (mediaRules.length > 0) {
            matchingRules.add(
              `@media ${mediaRule.conditionText} {\n${mediaRules.join("\n")}\n}`,
            );
          }
        } else if (rule instanceof CSSKeyframesRule && includeAnimations) {
          const keyframesRule = rule as CSSKeyframesRule;
          const animationName = keyframesRule.name;
          const usesAnimation = elements.some((el) => {
            const computedStyle = getComputedStyle(el);
            return computedStyle.animationName.includes(animationName);
          });

          if (usesAnimation) {
            matchingRules.add(rule.cssText);
          }
        } else if (rule instanceof CSSSupportsRule) {
          const supportsRule = rule as CSSSupportsRule;
          processRules(supportsRule.cssRules, elements);
        }
      } catch (e) {
        console.warn("Error processing rule:", rule, e);
      }
    });
  }

  stylesheets.forEach((stylesheet) => {
    try {
      if (stylesheet.cssRules) {
        processRules(stylesheet.cssRules, elements);
      }
    } catch (e) {
      console.warn("Cannot access stylesheet:", stylesheet.href, e);
    }
  });

  return Array.from(matchingRules);
}

/**
 * Extracts inline styles from the given element and optionally its children.
 * Creates CSS rules with generated selectors for elements with inline styles.
 */
export function extractInlineStyles(element: Element, includeChildren = true) {
  const inlineStyles: string[] = [];
  const elements = includeChildren
    ? [element, ...element.querySelectorAll("*")]
    : [element];

  elements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style && htmlEl.style.cssText) {
      const selector = htmlEl.id ? `#${htmlEl.id}` : `.inline-element-${index}`;

      if (!htmlEl.id) {
        htmlEl.classList.add(`inline-element-${index}`);
      }

      inlineStyles.push(
        `${selector} {\n  ${htmlEl.style.cssText.replace(/;\s*/g, ";\n  ")}\n}`,
      );
    }
  });

  return inlineStyles;
}

/**
 * Combines original CSS rules, inline styles, and font family rules for complete styling extraction.
 * Returns both individual rule sets and a combined CSS string.
 */
export function extractCompleteCSS(
  element: Element,
  options: ExtractCSSOptions = {},
) {
  const originalRules = extractOriginalCSS(element, options);
  const inlineStyles = extractInlineStyles(
    element,
    options.includeChildren !== undefined ? options.includeChildren : true,
  );

  const elements =
    options.includeChildren !== undefined && !options.includeChildren
      ? [element]
      : [element, ...element.querySelectorAll("*")];

  const fontFamilyRules: string[] = [];
  elements.forEach((el, index) => {
    const computedStyle = getComputedStyle(el);
    const fontFamily = computedStyle.fontFamily;

    if (fontFamily && fontFamily !== "initial" && fontFamily !== "inherit") {
      const selector = el.id ? `#${el.id}` : `.font-element-${index}`;

      if (!el.id) {
        el.classList.add(`font-element-${index}`);
      }

      fontFamilyRules.push(`${selector} {\n  font-family: ${fontFamily};\n}`);
    }
  });

  return {
    originalRules,
    inlineStyles,
    fontFamilyRules,
    combined: [...originalRules, ...inlineStyles, ...fontFamilyRules].join(
      "\n\n",
    ),
  };
}

/**
 * Generates a PDF from HTML and CSS data by sending a request to the backend API.
 * Downloads the generated PDF file and triggers success/error callbacks.
 */
export async function generatePDF(
  printData: { html: string; css: string[]; options: Record<string, unknown> },
  fileName: string,
  accessToken: string,
  onSuccess: () => void,
  onError: (error: string) => void,
): Promise<void> {
  try {
    const response = await fetch(
      `${process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8000"}/api/generate-pdf`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(printData),
      },
    );

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    onSuccess();
  } catch (err) {
    console.error("PDF generation failed:", err);
    onError("Failed to generate PDF");
  }
}
