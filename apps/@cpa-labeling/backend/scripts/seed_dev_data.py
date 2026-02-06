#!/usr/bin/env python3
"""
Seed development data for the labeling app.

This script populates the reentry and labeling databases with sample data
for local development and testing.

Usage:
    uv run python scripts/seed_dev_data.py
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.intake import Intake, IntakeMessage, IntakeStatus
from app.models.labeling_feedback import LabelingFeedback, SeverityLevel
from app.models.plan import Plan, PlanAsset, PlanGeneration

# Sample data
SAMPLE_INTAKES = [
    {
        "id": UUID("11111111-1111-1111-1111-111111111111"),
        "client_pseudo_id": "CLIENT_001",
        "status": IntakeStatus.COMPLETED,
        "current_section": "complete",
    },
    {
        "id": UUID("22222222-2222-2222-2222-222222222222"),
        "client_pseudo_id": "CLIENT_002",
        "status": IntakeStatus.COMPLETED,
        "current_section": "complete",
    },
    {
        "id": UUID("33333333-3333-3333-3333-333333333333"),
        "client_pseudo_id": "CLIENT_003",
        "status": IntakeStatus.COMPLETED,
        "current_section": "complete",
    },
]

SAMPLE_CONVERSATIONS = {
    UUID("11111111-1111-1111-1111-111111111111"): [
        {
            "from_role": "assistant",
            "content": "Hello! I'm here to help you create a personalized reentry plan. What's your name?",
            "section": "introduction",
        },
        {
            "from_role": "user",
            "content": "My name is John Smith.",
            "section": "introduction",
        },
        {
            "from_role": "assistant",
            "content": "Nice to meet you, John. Can you tell me about your housing situation? Do you have a place to stay when you're released?",
            "section": "housing",
        },
        {
            "from_role": "user",
            "content": "I'll be staying with my sister in Oakland for the first few months. She has a spare room.",
            "section": "housing",
        },
        {
            "from_role": "assistant",
            "content": "That's great to have family support. What about employment? Do you have any job prospects or skills you'd like to develop?",
            "section": "employment",
        },
        {
            "from_role": "user",
            "content": "I used to work in construction before. I'd like to get back into it, maybe get some certifications.",
            "section": "employment",
        },
        {
            "from_role": "assistant",
            "content": "Construction is a great field with good opportunities. Do you have any health concerns or medical needs we should address?",
            "section": "health",
        },
        {
            "from_role": "user",
            "content": "I've been managing high blood pressure. I'll need to find a doctor and get my medication refilled.",
            "section": "health",
        },
    ],
    UUID("22222222-2222-2222-2222-222222222222"): [
        {
            "from_role": "assistant",
            "content": "Welcome! Let's work together on your reentry plan. What should I call you?",
            "section": "introduction",
        },
        {
            "from_role": "user",
            "content": "Maria Rodriguez.",
            "section": "introduction",
        },
        {
            "from_role": "assistant",
            "content": "Hello Maria. Let's talk about where you'll be living. Do you have housing arranged?",
            "section": "housing",
        },
        {
            "from_role": "user",
            "content": "I'm going to a transitional housing program in San Francisco. It's a six-month program.",
            "section": "housing",
        },
        {
            "from_role": "assistant",
            "content": "Transitional housing can provide great support. What are your employment goals?",
            "section": "employment",
        },
        {
            "from_role": "user",
            "content": "I want to finish my GED first, then maybe go to community college. I'm interested in becoming a medical assistant.",
            "section": "employment",
        },
    ],
    UUID("33333333-3333-3333-3333-333333333333"): [
        {
            "from_role": "assistant",
            "content": "Hi there! I'm here to help create your reentry plan. What's your name?",
            "section": "introduction",
        },
        {
            "from_role": "user",
            "content": "James Washington.",
            "section": "introduction",
        },
        {
            "from_role": "assistant",
            "content": "Good to meet you, James. Tell me about your housing plans after release.",
            "section": "housing",
        },
        {
            "from_role": "user",
            "content": "I don't really have anywhere to go. My family isn't in the area anymore.",
            "section": "housing",
        },
        {
            "from_role": "assistant",
            "content": "I understand. We can connect you with emergency housing resources and shelters. What about work experience?",
            "section": "employment",
        },
        {
            "from_role": "user",
            "content": "I've done warehouse work, forklift operation. I have my forklift certification already.",
            "section": "employment",
        },
    ],
}

SAMPLE_SUMMARIES = {
    UUID("11111111-1111-1111-1111-111111111111"): """# Reentry Assessment Summary

