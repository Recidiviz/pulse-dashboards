@reload-session
Feature: Login with Auth0
    As a user on the homepage
    I want to login with Auth0
    Because I want to access the dashboard

    Background:
        Given I am logged into Lantern as a "admin" user

    Scenario: Logging in with Auth0
        When I click on the profile link
        And I select the state "Pennsylvania"
        Then I should see the Lantern landing page
