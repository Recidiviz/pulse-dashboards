from app.utils.regex import extract_uuids_from_links


def test_extract_uuids_from_links():
    text = """

## Short-Term Legal Support (1-3 weeks)
1. **Consult Your Attorney (Week 1)**
   - Schedule a meeting with your current attorney to discuss the status of your case and any immediate actions you need to take.
   - If you do not have an attorney or need additional legal advice, consider contacting [City Legal Assistance](#e4eaaaf2-d142-11e1-b3e4-080027620d0c) for guidance.
   - **Goal**: By the end of week 1, have a clear understanding of your legal strategy and any upcoming court dates or paperwork requirements.

2. **Gather Necessary Documentation (Weeks 2-3)**
   - Collect all relevant documents related to your case, including medical records, prescription information, and court notices.
   - Organize these documents to ensure you can provide them promptly when needed by your attorney or the court.
   - **Goal**: By the end of week 3, have all necessary documentation prepared and organized to support your legal proceedings.

## Long-Term Legal Planning (1-3 months)
1. **Monitor Legal Developments (Months 1-3)**
   - Stay in regular contact with your attorney to receive updates on your case and any changes in the legal landscape.
   - Participate actively in your defense strategy to ensure your interests are represented.
   - **Goal**: By the end of 3 months, review the progress of your case and prepare for any upcoming legal requirements or decisions.

2. **Evaluate Financial Impact (Months 2-3)**
   - Assess the financial implications of ongoing legal fees and explore options for financial support if needed, such as consulting [Helping Hands Financial](#e4eaaaf2-d142-11e1-b3e4-080027620cee) for advice.
   - **Goal**: By the end of month 3, have a plan in place to manage legal expenses and any other financial obligations arising from your case.

    """
    assert extract_uuids_from_links(text) == [
        "e4eaaaf2-d142-11e1-b3e4-080027620d0c",
        "e4eaaaf2-d142-11e1-b3e4-080027620cee",
    ]