## Client Information
- **Name**: John Smith
- **Assessment Date**: {date}

## Housing
John has stable housing arranged with his sister in Oakland. She has a spare room available, providing a supportive family environment during his initial transition period.

## Employment
John has previous construction experience and is interested in returning to this field. He expressed interest in obtaining additional certifications to enhance his employability. His construction background provides a solid foundation for reentry employment.

## Health & Medical
John manages high blood pressure and will need to:
- Establish care with a primary care physician
- Obtain refills for blood pressure medication
- Maintain regular medical monitoring

## Next Steps
1. Connect with construction training programs and certification courses
2. Schedule medical appointment for blood pressure management
3. Coordinate with sister regarding move-in logistics
""",
    UUID("22222222-2222-2222-2222-222222222222"): """# Reentry Assessment Summary

## Client Information
- **Name**: Maria Rodriguez
- **Assessment Date**: {date}

## Housing
Maria will be entering a six-month transitional housing program in San Francisco. This structured program will provide stability and support during her reentry period.

## Education & Employment
Maria has clear educational and career goals:
- Complete GED
- Attend community college
- Pursue career as a medical assistant

Her commitment to education demonstrates strong motivation for successful reentry.

## Next Steps
1. Enroll in GED preparation classes
2. Research community college programs and financial aid
3. Explore medical assistant training programs
4. Confirm placement in transitional housing program
""",
    UUID("33333333-3333-3333-3333-333333333333"): """# Reentry Assessment Summary

## Client Information
- **Name**: James Washington
- **Assessment Date**: {date}

## Housing
James currently lacks stable housing arrangements as his family has relocated from the area. This is a critical need requiring immediate attention.

## Employment
James has valuable work experience:
- Warehouse operations
- Forklift operation with current certification

His existing forklift certification is a significant asset for employment opportunities.

## Priority Needs
1. **Urgent**: Secure emergency/transitional housing
2. Connect with employment agencies specializing in warehouse/logistics
3. Leverage forklift certification for immediate job placement

## Next Steps
1. Contact emergency housing resources and shelters
2. Register with employment services
3. Connect with case management for ongoing support
""",
}

SAMPLE_ACTION_PLANS = {
    UUID("11111111-1111-1111-1111-111111111111"): """# Reentry Action Plan - John Smith

## Immediate Priorities (Weeks 1-2)

### Housing
- [ ] Confirm move-in date with sister
- [ ] Coordinate transportation of belongings to Oakland
- [ ] Register new address with parole officer

### Healthcare
- [ ] Schedule appointment with primary care physician
- [ ] Obtain prescription refill for blood pressure medication
- [ ] Apply for Medi-Cal if eligible

### Employment
- [ ] Update resume highlighting construction experience
- [ ] Research OSHA certification programs
- [ ] Register with local employment agencies

## Short-term Goals (Months 1-3)

### Employment & Training
- [ ] Enroll in OSHA 10 or OSHA 30 training
- [ ] Apply for construction laborer positions
- [ ] Consider apprenticeship programs with unions
- [ ] Network with former construction contacts

### Financial Stability
- [ ] Open bank account
- [ ] Create budget with sister's help
- [ ] Set up payment plan for any outstanding fines

### Health & Wellness
- [ ] Establish regular medication routine
- [ ] Monthly blood pressure monitoring
- [ ] Identify stress management resources

## Long-term Goals (Months 4-12)

