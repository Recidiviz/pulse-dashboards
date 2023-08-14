Feature: Fill and export the Workflows form
    As a Workflows user
    I want to login to the Workflows dashboard
    and navigate to a person's form page
    and update the form contents
    and print out the form

    Scenario Outline: Viewing the form page
        Given I am a "<stateCode>" user on the "<opportunityType>" form page for "<pseudonymizedId>"
        Then I should see the text "<formText>" on the form
        And I should see the criteria list with the text "<criteriaText>"
        And I should see the details section with the text "<detailsText>"

        Examples:
            | stateCode | pseudonymizedId | opportunityType    | formText                     | criteriaText                                                    | detailsText                  |
            | US_TN     | p101            | compliantReporting | Telephone Reporting Referral | Valid current offenses:                                         | Probation Special Conditions |
            | US_TN     | p101            | usTnExpiration     | Expiration date              | No zero tolerance codes since most recent sentence imposed date | Relevant Contact Notes       |

    Scenario Outline: Update the form
        Given I am a "<stateCode>" user on the "<opportunityType>" form page for "<pseudonymizedId>"
        When I click into the "<inputId>" form field and update the value to "Test example text"
        Then the value "Test example text" should be saved in the form for the field "<inputId>"

        Examples:
            | stateCode | pseudonymizedId | opportunityType    | inputId         |
            | US_TN     | p101            | compliantReporting | clientFullName  |
            | US_TN     | p101            | usTnExpiration     | currentOffenses |

    @remove-temp-directory
    Scenario Outline: Export the form
        Given I am a "<stateCode>" user on the "<opportunityType>" form page for "<pseudonymizedId>"
        Then I should see the export form button "<exportButtonText>"
        When I click on the export form button
        Then the form should export for filename "<filename>"

        Examples:
            | stateCode | pseudonymizedId | opportunityType    | exportButtonText | filename                                |
            | US_TN     | p101            | compliantReporting | Download PDF     | Linet Hansen - Form CR3947 Rev05-18.pdf |

    Scenario Outline: Update eligibility for eligible clients
        Given I am a "<stateCode>" user on the "<opportunityType>" form page for "<pseudonymizedId>"
        When I click on the "Update eligibility" dropdown
        Then I should see the eligibility dropdown that has a reason listed like "<checkboxValue>"
        When I click on the checkbox for "<checkboxValue>"
        Then I should see the value "<checkboxValue>" selected
        And I should see the person labeled as "Currently ineligible"
        When I click on the "<checkboxValue>" dropdown
        And I click on the checkbox for "Eligible"
        Then I should see the "Update eligibility" dropdown
        And I should see the person labeled as "Eligible"

        Examples:
            | stateCode | pseudonymizedId | opportunityType    | checkboxValue |
            | US_TN     | p101            | compliantReporting | DECF          |
