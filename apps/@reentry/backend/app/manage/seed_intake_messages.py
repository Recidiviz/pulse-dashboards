"""
Script to seed intake messages for demo purposes.
"""

from sqlalchemy import text
from sqlmodel import select

from app.core.db import AsyncSession, get_session_async_manager
from app.models.intake import (
    ClientIntakeSection,
    Intake,
    IntakeMessage,
    IntakeMessageRole,
    IntakeSection,
)
from app.utils.intake.constants import SECTIONS_LSIR, CompletionStatus, IntakeStatus

from .base import cli


@cli.command()
async def seed_intake_messages():
    """
    Seeds intake conversations for all clients.
    """
    async with get_session_async_manager() as session:
        # Create intakes for all clients
        await create_client_intake_messages(
            session, "CLIENT-001", IntakeStatus.COMPLETED
        )
        await create_client_intake_messages(
            session, "CLIENT-002", IntakeStatus.COMPLETED
        )
        await create_client_intake_messages(
            session, "CLIENT-003", IntakeStatus.COMPLETED
        )
        await create_client_intake_messages(
            session, "CLIENT-004", IntakeStatus.COMPLETED
        )
        await create_client_intake_messages(
            session,
            "CLIENT-005",
            IntakeStatus.IN_PROGRESS,
            current_section="Alcohol and Drug Use",
        )
        await create_client_intake_messages(
            session,
            "CLIENT-006",
            IntakeStatus.PAUSED,
            current_section="Alcohol and Drug Use",
        )
        await create_client_intake_messages(session, "CLIENT-007", IntakeStatus.CREATED)
        await create_client_intake_messages(
            session, "CLIENT-008", IntakeStatus.COMPLETED
        )
        await create_client_intake_messages(
            session, "CLIENT-009", IntakeStatus.COMPLETED
        )
        await create_client_intake_messages(
            session, "CLIENT-010", IntakeStatus.COMPLETED
        )

        print("All client intake conversations created successfully")