### Career Development
- [ ] Complete OSHA certifications
- [ ] Pursue specialty certifications (electrical, plumbing)
- [ ] Set wage progression goals
- [ ] Explore union membership opportunities

### Independent Housing
- [ ] Save for security deposit
- [ ] Research affordable housing options
- [ ] Plan timeline for independent living

## Support Resources
- **Housing Support**: Sister (Oakland)
- **Healthcare**: County health services, Medi-Cal
- **Employment**: California EDD, Construction trade unions
- **Parole**: Regular check-ins with parole officer
""",
    UUID("22222222-2222-2222-2222-222222222222"): """# Reentry Action Plan - Maria Rodriguez

## Immediate Priorities (Weeks 1-2)

### Housing
- [ ] Confirm enrollment in transitional housing program
- [ ] Complete intake paperwork
- [ ] Attend orientation session
- [ ] Review program rules and expectations

### Education
- [ ] Contact GED program coordinators
- [ ] Schedule placement testing
- [ ] Gather required enrollment documents
- [ ] Identify study group or tutoring resources

## Short-term Goals (Months 1-3)

### Education
- [ ] Enroll in GED preparation classes
- [ ] Establish study schedule
- [ ] Schedule GED exam date
- [ ] Maintain regular attendance

### Housing Stability
- [ ] Participate in house meetings
- [ ] Complete assigned chores and responsibilities
- [ ] Engage with program case manager
- [ ] Follow all program guidelines

### Financial Planning
- [ ] Apply for educational grants/scholarships
- [ ] Research FAFSA for community college
- [ ] Create savings plan for educational expenses
- [ ] Explore part-time work opportunities compatible with studies

## Medium-term Goals (Months 4-6)

### Education Completion
- [ ] Pass all GED subject tests
- [ ] Obtain GED certificate
- [ ] Research community college programs
- [ ] Apply to community colleges offering medical assistant programs

### Career Exploration
- [ ] Job shadow medical assistants
- [ ] Volunteer at healthcare facilities
- [ ] Research certification requirements
- [ ] Connect with career counselors

## Long-term Goals (Months 7-12)

### Higher Education
- [ ] Enroll in community college
- [ ] Begin medical assistant training program
- [ ] Maintain good academic standing
- [ ] Apply for financial aid

### Independent Living
- [ ] Complete transitional housing program
- [ ] Secure permanent housing
- [ ] Build credit history
- [ ] Plan for independent living

## Support Resources
- **Housing**: Transitional housing program case manager
- **Education**: Adult education program, community college advisors
- **Career**: Workforce development centers
- **Financial**: Financial literacy programs, FAFSA assistance
""",
    UUID("33333333-3333-3333-3333-333333333333"): """# Reentry Action Plan - James Washington

## Critical Priorities (Days 1-7)

### Emergency Housing
- [ ] Contact emergency shelter services immediately
- [ ] Apply to transitional housing programs
- [ ] Register with housing assistance programs
- [ ] Maintain contact with case manager

### Basic Needs
- [ ] Locate food banks and meal programs
- [ ] Access clothing resources
- [ ] Obtain ID documents
- [ ] Register for emergency assistance

## Immediate Priorities (Weeks 1-4)

### Employment
- [ ] Update resume highlighting forklift certification
- [ ] Register with staffing agencies (warehouses, logistics)
- [ ] Apply for warehouse positions
- [ ] Verify forklift certification is current

### Housing Stability
- [ ] Continue housing search daily
- [ ] Apply to multiple transitional programs
- [ ] Explore sober living options if applicable
- [ ] Consider roommate situations

### Support Network
- [ ] Connect with reentry support groups
- [ ] Attend case management appointments
- [ ] Build local connections
- [ ] Explore faith-based support if interested

## Short-term Goals (Months 2-3)

### Employment Advancement
- [ ] Secure full-time warehouse position
- [ ] Demonstrate reliability and skills
- [ ] Seek overtime opportunities
- [ ] Request additional responsibilities

