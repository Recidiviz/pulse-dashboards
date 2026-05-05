import asyncio
from enum import Enum
from typing import List, Optional, Set, TypeAlias

import structlog
from langsmith import traceable
from pydantic import BaseModel, Field, TypeAdapter, field_validator

from app.models.models import ResourceAssociationType
from app.utils.disallowed_resources import (
    DISALLOWED_RESOURCE_ADDRESSES,
    DISALLOWED_RESOURCE_NAMES,
)

logger = structlog.get_logger(__name__)


class ResourceOrigin(str, Enum):
    GOOGLE_PLACES = "GOOGLE_PLACES"
    FACEBOOK = "FACEBOOK"
    CRAWLER = "CRAWLER"
    LOADER = "LOADER"


# Uses the travel modes that the Google APIs need.
class TravelMode(str, Enum):
    DRIVING = "DRIVE"
    WALKING = "WALK"
    BICYCLING = "BICYCLE"
    TRANSIT = "TRANSIT"

    @classmethod
    def _missing_(cls, value):
        """Handle legacy travel mode values by normalizing to uppercase and mapping old names."""
        if not value:
            raise ValueError("Travel mode value cannot be empty or None")
        if isinstance(value, str):
            value = value.upper()
            mapping = {
                # Legacy values
                "DRIVING": cls.DRIVING,
                "WALKING": cls.WALKING,
                "BICYCLING": cls.BICYCLING,
                # Makes case insensitive matching work
                "DRIVE": cls.DRIVING,
                "WALK": cls.WALKING,
                "BICYCLE": cls.BICYCLING,
                "TRANSIT": cls.TRANSIT,
            }
            if value in mapping:
                return mapping.get(value)


class ResourceCategoryLegacy(str, Enum):
    """Resource categories"""

    BASIC_NEEDS = "Basic Needs"
    EMPLOYMENT_AND_CAREER = "Employment and Career Support"
    EDUCATION = "Education"
    BEHAVIORAL_HEALTH = "Behavioral Health Services"
    MEDICAL_AND_HEALTH = "Medical and Health Services"
    LEGAL_AND_FINANCIAL = "Legal and Financial Assistance"
    FAMILY_AND_COMMUNITY = "Family and Community Support"
    TRANSPORTATION = "Transportation"
    SPECIALIZED_SERVICES = "Specialized Services"
    COMMUNITY_REINTEGRATION = "Community and Social Reintegration"
    UNKNOWN = "Unknown"


class ResourceSubcategoryLegacy(str, Enum):
    """Resource subcategories"""

    # Basic Needs
    HOUSING = "Housing"
    FOOD_ASSISTANCE = "Food Assistance"
    CLOTHING = "Clothing"

    # Employment and Career Support
    JOB_TRAINING = "Job Training Programs"
    JOB_PLACEMENT = "Job Placement Services"
    RESUME_INTERVIEW = "Resume and Interview Support"
    CERTIFICATION = "Certification and Licensing Assistance"

    # Education
    HIGH_SCHOOL_EQUIV = "High School Equivalency Programs"
    POST_SECONDARY = "Post-Secondary Education"
    LITERACY = "Literacy Programs"
    DIGITAL_LITERACY = "Digital Literacy"

    # Behavioral Health
    MENTAL_HEALTH = "Mental Health Counseling"
    SUBSTANCE_ABUSE = "Substance Abuse Treatment"
    TRAUMA_CARE = "Trauma-Informed Care"

    # Medical and Health
    PRIMARY_CARE = "Primary Care"
    SPECIALIZED_CARE = "Specialized Care"
    ADDICTION_MEDICINE = "Addiction Medicine"
    HIV_AIDS = "HIV/AIDS and Hepatitis C Services"

    # Legal and Financial
    ID_SERVICES = "Identification Services"
    LEGAL_AID = "Legal Aid"
    FINANCIAL_LITERACY = "Financial Literacy Programs"
    EMERGENCY_FINANCIAL = "Emergency Financial Assistance"

    # Family and Community Support
    FAMILY_REUNIFICATION = "Family Reunification Services"
    MENTORSHIP = "Mentorship Programs"
    FAITH_BASED = "Faith-Based Support"
    REENTRY_GROUPS = "Reentry Support Groups"

    # Transportation
    PUBLIC_TRANSIT = "Public Transit Access"
    DRIVERS_LICENSE = "Driver's License Assistance"
    TRANSPORT_SERVICES = "Transportation Services"

    # Specialized Services
    DOMESTIC_VIOLENCE = "Domestic Violence Support"
    SEX_OFFENDER = "Sex Offender-Specific Programs"
    YOUTH_RESOURCES = "Youth-Specific Resources"
    CULTURAL_PROGRAMS = "Culturally Specific Programs"

    # Community and Social Reintegration
    VOLUNTEER = "Volunteer Opportunities"
    RECREATION = "Recreation"
    CIVIC_ENGAGEMENT = "Civic Engagement"


