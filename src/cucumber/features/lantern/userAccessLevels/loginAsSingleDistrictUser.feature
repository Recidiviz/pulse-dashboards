@skip-session-reload
Feature: Login as a single district user
    As a MO Supervisor that has access to one district
    I want to login to the Lantern dashboard
    And see data related to the district I can access

    Background:
        Given I am on the login page
        And I login as an "restrictedAccessUser1" user

    Scenario: The page should reflect my restrictions
        Then I should see "TCSTL" selected in the district filter
        And I should not be able to change the selected district
        When I am viewing the District chart
        Then I should see district "TCSTL" highlighted on the chart
        When I am viewing the Case Table
        Then I should only see cases from district "TCSTL"
