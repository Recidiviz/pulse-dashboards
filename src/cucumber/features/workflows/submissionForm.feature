Feature: Fill and submit the Workflows form back to the state's system
    As a Workflows user
    I want to login to the Workflows dashboard
    and navigate to a person's form page
    and preview the form output
    and submit the form

    Scenario Outline: Preview the form
        Given I am a "<stateCode>" user on the "<opportunityType>" form page for "<pseudonymizedId>"
        When I click on the button with text "Preview"
        Then the value "<value>" should appear in the form preview

        Examples:
            | stateCode | pseudonymizedId | opportunityType | value                        |
            | US_TN     | p101            | usTnExpiration  | expired his/her probation on |

    Scenario Outline: Preview the form submission
        Given I am a "<stateCode>" user on the "<opportunityType>" form page for "<pseudonymizedId>"
        When I click on the button with text "Submit to TOMIS"
        Then the value "<value>" should appear in the preview modal

        Examples:
            | stateCode | pseudonymizedId | opportunityType | value                                         |
            | US_TN     | p101            | usTnExpiration  | expired his/her probation on                  |
            | US_TN     | p101            | usTnExpiration  | Review 3 pages and submit TEPE note to eTomis |
            | US_TN     | p101            | usTnExpiration  | LINET HANSEN                                  |
            | US_TN     | p101            | usTnExpiration  | Contact Types: TEPE                           |

    Scenario Outline: Preview the form submission
        Given I am a "<stateCode>" user on the "<opportunityType>" form page for "<pseudonymizedId>"
        When I click on the button with text "Submit to TOMIS"
        Then the value "<value>" should appear in the page preview
        And there should be <pages> pages of notes
        When I click on preview page <pageNumber>
        Then the value "<nextValue>" should appear in the page preview

        Examples:
            | stateCode | pseudonymizedId | opportunityType | value                        | pages | pageNumber | nextValue       |
            | US_TN     | p101            | usTnExpiration  | expired his/her probation on | 3     | 2          | Current balance |