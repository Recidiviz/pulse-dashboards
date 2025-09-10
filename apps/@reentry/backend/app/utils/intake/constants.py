from enum import StrEnum
from typing import Dict, List

"""
Constants used throughout the intake assessment process.
"""


class IntakeStatus(StrEnum):
    """
    Status for intake assessment process.
    Used for both database persistence and UI state representation.
    """

    CREATED = "created"
    IN_PROGRESS = "in_progress"
    ERROR = "error"
    COMPLETED = "completed"


ROLE = """
Role: You are a social worker conducting a structured intake assessment with a new client who is currently in a prison facility and preparing for their release.
"""

TONE = """
Tone: Warm, trauma-informed, and professional. Use plain language that is understandable at a 4th-grade reading level.
"""


class CompletionStatus(StrEnum):
    """
    Status of a section within an intake conversation.
    Used both in-memory and database.
    """

    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    UNCLEAR = "unclear"  # Section needs clarification -- Not implemented yet


SECTIONS_UTAH_LSIR = [
    {
        "title": "Employment",
        "description": "We'll discuss your current work situation and employment plans for after your release.",
        "required_information": """1. If the client is currently employed
    a. If yes:
        - What type of work they are doing
        - How many hours per week they are working
        - How they like their job and anyone they work with
    b. If no, and they are looking for work:
        - Were they working before entering the facility
        - What type of work were they doing before entering the facility
        - What type of work they are looking for after they are released
        - How many hours per week they are looking to work
        - Will they be returning the job they had before entering the facility
        - optional: Do they have any specific goals or aspirations for the work they are looking for
    c. If no, and they are not looking for work:
        - Are they receiving any social security or disability benefits
        - Or are they planning to be a homemaker
        - Or are they planning to go to school""",
    },
    {
        "title": "Education",
        "description": "Let's talk about your educational background and any plans you have for continuing your education.",
        "required_information": """1. If they are planning to go to school after release
    a. If yes:
        - What type of school they are planning to attend
        - What type of program they are planning to enroll in
        - How many hours per week they are planning to attend school
        - optional: Do they have any specific goals or aspirations for their education
2. The client's highest level of education completed (such as high school, GED, college)
3. If they have any degrees or certifications
4. If they are currently enrolled in any courses or programs in the facility""",
    },
    {
        "title": "Financial",
        "description": "We'll review your financial situation and discuss your financial goals and plans.",
        "required_information": """1. Does the client plan to apply for any financial assistance after release
    a. If yes:
        - What type of financial assistance they are planning to apply for, such as food stamps or unemployment benefits
2. If they have any specific goals for their finances""",
    },
    {
        "title": "Family and Marital Relationships",
        "description": "Let's discuss your family relationships and the support system you have available.",
        "required_information": """1. Does the client have a partner, spouse, or long-term partner.
2. Do they have strong, positive relationships with their parents
3. Do they have strong, positive relationships with their other family members""",
    },
    {
        "title": "Accommodation",
        "description": "We'll talk about your housing situation before entering the facility and your plans for housing after release.",
        "required_information": """1. Do they have a place to stay immediately after release
3. Where do they plan to live long-term after release, and is it the same as the place they lived before or the place they plan to stay immediately after release
4. What are their goals related to housing after release""",
    },
    {
        "title": "Leisure and Recreation",
        "description": "Let's explore your hobbies, interests, and how you like to spend your free time.",
        "required_information": """1. What were their hobbies and interests before entering the facility
2. Do you have any hobbies or activities that they enjoy doing while living in the facility
3. Do they have any hobbies or interests that they would like to pursue after release""",
    },
    {
        "title": "Companions",
        "description": "We'll discuss your social connections and plans for maintaining positive relationships.",
        "required_information": """1. Do you have any close friends or companions that you plan to spend time with after release
2. What they imagine their social life will look like after release""",
    },
    {
        "title": "Alcohol and Drug Use",
        "description": "This section covers substance use history and any support you might need for recovery.",
        "required_information": """1. Will you require any support or resources related to alcohol or drug use after release
    a. If yes:
        - What type of support they think would be helpful (like counseling, support groups, medical assistance)
        - Have they received treatment or support for substance use before
    b. If no:
        - Confirm they feel confident managing without additional support
2. Ask this question even if the client seems reluctant - it's important for their safety and planning""",
    },
]


