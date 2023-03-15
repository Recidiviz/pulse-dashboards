Feature: Login as a Workflows user and see the homepage
    As a Workflows user
    I want to login to the Workflows dashboard
    And see the Workflows Homepage

    Scenario Outline: Searching for an officer's opportunities
        Given I am logged in as a "<stateCode>" user
        Then I should see the homepage welcome message
        When I select officer "<officerName>" from the dropdown
        Then I should see <numOpportunities> opportunities listed
        And I should see <numOpportunities> set of client avatars
        When I click on View all for "<opportunityType>"
        Then I should navigate to the "<opportunityType>" opportunity page

    Examples:
        | stateCode | officerName   | numOpportunities | opportunityType    |
        | US_TN     | Test Officer1 | 3                | compliantReporting |
        | US_ID     | Test Officer4 | 3                | pastFTRD           |
