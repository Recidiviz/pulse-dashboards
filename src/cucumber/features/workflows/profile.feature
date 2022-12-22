Feature: View a justice-involved individual's profile
    As a Workflows user
    I want to view details on a justice-involved individual's profile
    And navigate to different opportunity form pages
    And update a person's eligibility

    Scenario Outline: View client profile with two opportunities
        Given I am a "<stateCode>" user on the profile page for person ID "<personID>"
        Then I should see the following details "<listOfDetailHeaders>"
        And I should see an accordion with <numOpps> opportunities
        And I should see a sentence progress timeline show "<monthsLeft>"

     Examples:
        | stateCode | monthsLeft                     | personID | numOpps | listOfDetailHeaders                                                                           |
        | US_TN     | 10 months (10 months past end) | p101     | 2       | Supervision, Housing, Fines and Fees, Probation Special Conditions, Parole Special Conditions |

    Scenario Outline: View client profile with one opportunity
        Given I am a "<stateCode>" user on the profile page for person ID "<personID>"
        Then I should see the following details "<listOfDetailHeaders>"
        And I should see an accordion with <numOpps> opportunities

     Examples:
        | stateCode | personID | numOpps | listOfDetailHeaders                                                                           |
        | US_TN     | p100     | 1       | Supervision, Housing, Fines and Fees, Probation Special Conditions, Parole Special Conditions |
