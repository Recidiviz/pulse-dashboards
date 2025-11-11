"""
THIS FILE IS TAKEN DIRECTLY FROM HERE:
https://github.com/Recidiviz/recidiviz-resource/blob/main/core/resource_taxonomy.py
"""

from enum import Enum


class ProviderOrigin(str, Enum):
    GOOGLE = "GOOGLE"
    CRAWLER = "CRAWLER"
    CURATED = "CURATED"


class ResourceCategory(str, Enum):
    """
    Resource categories group together related ResourceSubcategory values  (and thus similar needs).
    """

    HOUSING = "Housing"
    EMPLOYMENT = "Employment"
    BASIC_NEEDS = "Basic Needs"
    MENTAL_HEALTH = "Mental Health"
    SUBSTANCE_USE = "Substance Use"
    PHYSICAL_HEALTH = "Physical Health"
    LEGAL_AID_AND_RIGHTS_RESTORATION = "Legal Aid & Rights Restoration"
    EDUCATION_AND_VOCATIONAL_TRAINING = "Education & Vocational Training"
    FAMILY_RECONNECTION_AND_PARENTING = "Family Reconnection & Parenting"
    PEER_SUPPORT_AND_COMMUNITY_INTEGRATION = "Peer Support & Community Integration"


class ResourceSubcategory(str, Enum):
    """An individual ResourceSubcategory aims to address a specific need."""

    # Housing
    EMERGENCY_HOUSING_AND_SHELTERS = "Emergency housing and shelters"
    TRANSITIONAL_HOUSING = "Transitional housing"
    SOBER_LIVING_AND_RECOVERY_PROGRAM = "Sober living and recovery program"
    RENTAL_ASSISTANCE = "Rental assistance"
    SUBSIDIZED_HOUSING_OR_VOUCHERS = "Subsidized housing or vouchers"
    YOUTH_HOUSING = "Youth housing"

    # Employment
    SECOND_CHANCE_EMPLOYER = "Second-chance employer"
    TEMPORARY_STAFFING_AGENCY = "Temporary staffing agency"
    JOB_READINESS_TRAINING = "Job readiness training"
    JOB_CERTIFICATION_AND_LICENSING = "Job certification and licensing"

    # Basic Needs
    FOOD_ASSISTANCE = "Food assistance"
    HYGIENE_PRODUCTS = "Hygiene products"
    SECOND_HAND_CLOTHING = "Second hand clothing"
    STATE_ID_DRIVERS_LICENSE = "State ID, Driver's License"
    FINANCIAL_ASSISTANCE = "Financial assistance"

    # Mental Health
    THERAPY_AND_COUNSELING = "Therapy and counseling"
    PSYCHIATRIC_CARE = "Psychiatric care"
    TRAUMA_INFORMED_CARE = "Trauma-informed care"
    CRISIS_INTERVENTION_SERVICES = "Crisis intervention services"
    ANGER_MANAGEMENT = "Anger management"
    DOMESTIC_VIOLENCE_TREATMENT = "Domestic violence treatment"
    YOUTH_MENTAL_HEALTH_SERVICES = "Youth mental health services"

    # Substance Use
    DETOXIFICATION_CENTERS = "Detoxification centers"
    INPATIENT_DRUG_TREATMENT_PROGRAMS = "Inpatient drug treatment programs"
    INTENSIVE_OUTPATIENT_PROGRAMS = "Intensive outpatient programs"
    MEDICATION_ASSISTED_TREATMENT = "Medication-assisted treatment"
    SUBSTANCE_USE_SUPPORT = "Substance use support"
    YOUTH_SUBSTANCE_USE_SUPPORT = "Youth substance use support"

    # Physical Health
    HIV_AIDS_AND_HEPATITIS_C_SERVICES = "HIV/AIDS and Hepatitis C services"
    MEDICAID_ENROLLMENT_ASSISTANCE = "Medicaid enrollment assistance"
    COMMUNITY_CLINIC = "Community clinic"
    URGENT_CARE = "Urgent care"
    PRESCRIPTION_ASSISTANCE = "Prescription assistance"
    EMERGENCY_DENTAL_CARE = "Emergency dental care"
    YOUTH_HEALTH_CARE = "Youth health care"
    PRIMARY_CARE = "Primary care"
    VETERANS_HEALTH_CARE = "Veterans health care"

    # Legal Aid & Rights Restoration
    CRIMINAL_RECORD_EXPUNGEMENT = "Criminal record expungement"
    CHILD_SUPPORT_ASSISTANCE = "Child support assistance"
    VOTING_RIGHTS_RESTORATION = "Voting rights restoration"
    LEGAL_AID = "Legal aid"
    YOUTH_LEGAL_AID = "Youth legal aid"

    # Education & Vocational Training
    GED_PREPARATION_AND_TESTING = "GED preparation and testing"
    VOCATIONAL_TRADE_SCHOOL_PROGRAMS = "Vocational trade school programs"
    COLLEGE_REENTRY_PROGRAMS = "College re-entry programs"
    LITERACY_PROGRAMS = "Literacy programs"
    DIGITAL_LITERACY_PROGRAMS = "Digital literacy programs"
    FINANCIAL_LITERACY_PROGRAMS = "Financial literacy programs"

    # Family Reconnection & Parenting
    FAMILY_THERAPY_OR_COUNSELING = "Family therapy or counseling"
    PARENTING_SKILLS_CLASSES = "Parenting skills classes"
    FAMILY_SERVICES = "Family services"
    FAMILY_REUNIFICATION_SERVICES = "Family reunification services"
    CHILD_PROTECTIVE_SERVICES = "Child protective services"

    # Peer Support & Community Integration
    MENTORSHIP_PROGRAMS = "Mentorship programs"
    FAITH_BASED_SUPPORT = "Faith-based support"
    REENTRY_SUPPORT_GROUPS = "Reentry support groups"
    COMMUNITY_CENTER = "Community center"
    VOLUNTEER_OPPORTUNITIES = "Volunteer opportunities"
    CIVIC_ENGAGEMENT = "Civic engagement"
    YOUTH_COMMUNITY_PROGRAMS = "Youth community programs"


