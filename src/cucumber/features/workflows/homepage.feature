Feature: Login as a Workflows user and see the homepage
        As a Workflows user
        I want to login to the Workflows dashboard
        And see the Workflows Homepage

    Scenario Outline: Searching for opportunities
        Given I am a "<stateCode>" user on the "home" page
        Then I should see the homepage welcome message
        When I select "<searchValue>" from the dropdown
        Then I should see <numOpportunities> opportunities listed
        And I should see <numOpportunities> set of avatars
        When I click on View all for "<opportunityType>"
        Then I should navigate to the "<opportunityUrlFragment>" opportunity page

        Examples:
            | stateCode | searchValue   | numOpportunities | opportunityType                     | opportunityUrlFragment          |
            | US_TN     | Test Officer1 | 3                | compliantReporting                  | compliantReporting              |
            | US_ID     | Test Officer4 | 4                | pastFTRD                            | pastFTRD                        |
