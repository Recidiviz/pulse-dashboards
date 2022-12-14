Feature: View the Client List on the Opportunity Page
    As a Workflows user
    I want to login to the Workflows dashboard
    and see a list of clients for a selected officer or multiple officers


    Scenario Outline: Searching for an officer's opportunities
        Given I am logged in as a "<stateCode>" user
        And I navigate to the "<opportunityType>" opportunity page
        When I select officer "<officerName>" from the dropdown
        Then I should see the "<opportunityName>" heading and subheading
        And I should see <numClients> clients listed

     Examples:
        | stateCode | officerName    | numClients | opportunityType     | opportunityName     |
        | US_TN     | Test Officer1  | 2          | compliantReporting  | Compliant Reporting |

    Scenario Outline: Searching for multiple officers' opportunities
        Given I am logged in as a "<stateCode>" user
        And I navigate to the "<opportunityType>" opportunity page
        When I select officer "<officerName>" from the dropdown
        And I select officer "<secondOfficerName>" from the dropdown
        Then I should see <numClients> clients listed

    Examples:
        | stateCode | officerName    | secondOfficerName    | numClients | opportunityType    |
        | US_TN     | Test Officer1  | Test Officer2        | 3          | compliantReporting |

    Scenario Outline: Navigating to a form for an eligible opportunity
        Given I am logged in as a "<stateCode>" user
        And I navigate to the "<opportunityType>" opportunity page
        When I select officer "<officerName>" from the dropdown
        And I hover over a client's name
        Then I should see the button "<buttonText>" to navigate to the form
        When I click on the "NavigateToFormButton" button
        Then I should navigate to the "<opportunityType>" form page
        

     Examples:
        | stateCode | officerName      | opportunityType    | buttonText         |
        | US_TN     | Test Officer1    | compliantReporting | Auto-fill referral |

    Scenario Outline: Opening the preview
        Given I am logged in as a "<stateCode>" user
        And I navigate to the "<opportunityType>" opportunity page
        When I select officer "<officerName>" from the dropdown
        And I click on the client "<clientName>"
        Then I should see a preview of the opportunity for "<clientName>"
        When I exit the preview modal
        Then I should see the client status update

     Examples:
        | stateCode | officerName      | clientName    | opportunityType    |
        | US_TN     | Test Officer1    | LINET HANSEN  | compliantReporting |