### Housing
- [ ] Move from emergency to transitional housing
- [ ] Begin saving for permanent housing
- [ ] Research shared housing options
- [ ] Build rental history

### Financial Stability
- [ ] Open bank account with first paycheck
- [ ] Create strict budget
- [ ] Pay down any debts
- [ ] Start emergency savings fund

## Long-term Goals (Months 4-12)

### Career Growth
- [ ] Renew/upgrade forklift certification
- [ ] Train on additional equipment
- [ ] Pursue warehouse supervisor roles
- [ ] Build strong employment record

### Permanent Housing
- [ ] Save for first/last month rent + deposit
- [ ] Research affordable housing programs
- [ ] Secure stable, independent housing
- [ ] Furnish basic apartment

### Stability & Growth
- [ ] Maintain steady employment
- [ ] Build credit history
- [ ] Reconnect with family when ready
- [ ] Establish community connections

## Support Resources
- **Emergency Housing**: 211 helpline, local shelters
- **Employment**: Staffing agencies, America's Job Center
- **Case Management**: Parole officer, reentry services
- **Financial**: Financial coaching, budgeting classes
- **Food**: Food banks, CalFresh benefits
""",
}


def create_reentry_engine():
    """Create engine for reentry database."""
    reentry_url = (
        f"postgresql://{settings.reentry_postgres_user}:{settings.reentry_postgres_password}"
        f"@{settings.reentry_postgres_server}:{settings.reentry_postgres_port}"
        f"/{settings.reentry_postgres_db}"
    )
    return create_engine(reentry_url)


def create_labeling_engine():
    """Create engine for labeling database."""
    labeling_url = (
        f"postgresql://{settings.labeling_postgres_user}:{settings.labeling_postgres_password}"
        f"@{settings.labeling_postgres_server}:{settings.labeling_postgres_port}"
        f"/{settings.labeling_postgres_db}"
    )
    return create_engine(labeling_url)


def create_enum_types(engine):
    """Create enum types if they don't exist."""
    with engine.connect() as conn:
        # Create intake_status_enum
        conn.execute(
            text(
                """
            DO $$ BEGIN
                CREATE TYPE intake_status_enum AS ENUM ('created', 'in_progress', 'error', 'completed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """
            )
        )
        conn.commit()


def create_reentry_tables(engine):
    """Create tables in the reentry database if they don't exist."""
    from sqlmodel import SQLModel

    # Import models to register them
    from app.models.intake import Intake, IntakeMessage
    from app.models.plan import Plan, PlanAsset, PlanGeneration

    # Create all tables
    SQLModel.metadata.create_all(engine)


