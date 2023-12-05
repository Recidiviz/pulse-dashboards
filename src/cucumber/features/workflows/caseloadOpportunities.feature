Feature: View a list of people on the opportunity page
    As a Workflows user
    I want to login to the Workflows dashboard
    and see a list of people for a given opportunity

    Scenario Outline: Searching for opportunities
        Given I am logged in as a "<stateCode>" user
        When I select "<searchValue>" from the dropdown
        And I click on the View all link for "<opportunityType>"
        Then I should see the "<opportunityName>" heading and subheading
        And I should see <numPeople> people listed

        Examples:
            | stateCode | searchValue   | numPeople | opportunityType                     | opportunityName     |
            | US_ID     | Test Officer6 | 3         | earnedDischarge                     | earned discharge    |
            | US_MO     | Facility #1   | 1         | usMoRestrictiveHousingStatusHearing | Restrictive Housing |

    Scenario Outline: Searching for multiple caseloads
        Given I am logged in as a "<stateCode>" user
        When I select "<searchValue>" from the dropdown
        And I click on the View all link for "<opportunityType>"
        And I select "<secondSearchValue>" from the dropdown
        Then I should see <numPeople> people listed
        And I should see <numTabs> tabs listed

        Examples:
            | stateCode | searchValue   | secondSearchValue | numPeople | numTabs | opportunityType                     |
            | US_MO     | Facility #1   | Facility #2       | 1         | 3       | usMoRestrictiveHousingStatusHearing |

    Scenario Outline: Navigating to a form for an opportunity
        Given I am logged in as a "<stateCode>" user
        When I select "<searchValue>" from the dropdown
        And I click on the View all link for "<opportunityType>"
        And I hover over a person's name
        Then I should see the button "<buttonText>" to navigate to the form
        When I click on the "NavigateToFormLink" button
        Then I should navigate to the "<opportunityType>" form page


        Examples:
            | stateCode | searchValue   | opportunityType   | buttonText      |
            | US_ID     | Test Officer4 | LSU               | Generate Chrono |

    Scenario Outline: Opening the preview modal for an opportunity
        Given I am logged in as a "<stateCode>" user
        When I select "<searchValue>" from the dropdown
        And I click on the View all link for "<opportunityType>"
        And I click on the person "<personName>"
        Then I should see a preview of the opportunity for "<personName>"
        When I exit the preview modal
        Then I should see the status update for the person with external id "<externalId"

        Examples:
            | stateCode | searchValue   | personName   | externalId | opportunityType |
            | US_ID     | Test Officer4 | Betty Rubble | 001        | LSU             |
