@skip-offline-fixtures
Feature: Login as a user with access to multiple districts
    As a MO Supervisor that has access to multiple districts
    I want to login to the Lantern dashboard
    And see data related to the districts I can access

    Background:
        Given I am logged into Lantern as a "restrictedAccessUser2" user
    
    Scenario: The page should reflect my restrictions
        Then I should see "2 Items" selected in the district filter
        And I should see district "13,TCSTL" highlighted on the chart
        And I should only see cases from district "13,TCSTL"
        When I select district "13" from the District Filter
        Then I should see "TCSTL" selected in the district filter
        When I select district "TCSTL" from the District Filter
        And I select district "13" from the District Filter
        Then I should see "13" selected in the district filter

