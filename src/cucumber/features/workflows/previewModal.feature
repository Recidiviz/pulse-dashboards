Feature: Interact with the preview modal on the opportunity page
    As a Workflows user
    I want to quickly preview and interact with a person's opportunity
    From the opportunity page


    Scenario Outline: Viewing the Preview Modal
        Given I am a "<stateCode>" user on the "<opportunityType>" page
        When I select "<searchValue>" from the dropdown
        And I click on the person "<personName>"
        Then I should see a preview of the opportunity for "<personName>"
        And I should see the criteria list with the text "<criteriaText>"
        And I should see the details section with the text "<detailsText>"
        And I should see the button "<buttonText>" to navigate to the form

        Examples:
            | stateCode | searchValue   | personName   | opportunityType    | criteriaText                | detailsText               | buttonText         |
            | US_TN     | Test Officer1 | Linet Hansen | compliantReporting | Sanctions in the past year: | Parole Special Conditions | Auto-fill referral |

    Scenario Outline: Update eligibility from preview modal
        Given I am a "<stateCode>" user on the "<opportunityType>" page
        When I select "<searchValue>" from the dropdown
        And I click on the person "<personName>"
        And I click on the "Update eligibility" dropdown
        Then I should see the eligibility dropdown that has a reason listed like "<checkboxValue>"
        When I click on the checkbox for "<checkboxLabel>"
        Then I should see the value "<checkboxValue>" selected
        And I should see the person labeled as "Currently ineligible"
        When I click on the "<checkboxValue>" dropdown
        And I click on the checkbox for "Eligible"
        Then I should see the "Update eligibility" dropdown
        And I should see the person labeled as "Eligible"

        Examples:
            | stateCode | opportunityType    | checkboxLabel                         | checkboxValue | personName   | searchValue   |
            | US_TN     | compliantReporting | DECF: No effort to pay fine and costs | DECF          | Linet Hansen | Test Officer1 |

    Scenario Outline: Navigate to form from preview modal
        Given I am a "<stateCode>" user on the "<opportunityType>" page
        When I select "<searchValue>" from the dropdown
        And I click on the person "<personName>"
        And I click on the "NavigateToFormButton" button
        Then I should navigate to the "<opportunityType>" form page

        Examples:
            | stateCode | searchValue   | personName   | opportunityType    |
            | US_TN     | Test Officer1 | Linet Hansen | compliantReporting |

    Scenario Outline: Navigate to person profile from preview modal
        Given I am a "<stateCode>" user on the "<opportunityType>" page
        When I select "<searchValue>" from the dropdown
        And I click on the person "<personName>"
        And I click on the person link on the preview modal
        Then I should navigate to the person profile page for person ID "<personID>"

        Examples:
            | stateCode | searchValue   | personName   | opportunityType    | personID |
            | US_TN     | Test Officer1 | Linet Hansen | compliantReporting | p101     |