class ResourceCategory(str, Enum):
    HOUSING = "Housing"
    EMPLOYMENT = "Employment"
    BASIC_NEEDS = "Basic Needs"
    MENTAL_HEALTH = "Mental Health"
    SUBSTANCE_USE = "Substance Use"
    PHYSICAL_HEALTH = "Physical Health"
    LEGAL_AID = "Legal Aid & Rights Restoration"
    EDUCATION = "Education & Vocational Training"
    FAMILY = "Family Reconnection & Parenting"
    SUPPORT_INTEGRATION = "Peer Support & Community Integration"


class ResourceSubcategory(str, Enum):
    # Housing
    EMERGENCY = "Emergency housing and shelters"
    TRANSITIONAL = "Transitional housing"
    SOBER = "Sober living and recovery program"
    RENTAL = "Rental assistance"
    SUBSIDIZED = "Subsidized housing or vouchers"
    YOUTH_HOUSING = "Youth housing"

    # Employment
    SECOND_CHANCE = "Second-chance employer"
    TEMP_STAFFING = "Temporary staffing agency"
    JOB_READINESS = "Job readiness training"
    JOB_CERTIFICATION = "Job certification and licensing"

    # Basic Needs
    FOOD_ASSISTANCE = "Food assistance"
    HYGIENE = "Hygiene products"
    CLOTHING = "Second hand clothing"
    STATE_ID = "State ID, Driver's License"
    FINANCIAL_ASSISTANCE = "Financial assistance"

    # Mental Health
    THERAPY = "Therapy and counseling"
    PSYCHIATRIC = "Psychiatric care"
    TRAUMA = "Trauma-informed care"
    CRISIS = "Crisis intervention services"
    ANGER_MGMT = "Anger management"
    DOMESTIC_VIOLENCE_TX = "Domestic violence treatment"
    YOUTH_MENTAL_HEALTH = "Youth mental health services"

    # Substance Use
    DETOX = "Detoxification centers"
    INPATIENT = "Inpatient drug treatment programs"
    INTENSIVE_OUTPATIENT = "Intensive outpatient programs"
    MEDICATION_ASSISTED = "Medication-assisted treatment"
    SUBSTANCE_SUPPORT = "Substance use support"
    YOUTH_SUBSTANCE = "Youth substance use support"

    # Physical Health
    HIV_AIDS_HEP_C = "HIV/AIDS and Hepatitis C services"
    MEDICAID = "Medicaid enrollment assistance"
    COMMUNITY_CLINIC = "Community clinic"
    URGENT_CARE = "Urgent care"
    PRESCRIPTION = "Prescription assistance"
    DENTAL = "Emergency dental care"
    YOUTH_HEALTH = "Youth health care"
    PRIMARY_CARE = "Primary care"
    VETERANS_HEALTH = "Veterans health care"

    # Legal Aid & Rights Restoration
    EXPUNGEMENT = "Criminal record expungement"
    CHILD_SUPPORT = "Child support assistance"
    VOTING_RIGHTS = "Voting rights restoration"
    LEGAL_AID = "Legal aid"
    YOUTH_LEGAL = "Youth legal aid"

    # Education & Vocational Training
    GED = "GED preparation and testing"
    VOCATIONAL = "Vocational trade school programs"
    COLLEGE_REENTRY = "College re-entry programs"
    LITERACY = "Literacy programs"
    DIGITAL_LITERACY = "Digital literacy programs"
    FINANCIAL_LITERACY = "Financial literacy programs"

    # Family Reconnection & Parenting
    FAMILY_THERAPY = "Family therapy or counseling"
    PARENTING = "Parenting skills classes"
    FAMILY_SERVICES = "Family services"
    FAMILY_REUNIFICATION = "Family reunification services"
    CHILD_PROTECTIVE = "Child protective services"

    # Peer Support & Community Integration
    MENTORSHIP = "Mentorship programs"
    FAITH = "Faith-based support"
    REENTRY = "Reentry support groups"
    COMMUNITY = "Community center"
    VOLUNTEER = "Volunteer opportunities"
    CIVIC_ENGAGEMENT = "Civic engagement"
    YOUTH_COMMUNITY = "Youth community programs"


