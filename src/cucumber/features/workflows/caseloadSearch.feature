Feature: Use the caseload search bar
    As a Workflows user
    I want to use the caseload search to list caseloads and opportunities for specific officers

    Scenario Outline: Search for officers on different pages
        Given I am a "<stateCode>" user on the "<page>" page
        And There are no officers pre-selected in the dropdown
        When I select officer "<officerId>" from the dropdown
        Then I should see the officer "<officerName>" with ID "<officerId>" selected in the search bar
        When I select officer "<secondOfficerId>" from the dropdown
        Then I should see the officer "<officerName>" with ID "<officerId>" selected in the search bar
        And I should see the officer "<secondOfficerName>" with ID "<secondOfficerId>" selected in the search bar
        And I should see a total of 2 officers selected

     Examples:
        | stateCode | page               | officerId | secondOfficerId | officerName   | secondOfficerName |
        | US_TN     | home               | OFFICER1  | OFFICER2        | Test Officer1 | Test Officer2     |
        | US_TN     | clients            | OFFICER1  | OFFICER2        | Test Officer1 | Test Officer2     |
        | US_TN     | compliantReporting | OFFICER1  | OFFICER2        | Test Officer1 | Test Officer2     |


    Scenario Outline: Clearing officers from the search
    Given I am a "<stateCode>" user on the "<page>" page
    And There are no officers pre-selected in the dropdown
    When I select officer "<officerId>" from the dropdown
    And I select officer "<secondOfficerId>" from the dropdown
    Then I should see a total of 2 officers selected
    When I clear the officer with ID "<officerId>" 
    Then I should see a total of 1 officer selected
    When I select officer "<officerId>" from the dropdown
    Then I should see a total of 2 officers selected
    When I click on the Clear Officers link
    Then I should see no officers selected
        
     Examples:
        | stateCode | page | officerId | secondOfficerId |
        | US_TN     | home | OFFICER1  | OFFICER2        |
