@login-admin
Feature: Toggle Revocations Charts
    As an admin user on the Lantern dashboard
    I want to click on each of the revocations charts
    So I can view each chart's data

    Background:
      When I click on the profile link
      And I select the state "Missouri"

    Scenario: Viewing the Officer chart
        When I click on the "Officer" revocations link
        Then I should see the Officer chart

    Scenario: Viewing the Risk Level chart
        When I click on the "Risk level" revocations link
        Then I should see the Risk level chart
