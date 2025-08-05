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


SECTIONS_LSIR = [
    {
        "title": "Employment",
        "description": "Your employment history and goals",
        "required_information": """1. If the client is currently employed
    a. If yes:
        - What type of work they are doing
        - How many hours per week they are working
        - How they like their job and anyone they work with
2. If the client is planning to work after release
    a. If yes:
        - Were they working before entering the facility
        - What type of work were they doing before entering the facility
        - What type of work they are looking for after they are released
        - How many hours per week they are looking to work
        - Will they be returning the job they had before entering the facility
        - optional: Do they have any specific goals or aspirations for the work they are looking for
    b. If no:
        - Are they receiving any social security or disability benefits
        - Or are they planning to be a homemaker
        - Or are they planning to go to school""",
    },
    {
        "title": "Education",
        "description": "Your education history and goals",
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
        "description": "Your financial history and goals",
        "required_information": """1. Does the client plan to apply for any financial assistance after release
    a. If yes:
        - What type of financial assistance they are planning to apply for, such as food stamps or unemployment benefits
2. If they have any specific goals for their finances""",
    },
    {
        "title": "Family and Marital Relationships",
        "description": "Your family relationships",
        "required_information": """1. Does the client have a partner, spouse, or long-term partner.
2. Do they have strong, positive relationships with their parents
3. Do they have strong, positive relationships with their other family members""",
    },
    {
        "title": "Accommodation",
        "description": "Your short term housing plan and long term goals",
        "required_information": """1. Where did they live before entering the facility
2. Do they have a place to stay immediately after release
3. Where do they plan to live long-term after release, and is it the same as the place they lived before or the place they plan to stay immediately after release
4. What are their goals related to housing after release""",
    },
    {
        "title": "Leisure and Recreation",
        "description": "How you like to spend your free time.",
        "required_information": """1. What were their hobbies and interests before entering the facility
2. Do you have any hobbies or activities that they enjoy doing in the facility
3. Do they have any hobbies or interests that they would like to pursue after release""",
    },
    {
        "title": "Companions",
        "description": "The status of your friendships",
        "required_information": """1. Do you have any close friends or companions that you plan to spend time with after release
2. What they imagine their social life will look like after release""",
    },
    {
        "title": "Alcohol and Drug Use",
        "description": "Your relationship with alcohol and drugs",
        "required_information": """1. Will you require any support or resources related to alcohol or drug use after release
    a. If yes:
        - What type of support they think would be helpful (like counseling, support groups, medical assistance)
        - Have they received treatment or support for substance use before
    b. If no:
        - Confirm they feel confident managing without additional support
2. Ask this question even if the client seems reluctant - it's important for their safety and planning""",
    },
]

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
    "lsir": SECTIONS_LSIR,
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
    return SECTIONS_BY_ASSESSMENT_TYPE.get(assessment_type, SECTIONS_LSIR)


# Special section title for completed intakes
# Not stored in DB, only used for UI organization of closing messages
COMPLETION_SECTION = "Completion"