async def create_client_intake_messages(
    session: AsyncSession,
    client_pseudo_id: str,
    status: IntakeStatus,
    current_section: str = None,
):
    """Create a set of intake messages for a client based on their ID."""
    print(f"Creating intake conversation for client {client_pseudo_id}...")

    # Check if this client already has an intake
    existing_intake = await session.exec(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    intake = existing_intake.first()

    if not intake:
        print(f"Creating new intake for client {client_pseudo_id}")
        # Create intake record
        intake = Intake(
            client_pseudo_id=client_pseudo_id,
            status=status.value,
            current_section=current_section,
        )
        session.add(intake)
        await session.flush()
    else:
        print(f"Using existing intake for client {client_pseudo_id}: {intake.id}")

        # Update intake status and current section
        intake.status = status.value
        intake.current_section = current_section
        session.add(intake)
        await session.flush()

    # Get current section order if specified
    current_section_order = None
    if current_section:
        current_section_result = await session.exec(
            select(IntakeSection.order).where(
                IntakeSection.title == current_section,
                IntakeSection.assessment_type == "lsir",
            )
        )
        current_section_order = current_section_result.first()

    # Create or update sections for this intake
    for section_info in SECTIONS_LSIR:
        print(f"Finding section: {section_info['title']}")

        # Get the section definition
        section_definition_result = await session.exec(
            select(IntakeSection).where(
                IntakeSection.title == section_info["title"],
                IntakeSection.assessment_type == "lsir",
            )
        )
        section_definition = section_definition_result.first()

        if not section_definition:
            print(f"Section definition not found for {section_info['title']}")
            continue

        # Check if client section already exists
        existing_section_result = await session.exec(
            select(ClientIntakeSection).where(
                ClientIntakeSection.intake_id == intake.id,
                ClientIntakeSection.intake_section_id == section_definition.id,
            )
        )
        existing_section = existing_section_result.first()

        # Set completion status based on intake status
        completion_status = CompletionStatus.NOT_STARTED.value

        if status == IntakeStatus.COMPLETED:
            completion_status = CompletionStatus.COMPLETED.value
        elif status == IntakeStatus.IN_PROGRESS:
            # If this is the current section, mark as in progress
            if section_info["title"] == current_section:
                completion_status = CompletionStatus.IN_PROGRESS.value
            # If we're past this section (lower order), mark as completed
            elif (
                current_section_order is not None
                and section_definition.order < current_section_order
            ):
                completion_status = CompletionStatus.COMPLETED.value

        if not existing_section:
            print(f"Creating client section: {section_info['title']}")
            client_section = ClientIntakeSection(
                intake_id=intake.id,
                intake_section_id=section_definition.id,
                is_active=True,
                completion_status=completion_status,
            )
            session.add(client_section)
        else:
            # Update existing section's completion status
            print(f"Updating client section: {section_info['title']}")
            existing_section.completion_status = completion_status
            session.add(existing_section)

    # Add messages for each section based on client ID
    messages = get_client_messages(client_pseudo_id)

    # Don't add messages for created status (new intake)
    if status != IntakeStatus.CREATED:
        # Store messages for each section
        for section_title, section_messages in messages.items():
            print(f"Adding messages for section: {section_title}")

            # Find section definition to get its order
            section_result = await session.exec(
                select(IntakeSection).where(IntakeSection.title == section_title)
            )
            section = section_result.first()

            if not section:
                print(f"Section not found: {section_title}")
                continue

            # Skip sections based on intake status
            if (
                status == IntakeStatus.IN_PROGRESS
                and section_title == current_section
                and client_pseudo_id == "CLIENT-005"
            ):
                # For in-progress intakes, only add caseworker message for current section
                add_messages = section_messages[:1]
            elif (
                status == IntakeStatus.IN_PROGRESS
                and section_title == current_section
                and client_pseudo_id == "CLIENT-006"
            ):
                # For what was previously paused intakes, add up to the caseworker's last question
                add_messages = section_messages
            elif (
                status == IntakeStatus.IN_PROGRESS
                and current_section_order is not None
                and section.order >= current_section_order
                and section_title != current_section
            ):
                # Skip sections we haven't reached yet
                continue
            else:
                add_messages = section_messages

            # Clear existing messages for this section if any
            await session.exec(
                text(
                    f"DELETE FROM intakemessage WHERE intake_id = '{intake.id}' AND section = '{section_title}'"
                )
            )

            # Add messages for this section
            for msg in add_messages:
                message = IntakeMessage(
                    intake_id=intake.id,
                    from_role=msg["role"].value,
                    content=msg["content"],
                    section=section_title,
                )
                session.add(message)

    await session.commit()
    print(f"Successfully created intake conversation for client {client_pseudo_id}")


def get_client_messages(client_pseudo_id: str) -> dict:
    """Return conversation messages for a specific client."""
    # Default messages dictionary for all clients
    default_messages = {
        "Employment": [
            {
                "role": IntakeMessageRole.CASEWORKER,
                "content": "Let's talk about your education and employment background. Can you tell me about your education level and any job experience you have?",
            },
            {
                "role": IntakeMessageRole.CLIENT,
                "content": "I graduated high school and did some college before I had to stop for financial reasons. I've worked in various jobs, mostly in retail and customer service.",
            },
        ],
        "Education": [
            {
                "role": IntakeMessageRole.CASEWORKER,
                "content": "What's your highest level of education and do you have any plans for continuing your education?",
            },
            {
                "role": IntakeMessageRole.CLIENT,
                "content": "I have a high school diploma and some college credits. I'd be interested in completing my degree or getting vocational training if the opportunity arises.",
            },
        ],
        "Criminal History": [
            {
                "role": IntakeMessageRole.CASEWORKER,
                "content": "I need to ask about your criminal history. Can you share what led to your current involvement with the system?",
            },
            {
                "role": IntakeMessageRole.CLIENT,
                "content": "I made a mistake and got involved with the wrong people. It was a non-violent offense, and I've learned my lesson. I'm committed to staying on the right path now.",
            },
        ],
        "Financial": [
            {
                "role": IntakeMessageRole.CASEWORKER,
                "content": "Let's discuss your financial situation. What's your current source of income and any financial goals you have?",
            },
            {
                "role": IntakeMessageRole.CLIENT,
                "content": "I'm working part-time right now, but it's not enough to cover all my expenses. I'm looking for full-time work and trying to budget carefully in the meantime.",
            },
        ],
        "Family and Marital Relationships": [
            {
                "role": IntakeMessageRole.CASEWORKER,
                "content": "Can you tell me about your family situation? Are you married or do you have children?",
            },
            {
                "role": IntakeMessageRole.CLIENT,
                "content": "I'm not married, no kids. I have a supportive relationship with my parents and siblings. They've been there for me throughout this process.",
            },
        ],
        "Accommodation": [
            {
                "role": IntakeMessageRole.CASEWORKER,
                "content": "What's your current housing situation?",
            },
            {
                "role": IntakeMessageRole.CLIENT,
                "content": "I'm staying with family right now. It's stable and safe, but I'd like to find my own place eventually when I can afford it.",
            },
        ],
        "Leisure and Recreation": [
            {
                "role": IntakeMessageRole.CASEWORKER,
                "content": "What do you like to do in your free time?",
            },
            {
                "role": IntakeMessageRole.CLIENT,
                "content": "I enjoy reading, watching movies, and spending time outdoors. I've been trying to focus on healthy activities like hiking and exercising regularly.",
            },
        ],
        "Companions": [
            {
                "role": IntakeMessageRole.CASEWORKER,
                "content": "Who do you spend time with these days? Tell me about your social circle.",
            },
            {
                "role": IntakeMessageRole.CLIENT,
                "content": "I've been distancing myself from negative influences and reconnecting with old friends who are on a good path. I'm also trying to make new friends through work and community activities.",
            },
        ],
        "Alcohol and Drug Use": [
            {
                "role": IntakeMessageRole.CASEWORKER,
                "content": "Do you currently use alcohol or drugs? It's important to be honest about this.",
            },
            {
                "role": IntakeMessageRole.CLIENT,
                "content": "I drink occasionally in social situations, but I don't use drugs. I'm very careful about not letting substances interfere with my responsibilities.",
            },
        ],
    }

    # Client-specific messages
    client_messages = {
        "CLIENT-001": {
            "Employment": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Let's discuss your education and employment background. What's your highest level of education and your current job situation?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I have a bachelor's degree in psychology. Currently working as an administrative assistant at a local clinic, but I'm hoping to move into counseling eventually.",
                },
            ],
            "Criminal History": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "I need to ask about your criminal history. Can you tell me what led to your involvement with the system?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I was charged with fraud after getting involved in a scheme a friend set up. I didn't fully understand what I was participating in at first, but I take responsibility for not asking more questions.",
                },
            ],
            "Financial": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "How would you describe your current financial situation?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm stable but tight on money. My job covers my basic expenses, and I'm putting a little aside each month for school. I have some student loans but no other major debt.",
                },
            ],
        },
        "CLIENT-002": {
            "Employment": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Tell me about your education and current employment situation.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I completed high school and have a certification in medical coding. I've been working at a hospital in records management for about five years. It's a good, stable job.",
                },
            ],
            "Family and Marital Relationships": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What's your family situation like?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm married with two children, ages 8 and 10. My spouse is very supportive, and we have a strong family unit. My parents also live nearby and help with childcare.",
                },
            ],
            "Alcohol and Drug Use": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Have you had any issues with alcohol or drugs?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I had problems with alcohol in the past, which contributed to my legal issues. I've been sober for 18 months now and attend weekly support group meetings.",
                },
            ],
        },
        "CLIENT-003": {
            "Employment": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Let's talk about your education and work experience.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I have a GED and some technical training in construction. I've worked mainly in construction and as a mechanic. Recently lost my job due to downsizing but actively looking for new opportunities.",
                },
            ],
            "Accommodation": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What is your current housing situation?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm currently staying with a friend temporarily. It's not ideal, but it's safe. I'm on a waiting list for affordable housing and hope to get my own place within a few months.",
                },
            ],
        },
        "CLIENT-004": {
            "Employment": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Tell me about your education and work background.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I have an associate's degree in business. I've been working in retail management for about 10 years, currently as an assistant manager at a department store.",
                },
            ],
            "Companions": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Who do you spend time with? Tell me about your social connections.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I have a small circle of close friends I've known since college. I'm also active in my community through volunteer work at the local food bank. I find that helping others keeps me positive.",
                },
            ],
        },
        "CLIENT-005": {
            "Employment": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Let's talk about your education and employment. What's your background in these areas?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I have a master's degree in engineering and worked for a large tech company for 15 years. Recently laid off due to company restructuring, but I have good prospects and savings to tide me over.",
                },
            ],
            "Criminal History": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Can you tell me about your criminal history?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "It was a white-collar issue related to some financial reporting at my company. I got caught up in it even though I wasn't the primary person responsible. This is my first and only offense.",
                },
            ],
            "Financial": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "How would you describe your financial situation?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "Despite the job loss, I'm financially secure. I have significant savings, investments, and a pension from my years at the company. I own my home with a small mortgage remaining.",
                },
            ],
            "Family and Marital Relationships": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Tell me about your family situation.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm divorced with two adult children who live in different states. We maintain good relationships and talk regularly. My ex-spouse and I are on amicable terms as well.",
                },
            ],
            "Accommodation": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What is your current housing situation?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I own my home in a nice suburban neighborhood. It's a four-bedroom house that I've lived in for about 20 years, almost paid off.",
                },
            ],
            "Leisure and Recreation": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What do you enjoy doing in your free time?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm an avid golfer and belong to a local club. I also enjoy reading, particularly history and biographies. Since the job change, I've been taking some time to travel and visit my children.",
                },
            ],
            "Alcohol and Drug Use": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Do you use alcohol or drugs?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I drink socially, maybe a glass of wine with dinner or when out with friends. No drug use, and alcohol has never been a problem for me.",
                },
            ],
            "Companions": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Tell me about your social network.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I have a solid group of friends from work, my golf club, and my neighborhood. I'm also involved with a professional engineering society that provides good networking opportunities.",
                },
            ],
        },
        "CLIENT-006": {
            "Employment": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Tell me about your education and employment history.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I dropped out of high school but got my GED later. I've mostly worked in food service, currently as a cook at a local restaurant. The hours are inconsistent though.",
                },
            ],
            "Criminal History": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What can you tell me about your criminal history?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I've had a few minor offenses - mostly related to when I was using drugs. This latest charge was for possession, but I'm in recovery now and committed to staying clean.",
                },
            ],
            "Education": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What's your educational background? Do you have any plans for continuing education?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I got my GED after dropping out of high school. I'd be interested in some vocational training if I can find the right program and afford it.",
                },
            ],
            "Financial": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Let's talk about your financial situation. What's your current income and expenses like?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "It's pretty tight. My cooking job pays just above minimum wage, and hours vary weekly. I have some debt from medical bills and back rent from when I was using.",
                },
            ],
            "Family and Marital Relationships": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Can you tell me about your family situation and relationships?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm single, no kids. My relationship with my family has been strained because of my addiction issues, but we're slowly rebuilding trust.",
                },
            ],
            "Accommodation": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What's your current housing situation?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm staying in a sober living house right now. It's helping me stay focused on my recovery and gives me structure.",
                },
            ],
            "Leisure and Recreation": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What do you like to do in your free time?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm trying to find healthy activities. I've started going to the gym and I like cooking when I'm not at work. Keeps my mind occupied.",
                },
            ],
            "Companions": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Tell me about your social circle and the people you spend time with.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I've had to distance myself from old friends who were still using. Most of my social time now is with people from my recovery program and some coworkers.",
                },
            ],
        },
        "CLIENT-008": {
            "Employment": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Let's discuss your education and work experience.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I have a nursing degree and worked as an RN for 12 years before my license was suspended due to my legal issues. I'm currently working as a medical office receptionist while I work on getting reinstated.",
                },
            ],
        },
        "CLIENT-009": {
            "Employment": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Tell me about your education and current job.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I have a vocational certificate in welding and have worked in manufacturing for about 15 years. Currently employed full-time at an auto parts factory with good benefits.",
                },
            ],
            "Family and Marital Relationships": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What's your family situation like?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm a single parent with custody of my two teenagers. It's challenging but rewarding. Their other parent isn't in the picture, but we have support from my parents who live nearby.",
                },
            ],
        },
        "CLIENT-010": {
            "Employment": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "Let's talk about your education and work background.",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I have a bachelor's degree in business. I recently started my own small online business selling handmade crafts. It's growing slowly but steadily.",
                },
            ],
            "Accommodation": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What is your housing situation currently?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I rent an apartment in a good neighborhood. It's affordable and close to public transportation, which is important since I don't own a car.",
                },
            ],
            "Leisure and Recreation": [
                {
                    "role": IntakeMessageRole.CASEWORKER,
                    "content": "What do you enjoy doing in your free time?",
                },
                {
                    "role": IntakeMessageRole.CLIENT,
                    "content": "I'm very creative - I do crafting for my business but also as a hobby. I enjoy yoga and meditation too, which help me stay centered. I volunteer at an animal shelter on weekends.",
                },
            ],
        },
    }

    # Start with the default messages
    result = default_messages.copy()

    # Update with client-specific messages if available
    if client_pseudo_id in client_messages:
        for section, messages in client_messages[client_pseudo_id].items():
            result[section] = messages

    return result


@cli.command()
async def clear_intake_messages():
    """
    Clear all intake messages from the database (for reset/testing).
    """
    async with get_session_async_manager() as session:
        await session.execute(text("DELETE FROM intakemessage"))
        await session.commit()
        print("Cleared all intake messages from database")
