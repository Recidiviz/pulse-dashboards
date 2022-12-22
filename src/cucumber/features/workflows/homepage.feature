Feature: Login as a US_TN user and see homepage
    As a TN user
    I want to login to the Workflows dashboard
    And see the Workflows Homepage

    Scenario Outline: Searching for an officer's opportunities
        Given I am logged in as a "<stateCode>" user
        Then I should see the homepage welcome message for the "<stateCode>" user
        When I select officer "<officerName>" from the dropdown
        Then I should see <numOpportunities> opportunities listed
        And I should see <numOpportunities> set of client avatars
        When I click on View all for "<opportunityType>"
        Then I should navigate to the "<opportunityType>" opportunity page

    Examples:
        | stateCode | officerName   | numOpportunities | opportunityType    |
        | US_TN     | Test Officer1 | 3                | compliantReporting |