SECTIONS_ID_FACR = [
    {
        "title": "Basic Information",
        "description": "Your vital documents, veteran status, and other basic info",
        "required_information": """
1. Does the client have a birth certificate?
2. Does the client have a social security card?
3. Does the client have a government-issued ID or a driver’s license issued by the DMV within the past 10 years?
    a. If the client has a driver’s license: Has the license been suspended or revoked?
4. Is the client a veteran?
5. What mode(s) of transportation does the client expect to have access to after release?
    a. Do they have a car?
    b. Do they expect to live in an area with access to public transportation?
6. Does the client have any warrants or detainers outstanding?
    a. If yes, what are the details?
7. Is this the client’s first time releasing from prison?
    a. If no, what did the client struggle with most the last time they got out?
""",
    },
    {
        "title": "Housing",
        "description": "Your short term housing plan and long term goals",
        "required_information": """
1. Does the client have a short-term plan for a safe and confirmed place to go immediately upon release?
    a. If yes, what is the nature of that housing?
        i. If with family or friends:
            1. Who will be living there?
            2. Has the client discussed this stay with them?
            3. What are the rules or expectations for living there?
            4. How long have they agreed the client can stay?
            5. Is there a housing agreement (eg. lease) that limits how long the client can stay?
        ii. If in a transitional housing program, shelter, or other institutional housing:
            1. Has the client been accepted into a program?
            2. What is the name of the program/shelter/institution?
            3. Does the client understand the program's rules and requirements?
        iii. If in client’s own rented or owned home:
            1. Will anyone else be living there? If so, who?
    b. If no:
        i. What is the client’s housing preference? Are they looking for transitional housing, sober living, a private residence, or something else?
2. If the client has a short term housing plan: what is the client’s back-up “Plan B” if their original plan falls through?
3. What is the client’s plan for income or monthly budget to pay for housing in the short term?
4. Does the client have family and/or friends willing to help with housing expenses?
5. Does the client have any disabilities that require specific housing accommodations?
6. Where is the client planning to live long-term after release?
7. Does the client have no-contact orders that affect where they can live?
    a. If yes: What are the details of the order?
8. Does the client require LGBTQIA-safe housing?
9. Does the client require housing that will allow them to live with their children?
""",
    },
    {
        "title": "Employment",
        "description": "Your employment history and goals",
        "required_information": """
1. Does the client plan to work after release?
    a. If yes:
        i. Does the client already have a job lined up?
        ii. How many hours per week does the client seek to work?
        iii. What jobs would the client ideally like to have after release?
        iv. Does the client have a resume?
        v. Does the client have a professional email address for job applications?
        vi. What is the client’s past work experience prior to incarceration?
        vii. Does the client still have a good relationship with any prior employers?
        viii. Did the client work any jobs during incarceration?
            1. If yes: Which job(s)?
            2. Does the client have good relationships with any prior bosses who could write a letter of recommendation or act as a reference?
""",
    },
    {
        "title": "Education",
        "description": "Your education history and goals",
        "required_information": """
1. What is the highest grade level or education the client has completed?
2. Has the client completed any educational or vocational programming while incarcerated?
    a. If yes: What programming?
3. Has the client received their GED, college credits, or any other kind of diploma or credentials while incarcerated?
4. Is the client currently enrolled in any courses or programs, such as CBISUA, at the facility?
    a. If yes: What courses or programs?
5. Does the client have any degrees or professional certifications?
6. Is the client interested in pursuing further education or vocational training after release?
    a. If yes:
        i. What field of study or trade is the client interested in?
        ii. What are the client’s goals for their continued education?
""",
    },
    {
        "title": "Financial",
        "description": "Your financial history and goals",
        "required_information": """
1. Does the client have any court-ordered financial obligations (restitution, fines, fees)?
2. Does the client have child support obligations?
3. Does the client have other debts they need to manage after release?
4. Has the client applied for Medicaid or other health insurance?
5. Have you previously received Social Security benefits (SSI/SSDI)?
6. Does the client plan to apply for any government financial assistance after release?
""",
    },
    {
        "title": "Family Relationships",
        "description": "Your family relationships",
        "required_information": """
1. Who is part of the client’s primary family?
    a. What are their names and relationships to the client?
2. Does the client feel these family members are supportive?
3. What are the client’s goals regarding relationships with family after release?
4. If applicable, is the client planning to reunify with their family?
    a. What specific challenges do they anticipate and how do they plan to navigate them?
5. Does the client have children?
    a. If yes:
        i. How old are the children?
        ii. What is the current nature and frequency of their contact?
        iii. What are their immediate goals regarding their relationship with their children and their role as a parent?
6. Are there any court-ordered restrictions on contact or visitation that may affect the client’s ability to be involved with their children or other family members?
    a. If yes: What are the details of the order(s)?
""",
    },
    {
        "title": "Social Connections",
        "description": "The status of your friendships and community",
        "required_information": """
1. Who are the most supportive people in the client’s life?
2. How does the client plan on connecting with these people after release?
3. What is the nature of the client's friendships and social network?
4. Do they feel their current social circle will be supportive of their reentry goals?
5. Is the client interested in developing new, positive social connections?
    a. If yes, what are they looking for in these new connections (e.g., shared hobbies, sobriety support, faith-based community, mentorship)?
""",
    },
    {
        "title": "Leisure and Recreation",
        "description": "How you like to spend your free time",
        "required_information": """
1. What social and recreational activities does the client enjoy?
2. How does the client plan to participate in these activities after release?
3. What former activities, if any, does the client plan to avoid after release?
""",
    },
    {
        "title": "Alcohol and Drugs",
        "description": "Your relationship with alcohol and drugs",
        "required_information": """
1. Does the client have a history with substance abuse?
    a. If yes:
        i. What does their recovery journey look like so far?
        ii. Have they ever participated in a substance abuse treatment program while incarcerated or prior to incarcerated?
        iii. Is the client interested in starting or continuing treatment support after release?
            1. If yes: What type of support do they feel would be most effective for them now (e.g., group meetings like AA/NA, individual counseling, medication-assisted treatment, residential treatment, or something else)?
""",
    },
]


