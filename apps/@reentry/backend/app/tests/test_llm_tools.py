from app.utils.action_plan_types import ActionPlan
from app.utils.llm_tools import convert_to_markdown


def test_convert_to_markdown_replaces_quotes():
    structure_plan = {
        "immediate_needs": {
            "annotations": [],
            "notes": None,
            "title": "Immediate Needs",
            "markdown_content": "#markdown",
        },
        "quick_summary_circumstances": "test summary",
        "overview": "test overview",
        "sections_order": [
            "Housing Stability",
        ],
        "sections": [
            {
                "annotations": [
                    {
                        "source": 'Client "Intake Summary"',
                        "source_location": "Accommodation",
                        "source_text_extract": "Homeless for five years with multiple shelter stays and street sleeping, they have no housing lined up and their top priority is finding stable, affordable housing or supportive housing programs.",
                    },
                    {
                        "source": 'Decision "Tree Recommendations"',
                        "source_location": "employment_housing",
                        "source_text_extract": "- Assist client in finding appropriate emergency shelter",
                    },
                    {
                        "source": "Decision Tree Recommendations",
                        "source_location": "employment_housing",
                        "source_text_extract": "- Develop a housing stability plan with the client",
                    },
                ],
                "notes": "Be prepared to discuss options for program accessibility and financial assistance for housing applications or services, as the client may face barriers due to limited financial resources and availability of required documentation.",
                "title": "Housing Stability",
                "markdown_content": "You’ve shared that finding stable housing is your top priority after being homeless for several years. Together, the immediate focus will be securing a safe place to stay right after your release, while also starting the process of applying for longer-term, stable housing programs. There are resources and programs available that can help you not only with emergency shelter but also with transitioning into supportive or affordable housing. This will give you the foundation you need to focus on other areas like employment, health, and financial stability. Let’s break down the steps to get you there.\n\n## Short-Term Plan (0-4 weeks)\n\n1. **Emergency Shelter (Weeks 1-2):**\n - Contact [Boise City/Ada County Housing Authorities (South Orchard Street)](#84d81c07-7c7a-4356-a689-75d496faf691) at (208) 345-4907 to inquire about available shelter accommodations.\n - Reach out to [Idaho Housing and Finance Association](#38ab43e6-11c5-426c-b386-20d63aa77836) at (855) 505-4700 to explore rapid rehousing or temporary housing options.\n - If immediate help is needed, contact any of the housing providers listed for urgent shelter placement.\n - **Goal**: Secure a safe and temporary emergency shelter by the end of week 2.\n\n2. **Start Housing Program Applications (Weeks 2-4):**\n - Begin applications for housing programs, such as Section 8 or public housing, through the [Boise City/Ada County Housing Authorities](#84d81c07-7c7a-4356-a689-75d496faf691).\n - Contact [NeighborWorks Boise](#4e6d1d59-7013-47d9-88c7-f92215b78b49) at (208) 343-4065 and [Boise Housing & Community Development](#0b4a3484-b0f8-4e36-b036-733d0bd9e84c) at (208) 570-6830 to explore additional programs and resources, as they may have different eligibility criteria and timelines.\n - Gather essential documents for housing applications (e.g., ID, proof of homelessness). If you’re unsure what you need, ask housing providers directly for a list.\n - **Goal**: Complete and submit applications for at least one long-term housing program by the end of week 4.\n\n## Long-Term Plan (2-6 months)\n\n1. **Transition to Stable Housing (Months 2-3):**\n - If approved for rapid rehousing or supportive housing, meet with your assigned case manager to finalize the move and understand the resources available to you.\n - Continue working with your caseworker or housing advocate to secure permanent housing options through the programs you applied for, like Section 8 or other public housing support.\n - **Goal**: Move into a stable, supportive housing option by the third month.\n\n2. **Plan for Long-Term Stability (Months 3-6):**\n - Develop a housing stability plan with your case manager, focusing on managing rent, creating an emergency fund, and participating in tenant education services, if available.\n - Follow up with agencies like [Idaho Housing and Finance Association](#38ab43e6-11c5-426c-b386-20d63aa77836) and [NeighborWorks Boise](#4e6d1d59-7013-47d9-88c7-f92215b78b49) to check the status of permanent affordable housing programs you applied to.\n - **Goal**: By month 6, have a long-term housing solution in place and a plan to maintain stability.\n\nBy taking these steps, you’ll be on the right path to securing and maintaining stable housing. This will allow you to focus on creating a better future for yourself. If you need assistance at any point, I am here to help guide and support you. Let’s move forward together!",
                "resources": [
                    {
                        "id": "84d81c07-7c7a-4356-a689-75d496faf691",
                        "category": "Basic Needs",
                        "subcategory": "Housing",
                        "name": "Boise City/Ada County Housing Authorities",
                        "phone": "(208) 345-4907",
                        "description": None,
                        "tags": None,
                        "address": "1001 South Orchard Street, Boise, Idaho 83705",
                        "website": "https://www.bcacha.org/",
                        "email": None,
                        "score": 5.0,
                        "llm_rank": None,
                        "llm_valid": None,
                        "rating": 3.7,
                        "ratingCount": 54,
                        "operationalStatus": None,
                        "price_level": None,
                        "transport_mode": "driving",
                        "transport_minutes": 12,
                    },
                ],
            },
        ],
        "milestones": [
            {
                "date": "End of Month 3",
                "title": "Secure Stable Housing",
                "markdown_content": "You should have moved into a stable housing arrangement, whether through supportive housing or rapid rehousing programs, giving you the security to focus on rebuilding other areas of your life.",
                "notes": None,
            },
        ],
        "timeline": [
            {
                "date": "Week 1",
                "markdown_content": "- **Housing:**\n - Contact emergency shelters and organizations to secure temporary housing.\n - Gather necessary documents for housing applications.\n- **Financial Security:**\n - Submit applications for SNAP and other immediate assistance programs.",
                "notes": "Ensure to follow up with agencies for confirmation.",
            },
        ],
    }
    plan = ActionPlan(**structure_plan)
    result = convert_to_markdown(plan)

    assert '"Intake Summary"' not in result
    assert '"Tree Recommendations"' not in result

    assert "'Intake Summary'" in result
    assert "'Tree Recommendations'" in result
