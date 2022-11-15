@skip-session-reload
Feature: Login as a US_TN user and see homepage
    As a TN user
    I want to login to the Workflows dashboard
    And see the Workflows Homepage

    Background:
        Given I am logged in as a "US_TN" user
    
    Scenario: I should see the homepage
        Then I should see the homepage welcome message for the "US_TN" user