CATEGORY_SUBCATEGORY_MAP: dict[ResourceCategory, list[ResourceSubcategory]] = {
    ResourceCategory.HOUSING: [
        ResourceSubcategory.EMERGENCY_HOUSING_AND_SHELTERS,
        ResourceSubcategory.TRANSITIONAL_HOUSING,
        ResourceSubcategory.SOBER_LIVING_AND_RECOVERY_PROGRAM,
        ResourceSubcategory.RENTAL_ASSISTANCE,
        ResourceSubcategory.SUBSIDIZED_HOUSING_OR_VOUCHERS,
        ResourceSubcategory.YOUTH_HOUSING,
    ],
    ResourceCategory.EMPLOYMENT: [
        ResourceSubcategory.SECOND_CHANCE_EMPLOYER,
        ResourceSubcategory.TEMPORARY_STAFFING_AGENCY,
        ResourceSubcategory.JOB_READINESS_TRAINING,
        ResourceSubcategory.JOB_CERTIFICATION_AND_LICENSING,
    ],
    ResourceCategory.BASIC_NEEDS: [
        ResourceSubcategory.FOOD_ASSISTANCE,
        ResourceSubcategory.HYGIENE_PRODUCTS,
        ResourceSubcategory.SECOND_HAND_CLOTHING,
        ResourceSubcategory.STATE_ID_DRIVERS_LICENSE,
        ResourceSubcategory.FINANCIAL_ASSISTANCE,
    ],
    ResourceCategory.MENTAL_HEALTH: [
        ResourceSubcategory.THERAPY_AND_COUNSELING,
        ResourceSubcategory.PSYCHIATRIC_CARE,
        ResourceSubcategory.TRAUMA_INFORMED_CARE,
        ResourceSubcategory.CRISIS_INTERVENTION_SERVICES,
        ResourceSubcategory.ANGER_MANAGEMENT,
        ResourceSubcategory.DOMESTIC_VIOLENCE_TREATMENT,
        ResourceSubcategory.YOUTH_MENTAL_HEALTH_SERVICES,
    ],
    ResourceCategory.SUBSTANCE_USE: [
        ResourceSubcategory.DETOXIFICATION_CENTERS,
        ResourceSubcategory.INPATIENT_DRUG_TREATMENT_PROGRAMS,
        ResourceSubcategory.INTENSIVE_OUTPATIENT_PROGRAMS,
        ResourceSubcategory.MEDICATION_ASSISTED_TREATMENT,
        ResourceSubcategory.SUBSTANCE_USE_SUPPORT,
        ResourceSubcategory.YOUTH_SUBSTANCE_USE_SUPPORT,
    ],
    ResourceCategory.PHYSICAL_HEALTH: [
        ResourceSubcategory.HIV_AIDS_AND_HEPATITIS_C_SERVICES,
        ResourceSubcategory.MEDICAID_ENROLLMENT_ASSISTANCE,
        ResourceSubcategory.COMMUNITY_CLINIC,
        ResourceSubcategory.URGENT_CARE,
        ResourceSubcategory.PRESCRIPTION_ASSISTANCE,
        ResourceSubcategory.EMERGENCY_DENTAL_CARE,
        ResourceSubcategory.YOUTH_HEALTH_CARE,
        ResourceSubcategory.PRIMARY_CARE,
        ResourceSubcategory.VETERANS_HEALTH_CARE,
    ],
    ResourceCategory.LEGAL_AID_AND_RIGHTS_RESTORATION: [
        ResourceSubcategory.CRIMINAL_RECORD_EXPUNGEMENT,
        ResourceSubcategory.CHILD_SUPPORT_ASSISTANCE,
        ResourceSubcategory.VOTING_RIGHTS_RESTORATION,
        ResourceSubcategory.LEGAL_AID,
        ResourceSubcategory.YOUTH_LEGAL_AID,
    ],
    ResourceCategory.EDUCATION_AND_VOCATIONAL_TRAINING: [
        ResourceSubcategory.GED_PREPARATION_AND_TESTING,
        ResourceSubcategory.VOCATIONAL_TRADE_SCHOOL_PROGRAMS,
        ResourceSubcategory.COLLEGE_REENTRY_PROGRAMS,
        ResourceSubcategory.LITERACY_PROGRAMS,
        ResourceSubcategory.DIGITAL_LITERACY_PROGRAMS,
        ResourceSubcategory.FINANCIAL_LITERACY_PROGRAMS,
    ],
    ResourceCategory.FAMILY_RECONNECTION_AND_PARENTING: [
        ResourceSubcategory.FAMILY_THERAPY_OR_COUNSELING,
        ResourceSubcategory.PARENTING_SKILLS_CLASSES,
        ResourceSubcategory.FAMILY_SERVICES,
        ResourceSubcategory.FAMILY_REUNIFICATION_SERVICES,
        ResourceSubcategory.CHILD_PROTECTIVE_SERVICES,
    ],
    ResourceCategory.PEER_SUPPORT_AND_COMMUNITY_INTEGRATION: [
        ResourceSubcategory.MENTORSHIP_PROGRAMS,
        ResourceSubcategory.FAITH_BASED_SUPPORT,
        ResourceSubcategory.REENTRY_SUPPORT_GROUPS,
        ResourceSubcategory.COMMUNITY_CENTER,
        ResourceSubcategory.VOLUNTEER_OPPORTUNITIES,
        ResourceSubcategory.CIVIC_ENGAGEMENT,
        ResourceSubcategory.YOUTH_COMMUNITY_PROGRAMS,
    ],
}


def validate_categorization(
    category: ResourceCategory, subcategory: ResourceSubcategory
) -> None:
    """Check if a subcategory is valid for a category"""

    if category not in list(ResourceCategory):
        raise ValueError(
            f"Invalid category '{category}'. Possible values: {list(ResourceCategory)}"
        )
    if subcategory not in list(ResourceSubcategory):
        raise ValueError(
            f"Invalid subcategory '{subcategory}'. Possible values: {list(ResourceSubcategory)}"
        )
    valid_subcategories = CATEGORY_SUBCATEGORY_MAP[category]
    if subcategory not in valid_subcategories:
        raise ValueError(
            f"Subcategory '{subcategory}' is not valid for category '{category}'. Valid subcategories are: {valid_subcategories}"
        )