CATEGORY_SUBCATEGORY_MAP = {
    ResourceCategory.HOUSING: [
        ResourceSubcategory.EMERGENCY,
        ResourceSubcategory.TRANSITIONAL,
        ResourceSubcategory.SOBER,
        ResourceSubcategory.RENTAL,
        ResourceSubcategory.SUBSIDIZED,
        ResourceSubcategory.YOUTH_HOUSING,
    ],
    ResourceCategory.EMPLOYMENT: [
        ResourceSubcategory.SECOND_CHANCE,
        ResourceSubcategory.TEMP_STAFFING,
        ResourceSubcategory.JOB_READINESS,
        ResourceSubcategory.JOB_CERTIFICATION,
    ],
    ResourceCategory.BASIC_NEEDS: [
        ResourceSubcategory.FOOD_ASSISTANCE,
        ResourceSubcategory.HYGIENE,
        ResourceSubcategory.CLOTHING,
        ResourceSubcategory.STATE_ID,
        ResourceSubcategory.FINANCIAL_ASSISTANCE,
    ],
    ResourceCategory.MENTAL_HEALTH: [
        ResourceSubcategory.THERAPY,
        ResourceSubcategory.PSYCHIATRIC,
        ResourceSubcategory.TRAUMA,
        ResourceSubcategory.CRISIS,
        ResourceSubcategory.ANGER_MGMT,
        ResourceSubcategory.DOMESTIC_VIOLENCE_TX,
        ResourceSubcategory.YOUTH_MENTAL_HEALTH,
    ],
    ResourceCategory.SUBSTANCE_USE: [
        ResourceSubcategory.DETOX,
        ResourceSubcategory.INPATIENT,
        ResourceSubcategory.INTENSIVE_OUTPATIENT,
        ResourceSubcategory.MEDICATION_ASSISTED,
        ResourceSubcategory.SUBSTANCE_SUPPORT,
        ResourceSubcategory.YOUTH_SUBSTANCE,
    ],
    ResourceCategory.PHYSICAL_HEALTH: [
        ResourceSubcategory.HIV_AIDS_HEP_C,
        ResourceSubcategory.MEDICAID,
        ResourceSubcategory.COMMUNITY_CLINIC,
        ResourceSubcategory.URGENT_CARE,
        ResourceSubcategory.PRESCRIPTION,
        ResourceSubcategory.DENTAL,
        ResourceSubcategory.YOUTH_HEALTH,
        ResourceSubcategory.PRIMARY_CARE,
        ResourceSubcategory.VETERANS_HEALTH,
    ],
    ResourceCategory.LEGAL_AID: [
        ResourceSubcategory.EXPUNGEMENT,
        ResourceSubcategory.CHILD_SUPPORT,
        ResourceSubcategory.VOTING_RIGHTS,
        ResourceSubcategory.LEGAL_AID,
        ResourceSubcategory.YOUTH_LEGAL,
    ],
    ResourceCategory.EDUCATION: [
        ResourceSubcategory.GED,
        ResourceSubcategory.VOCATIONAL,
        ResourceSubcategory.COLLEGE_REENTRY,
        ResourceSubcategory.LITERACY,
        ResourceSubcategory.DIGITAL_LITERACY,
        ResourceSubcategory.FINANCIAL_LITERACY,
    ],
    ResourceCategory.FAMILY: [
        ResourceSubcategory.FAMILY_THERAPY,
        ResourceSubcategory.PARENTING,
        ResourceSubcategory.FAMILY_SERVICES,
        ResourceSubcategory.FAMILY_REUNIFICATION,
        ResourceSubcategory.CHILD_PROTECTIVE,
    ],
    ResourceCategory.SUPPORT_INTEGRATION: [
        ResourceSubcategory.MENTORSHIP,
        ResourceSubcategory.FAITH,
        ResourceSubcategory.REENTRY,
        ResourceSubcategory.COMMUNITY,
        ResourceSubcategory.VOLUNTEER,
        ResourceSubcategory.CIVIC_ENGAGEMENT,
        ResourceSubcategory.YOUTH_COMMUNITY,
    ],
}