def seed_reentry_data():
    """Seed the reentry database with sample data."""
    engine = create_reentry_engine()

    # Create enum types first
    create_enum_types(engine)

    # Create tables
    print("📋 Creating tables in reentry database...")
    create_reentry_tables(engine)

    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Check if data already exists
        existing_intake = session.query(Intake).first()
        if existing_intake:
            print("⚠️  Reentry database already has data. Skipping seed.")
            print("   To reseed, delete existing data first.")
            return

        print("🌱 Seeding reentry database...")

        # Seed intakes
        for intake_data in SAMPLE_INTAKES:
            intake = Intake(
                **intake_data,
                created_at=datetime.utcnow() - timedelta(days=7),
                updated_at=datetime.utcnow() - timedelta(days=7),
                completed_at=datetime.utcnow() - timedelta(days=7),
            )
            session.add(intake)
            print(f"  ✓ Created intake for {intake_data['client_pseudo_id']}")

        session.commit()

        # Seed conversations
        for intake_id, messages in SAMPLE_CONVERSATIONS.items():
            for i, msg_data in enumerate(messages):
                message = IntakeMessage(
                    id=uuid4(),
                    intake_id=intake_id,
                    created_at=datetime.utcnow() - timedelta(days=7, hours=23 - i),
                    updated_at=datetime.utcnow() - timedelta(days=7, hours=23 - i),
                    **msg_data,
                )
                session.add(message)
            print(f"  ✓ Added {len(messages)} messages for intake {intake_id}")

        session.commit()

        # Seed plans
        for intake_data in SAMPLE_INTAKES:
            intake_id = intake_data["id"]
            plan_id = uuid4()

            plan = Plan(
                id=plan_id,
                intake_id=intake_id,
                client_pseudo_id=intake_data["client_pseudo_id"],
                created_at=datetime.utcnow() - timedelta(days=6),
                updated_at=datetime.utcnow() - timedelta(days=6),
            )
            session.add(plan)

            # Add summary asset
            summary_content = SAMPLE_SUMMARIES[intake_id].format(
                date=(datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
            )
            summary_asset = PlanAsset(
                id=uuid4(),
                plan_id=plan_id,
                filename="summary.md",
                file_blob=summary_content.encode("utf-8"),
                created_at=datetime.utcnow() - timedelta(days=6),
                updated_at=datetime.utcnow() - timedelta(days=6),
            )
            session.add(summary_asset)

            # Add action plan
            plan_generation = PlanGeneration(
                id=uuid4(),
                plan_id=plan_id,
                markdown_result=SAMPLE_ACTION_PLANS[intake_id],
                finished_at=datetime.utcnow() - timedelta(days=6),
                gen_type="automated",
                created_at=datetime.utcnow() - timedelta(days=6),
                updated_at=datetime.utcnow() - timedelta(days=6),
            )
            session.add(plan_generation)

            print(f"  ✓ Created plan, summary, and action plan for {intake_data['client_pseudo_id']}")

        session.commit()
        print("✅ Reentry database seeded successfully!")

    except Exception as e:
        print(f"❌ Error seeding reentry database: {e}")
        session.rollback()
        raise
    finally:
        session.close()


def seed_labeling_data():
    """Seed the labeling database with sample feedback (optional)."""
    engine = create_labeling_engine()
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Check if data already exists
        existing_feedback = session.query(LabelingFeedback).first()
        if existing_feedback:
            print("⚠️  Labeling database already has feedback. Skipping seed.")
            return

        print("🌱 Seeding labeling database with sample feedback...")

        # Add one sample feedback
        feedback = LabelingFeedback(
            intake_id=UUID("11111111-1111-1111-1111-111111111111"),
            evaluator="dev@example.com",
            transcript_factual_severity=SeverityLevel.NONE.value,
            transcript_tone_severity=SeverityLevel.LOW.value,
            transcript_tone_notes="Could be slightly more empathetic in housing section",
            summary_factual_severity=SeverityLevel.NONE.value,
            summary_tone_severity=SeverityLevel.NONE.value,
            plan_factual_severity=SeverityLevel.NONE.value,
            plan_tone_severity=SeverityLevel.NONE.value,
            overall_notes="Good overall quality, minor tone improvement needed",
        )
        session.add(feedback)
        session.commit()

        print("  ✓ Added sample feedback for CLIENT_001")
        print("✅ Labeling database seeded successfully!")

    except Exception as e:
        print(f"❌ Error seeding labeling database: {e}")
        session.rollback()
        raise
    finally:
        session.close()


def main():
    """Main seed function."""
    print("\n" + "=" * 60)
    print("   CPA Labeling App - Development Data Seed Script")
    print("=" * 60 + "\n")

    try:
        seed_reentry_data()
        print()
        seed_labeling_data()
        print("\n" + "=" * 60)
        print("✅ All databases seeded successfully!")
        print("\n📊 Sample Data Created:")
        print("   • 3 intake conversations")
        print("   • 3 AI-generated summaries")
        print("   • 3 action plans")
        print("   • 1 sample feedback")
        print("\n🚀 You can now access the app at http://localhost:5173")
        print("=" * 60 + "\n")
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"❌ Seeding failed: {e}")
        print("=" * 60 + "\n")
        sys.exit(1)


if __name__ == "__main__":
    main()