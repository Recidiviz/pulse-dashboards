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

import React, { useState } from "react";

import { legacyApiRequest } from "~@reentry/frontend/components/IntakeChatV2/api/api";
import { useIntakeAuthContext } from "~@reentry/frontend/components/IntakeChatV2/providers/IntakeAuthProvider";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

import styles from "./Survey.module.css";

interface SurveyProps {
  onSurveySubmitted: () => void;
}

interface SurveyResponse {
  survey_submitted: boolean;
}

const Survey: React.FC<SurveyProps> = ({ onSurveySubmitted }) => {
  const { token } = useIntakeAuthContext();
  const [formData, setFormData] = useState({
    difficulty: null as number | null,
    confusing: "",
    method: "",
    methodOther: "",
    feedback: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    try {
      // TODO: Consider porting survey status to new backend to avoid this extra request
      const response = await legacyApiRequest<SurveyResponse>(
        "/intake/client/survey",
        {
          method: "POST",
          token,
          body: {
            difficulty_rating: formData.difficulty || null,
            questions_confusing: formData.confusing || null,
            preferred_method: formData.method || null,
            method_other:
              formData.method === "other" ? formData.methodOther : null,
            additional_feedback: formData.feedback || null,
          },
        },
      );

      if (response.survey_submitted) {
        showSuccessToast("Thank you for your feedback!");
        onSurveySubmitted();
      }
    } catch (error) {
      console.error("Failed to submit survey:", error);
      showErrorToast("Failed to submit survey. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["cardWrapper"]}>
        <div className={styles["card"]}>
          <form onSubmit={handleSubmit} className={styles["form"]}>
            <h1 className={styles["title"]}>Feedback on your Experience</h1>
            <p className={styles["description"]}>
              Thank you for completing the intake! Please answer a few questions
              about your experience to help us make it even easier for others in
              the future. You can skip any questions you don&rsquo;t want to
              answer.
            </p>

            {/* Question 1: Difficulty Rating */}
            <div className={styles["question"]}>
              <label className={styles["questionLabel"]}>
                1. How hard or easy was it to do this intake?
              </label>
              <div className={styles["difficultyScale"]}>
                <div className={styles["difficultyLabels"]}>
                  <span>Very hard</span>
                  <span>Very easy</span>
                </div>
                <div className={styles["difficultyButtons"]}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, difficulty: num })
                      }
                      className={`${styles["difficultyButton"]} ${
                        formData.difficulty === num
                          ? styles["difficultyButtonSelected"]
                          : ""
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Question 2: Confusing Questions */}
            <div className={styles["question"]}>
              <label className={styles["questionLabel"]}>
                2. Were any of the questions confusing or hard to understand?
              </label>

              <div className={styles["radioOptions"]}>
                {[
                  { value: "no", label: "No" },
                  { value: "some", label: "Yes, some of them were confusing" },
                  {
                    value: "most_all",
                    label: "Yes, most or all of them were confusing",
                  },
                ].map((option) => (
                  <label key={option.value} className={styles["radioLabel"]}>
                    <input
                      type="radio"
                      name="confusing"
                      value={option.value}
                      checked={formData.confusing === option.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confusing: e.target.value,
                        })
                      }
                      className={styles["radioInput"]}
                    />
                    <span className={styles["radioText"]}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 3: Preferred Method */}
            <div className={styles["question"]}>
              <label className={styles["questionLabel"]}>
                3. If you had to do intake again, how would you prefer to do it?
              </label>

              <div className={styles["radioOptions"]}>
                {[
                  {
                    value: "chatbot",
                    label:
                      "Typing on the computer to a chatbot (like you just did)",
                  },
                  {
                    value: "voice",
                    label:
                      "Talking into a microphone on the computer instead of typing",
                  },
                  {
                    value: "person",
                    label:
                      "Talking face-to-face with a person, like a case manager",
                  },
                  { value: "other", label: "Other" },
                ].map((option) => (
                  <div key={option.value}>
                    <label className={styles["radioLabel"]}>
                      <input
                        type="radio"
                        name="method"
                        value={option.value}
                        checked={formData.method === option.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            method: e.target.value,
                            methodOther:
                              e.target.value !== "other"
                                ? ""
                                : formData.methodOther,
                          })
                        }
                        className={styles["radioInput"]}
                      />
                      <span className={styles["radioText"]}>
                        {option.label}
                      </span>
                    </label>

                    {option.value === "other" &&
                      formData.method === "other" && (
                        <textarea
                          value={formData.methodOther}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              methodOther: e.target.value,
                            })
                          }
                          placeholder="How would you prefer to do the intake?"
                          rows={3}
                          className={styles["textarea"]}
                        />
                      )}
                  </div>
                ))}
              </div>
            </div>

            {/* Question 4: Additional Feedback */}
            <div className={styles["question"]}>
              <label className={styles["questionLabel"]}>
                4. Is there anything else you want to tell us that could help
                make this intake better or easier for others?
              </label>

              <textarea
                value={formData.feedback}
                onChange={(e) =>
                  setFormData({ ...formData, feedback: e.target.value })
                }
                placeholder="Let us know here"
                rows={4}
                className={styles["textareaLarge"]}
              />
            </div>

            {/* Submit Button */}
            <div className={styles["submitButtonContainer"]}>
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles["submitButton"]}
              >
                {isSubmitting ? (
                  <svg
                    className={styles["loadingSpinner"]}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-labelledby="loading-title"
                    role="img"
                  >
                    <title id="loading-title">Loading</title>
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Survey;