# Helper functions to determine category/subcategory type
def is_category(category: str) -> bool:
    """Check if a category string belongs to the new ResourceCategory enum."""
    try:
        ResourceCategory(category)
        return True
    except ValueError:
        return False


def is_legacy_category(category: str) -> bool:
    """Check if a category string belongs to the legacy ResourceCategoryLegacy enum."""
    try:
        ResourceCategoryLegacy(category)
        return True
    except ValueError:
        return False


def is_subcategory(subcategory: str) -> bool:
    """Check if a subcategory string belongs to the new ResourceSubcategory enum."""
    try:
        ResourceSubcategory(subcategory)
        return True
    except ValueError:
        return False


def is_legacy_subcategory(subcategory: str) -> bool:
    """Check if a subcategory string belongs to the legacy ResourceSubcategoryLegacy enum."""
    try:
        ResourceSubcategoryLegacy(subcategory)
        return True
    except ValueError:
        return False


# Shared models for external API responses
class Location(BaseModel):
    latitude: float
    longitude: float


class ApiSearchResult(BaseModel):
    """Shared response model for both new and legacy external APIs."""

    # Core Information
    google_place_id: str
    name: str
    category: ResourceCategory | ResourceCategoryLegacy
    subcategory: Optional[ResourceSubcategory | ResourceSubcategoryLegacy] = None
    origin: str
    description: Optional[str] = None
    resource_id: Optional[int] = None

    @field_validator("resource_id", mode="before")
    @classmethod
    def coerce_resource_id(cls, v):
        if v is None:
            return None
        try:
            return int(v)
        except (ValueError, TypeError):
            return None

    # Location
    location: Location
    address: str

    # Contact Information
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    # External Ratings
    rating: Optional[float] = None
    rating_count: Optional[int] = None

    # Travel Information
    travel_mode: Optional[TravelMode] = None
    travel_duration_minutes: Optional[int] = None
    travel_distance_miles: Optional[float] = None


class GetPlanResourcesRequest(BaseModel):
    category: ResourceCategory = Field(description="Resource category")
    subcategory: ResourceSubcategory = Field(description="Resource subcategory")

    exclude: List[str] = Field(
        [],
        description=(
            "Keywords to exclude in the resource names, if a specific "
            "resource for one of the resource types is mentioned. For "
            "example, if the client was banned from a specific shelter."
        ),
    )


class GetResourcesRequest(BaseModel):
    category: ResourceCategory = Field(description="Resource category")
    subcategory: ResourceSubcategory = Field(description="Resource subcategory")
    address: str = Field(
        description="Full address to find resources near. (e.g. '123 Main St, Cityville, CA 12345')"
    )
    distance_miles: int = Field(
        default=100,
        description="The distance in miles from this request's address to search within.",
    )
    travel_mode: TravelMode | None = Field(
        default=None,
        description="Preferred travel mode (DRIVE, WALK, BICYCLE, TRANSIT)",
    )
    exclude_names: Optional[list[str]] = Field(
        default_factory=list, description="Keywords to exclude in resource names"
    )
    exclude_ids: Optional[list[str]] = Field(
        default_factory=list, description="List of resource IDs to exclude from results"
    )
    exclude_addresses: Optional[list[str]] = Field(
        default_factory=list, description="List of addresses to exclude from results"
    )
    limit: Optional[int] = Field(default=10, description="How many")
    use_search: bool = Field(
        default=False,
        description="If True, use /search endpoint instead of /discover for new resources",
    )
    include_physical_resources: bool = Field(
        default=True, description="Include standard community resources"
    )
    include_digital_resources: bool = Field(
        default=False, description="Include digital partner resources"
    )


class BatchGetResources(BaseModel):
    """
    Request model for fetching enriched details on a specific set of resources by ID.
    Makes a GET request to /api/v0/resources in the external resources API.

    """

    address: str = Field(description="Client address used to compute travel time/mode.")
    ids: list[int] = Field(description="IDs of resources to fetch.")
    travel_mode: TravelMode | None = Field(
        default=TravelMode.DRIVING,
        description="Preferred travel mode (DRIVE, WALK, BICYCLE, TRANSIT)",
    )