SECTIONS_ORAS_RT = [
    {
        "title": "Personal Demographics",
        "description": "Basic Information",
        "required_information": """1. Age at time of assessment
    a. Confirm current age
    b. Ask if they will be 24 or older at time of release""",
    },
    {
        "title": "Criminal History",
        "description": "Your legal history",
        "required_information": """1. Juvenile criminal history
    a. Were you ever arrested or charged with a crime when you were under 18 years old
        - If yes: Was your most serious arrest as a juvenile for a felony or misdemeanor
    b. Were you ever committed to Department of Youth Services as a juvenile
    c. How old were you when you were first arrested or charged with a crime
2. Adult criminal history
    a. How many prior adult felony convictions do you have
    b. How many prior commitments to prison have you had
    c. Have you ever received an official infraction for violence while incarcerated as an adult
3. Current offense and supervision history
    a. Is your current offense drug related
    b. Have you ever absconded from community supervision as an adult""",
    },
    {
        "title": "Education",
        "description": "Your education history and goals",
        "required_information": """1. Educational background and experiences
    a. Were you ever suspended or expelled from school
        - If yes: What happened and how many times
    b. What is your highest level of education completed
    c. Are you currently enrolled in any educational programs in the facility
    d. Do you plan to continue your education after release""",
    },
    {
        "title": "Employment",
        "description": "Your employment history and goals",
        "required_information": """1. Employment history and status
    a. Were you employed at the time of your arrest
        - If yes: What type of work were you doing
        - How long had you been working there
    b. Have you ever quit a job before having another one lined up
        - If yes: What were the circumstances
    c. What are your employment plans after release
    d. Do you have any job skills or training you want to develop""",
    },
    {
        "title": "Financial and Marital Status",
        "description": "Your marital status, financial history and goals",
        "required_information": """1. Marital and relationship status
    a. What is your current marital status
2. Financial situation and planning
    a. What is your financial situation and planning for after release
    b. Do you have any financial support from family or others
    c. Do you plan to apply for any financial assistance after release""",
    },
    {
        "title": "Accommodation",
        "description": "Your short term housing plan and long term goals",
        "required_information": """1. Housing and living arrangements
    a. Where did you live before entering the facility
    b. How stable was your housing situation before incarceration
    c. Do you have a place to stay immediately after release
    d. Where do you plan to live long-term after release
    e. What are your housing goals and concerns for after release""",
    },
    {
        "title": "Social Support and Family Relationships",
        "description": "Your family relationships and friendships",
        "required_information": """1. Family and social support system
    a. Do you have emotional and personal support available from family or others
    b. How satisfied are you with your current level of support from family or others
    c. Who will be your main sources of support after release
2. Relationship planning
    a. Do you have close friends or companions that you plan to spend time with after release
    b. What do you imagine your social life will look like after release
    c. Are there any relationships you want to rebuild or strengthen""",
    },
]

# Section mapping by assessment type
# Import AssessmentType dynamically to avoid circular imports
SECTIONS_BY_ASSESSMENT_TYPE = {
    "lsir": SECTIONS_ID_FACR,
    "utah_lsir": SECTIONS_UTAH_LSIR,
    "oras_rt": SECTIONS_ORAS_RT,
    "oras_pit": SECTIONS_ORAS_RT,  # Use same sections for both ORAS types
}


def get_intake_sections_for_assessment_type(
    assessment_type: str,
) -> List[Dict[str, str]]:
    """
    Get intake sections based on assessment type.

    Args:
        assessment_type: The assessment type (lsir, oras_rt, oras_pit)

    Returns:
        List of section definitions, defaults to LSIR if not found
    """
    return SECTIONS_BY_ASSESSMENT_TYPE.get(assessment_type, SECTIONS_ID_FACR)


# Special section title for completed intakes
# Not stored in DB, only used for UI organization of closing messages
COMPLETION_SECTION = "Completion"
