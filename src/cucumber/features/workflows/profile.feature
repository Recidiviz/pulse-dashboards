Feature: View a justice-involved individual's profile
    As a Workflows user
    I want to view details on a justice-involved individual's profile
    And navigate to different opportunity form pages
    And update a person's eligibility

    Scenario Outline: View a profile with two opportunities
        Given I am a "<stateCode>" user on the profile page for person ID "<personID>"
        Then I should see the following details "<listOfDetailHeaders>"
        And I should see an accordion with <numOpps> opportunities
        And I should see a sentence progress timeline show "<monthsLeft>"

     Examples:
        | stateCode | monthsLeft | personID | numOpps | listOfDetailHeaders                                                                                       |
        | US_TN     | 10 months  | p101     | 2       | Supervision, Milestones, Housing, Fines and Fees, Probation Special Conditions, Parole Special Conditions |

    Scenario Outline: View a profile with one opportunity
        Given I am a "<stateCode>" user on the profile page for person ID "<personID>"
        Then I should see the following details "<listOfDetailHeaders>"
        And I should see an accordion with <numOpps> opportunities

     Examples:
        | stateCode | personID | numOpps | listOfDetailHeaders                                                                                       |
        | US_TN     | p100     | 1       | Supervision, Milestones, Housing, Fines and Fees, Probation Special Conditions, Parole Special Conditions |

    Scenario Outline: Update eligibility from profile
        Given I am a "<stateCode>" user on the profile page for person ID "<personID>"
        When I click on the button with the text "Update eligibility"
        Then I should see the update eligibility view that has a reason listed like "<checkboxValue>"
        When I click on the checkbox for "<checkboxValue>"
        And I click on the button with the text "Confirm"
        Then I should see the person labeled as "Currently ineligible"
        And I should see the ineligible reason "SCNC" listed

     Examples:
        | stateCode | personID  | checkboxValue |
        | US_ID     | p005      | SCNC          |