class Resource(BaseModel):
    id: str = Field(
        description="Unique identifier for the resource, currently the Google Place ID."
    )
    resource_id: Optional[int] = Field(
        default=None, description="The ID of the resource in the Resources API"
    )

    category: ResourceCategory | ResourceCategoryLegacy = Field(
        description="Category of the resource."
    )
    subcategory: Optional[ResourceSubcategory | ResourceSubcategoryLegacy] = Field(
        None, description="Subcategory of the resource."
    )

    name: str = Field(description="Name of the resource.")
    phone: Optional[str] = Field(
        default=None, description="List of phone numbers for the resource."
    )
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    address: Optional[str] = Field(
        default=None, description="Address of the resource, if available."
    )
    website: Optional[str] = Field(
        default=None, description="Website of the resource, if available."
    )
    email: Optional[str] = Field(
        default=None, description="Email to contacts if available."
    )

    score: Optional[float] = None
    # LLM Evaluation
    llm_rank: Optional[int] = None
    llm_valid: Optional[bool] = None

    # External Ratings
    rating: Optional[float] = None
    ratingCount: Optional[int] = None
    operationalStatus: Optional[str] = None
    price_level: Optional[str] = None

    transport_mode: TravelMode | None = None
    transport_minutes: int | None = None
    origin: Optional[str] = None
    travel_distance_miles: Optional[float] = None

    # Digital resource fields
    url: Optional[str] = None
    blurb: Optional[str] = None
    provider_description: Optional[str] = None

    resource_type: ResourceAssociationType = ResourceAssociationType.COMMUNITY


ResourcesList: TypeAlias = list[Resource]

ResourcesListModel = TypeAdapter(ResourcesList)


class ResourceFailureReason(Enum):
    API_ERROR = "api_error"
    NO_RESULTS_FOUND = "no_results_found"
    PARTIAL_FAILURE = "partial_failure"
    SUCCESS = "success"


class GetResourcesResponse(BaseModel):
    resources: List[Resource]
    failure_reason: Optional[ResourceFailureReason] = None
    error_message: Optional[str] = None

    def as_json(self):
        return ResourcesListModel.dump_json(self.resources).decode("utf8")


@traceable(name="fetch_resources_api")
async def list_resources(request: GetResourcesRequest) -> GetResourcesResponse:
    # Import exists here to avoid circular imports.
    # TODO: Refactor module to avoid this
    from app.services.resources.api import list_external_resources
    from app.services.resources.digital_resource_api import discover_digital_resources

    if not request.include_physical_resources and not request.include_digital_resources:
        raise ValueError(
            "At least one of include_physical_resources or include_digital_resources must be True"
        )

    tasks = []
    if request.include_physical_resources:
        tasks.append(list_external_resources(request))

    if request.include_digital_resources:
        tasks.append(discover_digital_resources(request))

    responses = await asyncio.gather(*tasks, return_exceptions=True)

    all_resources: List[Resource] = []
    had_error = False
    for resp in responses:
        if isinstance(resp, Exception):
            logger.exception("Resource fetch task failed", error=str(resp))
            had_error = True
        elif resp.failure_reason == ResourceFailureReason.API_ERROR:
            logger.error("Resource fetch task returned error", error=resp.error_message)
            had_error = True
        else:
            all_resources.extend(resp.resources)

    filtered_resources = [r for r in all_resources if resource_is_allowed(r)]

    if filtered_resources and had_error:
        failure_reason = ResourceFailureReason.PARTIAL_FAILURE
    elif filtered_resources:
        failure_reason = ResourceFailureReason.SUCCESS
    elif had_error:
        failure_reason = ResourceFailureReason.API_ERROR
    else:
        failure_reason = ResourceFailureReason.NO_RESULTS_FOUND

    return GetResourcesResponse(
        resources=filtered_resources, failure_reason=failure_reason
    )


def resource_is_allowed(
    resource: Resource,
    disallowed_names: Set[str] = DISALLOWED_RESOURCE_NAMES,
    disallowed_addresses: Set[str] = DISALLOWED_RESOURCE_ADDRESSES,
) -> bool:
    if not resource:
        return False

    # either the attribute doesn't exist, or it can exist and be null.
    # either case default to ""
    name = getattr(resource, "name", "") or ""
    address = getattr(resource, "address", "") or ""

    return (
        name.lower() not in disallowed_names
        and address.lower() not in disallowed_addresses
    )
