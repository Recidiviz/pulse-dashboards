import logging
from enum import Enum
from typing import List, Optional, Set, TypeAlias

from pydantic import BaseModel, Field, TypeAdapter, field_validator

from app.utils.disallowed_resources import (
    DISALLOWED_RESOURCE_ADDRESSES,
    DISALLOWED_RESOURCE_NAMES,
)

logger = logging.getLogger(__name__)


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


class ResourceCategory(str, Enum):
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


class ResourceSubcategory(str, Enum):
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


CATEGORY_SUBCATEGORY_MAP = {
    ResourceCategory.BASIC_NEEDS: [
        ResourceSubcategory.HOUSING,
        ResourceSubcategory.FOOD_ASSISTANCE,
        ResourceSubcategory.CLOTHING,
    ],
    ResourceCategory.EMPLOYMENT_AND_CAREER: [
        ResourceSubcategory.JOB_TRAINING,
        ResourceSubcategory.JOB_PLACEMENT,
        ResourceSubcategory.RESUME_INTERVIEW,
        ResourceSubcategory.CERTIFICATION,
    ],
    ResourceCategory.EDUCATION: [
        ResourceSubcategory.HIGH_SCHOOL_EQUIV,
        ResourceSubcategory.POST_SECONDARY,
        ResourceSubcategory.LITERACY,
        ResourceSubcategory.DIGITAL_LITERACY,
    ],
    ResourceCategory.BEHAVIORAL_HEALTH: [
        ResourceSubcategory.MENTAL_HEALTH,
        ResourceSubcategory.SUBSTANCE_ABUSE,
        ResourceSubcategory.TRAUMA_CARE,
    ],
    ResourceCategory.MEDICAL_AND_HEALTH: [
        ResourceSubcategory.PRIMARY_CARE,
        ResourceSubcategory.SPECIALIZED_CARE,
        ResourceSubcategory.ADDICTION_MEDICINE,
        ResourceSubcategory.HIV_AIDS,
    ],
    ResourceCategory.LEGAL_AND_FINANCIAL: [
        ResourceSubcategory.ID_SERVICES,
        ResourceSubcategory.LEGAL_AID,
        ResourceSubcategory.FINANCIAL_LITERACY,
        ResourceSubcategory.EMERGENCY_FINANCIAL,
    ],
    ResourceCategory.FAMILY_AND_COMMUNITY: [
        ResourceSubcategory.FAMILY_REUNIFICATION,
        ResourceSubcategory.MENTORSHIP,
        ResourceSubcategory.FAITH_BASED,
        ResourceSubcategory.REENTRY_GROUPS,
    ],
    ResourceCategory.TRANSPORTATION: [
        ResourceSubcategory.PUBLIC_TRANSIT,
        ResourceSubcategory.DRIVERS_LICENSE,
        ResourceSubcategory.TRANSPORT_SERVICES,
    ],
    ResourceCategory.SPECIALIZED_SERVICES: [
        ResourceSubcategory.DOMESTIC_VIOLENCE,
        ResourceSubcategory.SEX_OFFENDER,
        ResourceSubcategory.YOUTH_RESOURCES,
        ResourceSubcategory.CULTURAL_PROGRAMS,
    ],
    ResourceCategory.COMMUNITY_REINTEGRATION: [
        ResourceSubcategory.VOLUNTEER,
        ResourceSubcategory.RECREATION,
        ResourceSubcategory.CIVIC_ENGAGEMENT,
    ],
    ResourceCategory.UNKNOWN: [],
}


class LegacyResourceRequest(BaseModel):
    # Required Parameters
    category: ResourceCategory = Field(description="Category (e.g. 'BASIC_NEEDS')")
    address: str = Field(
        description="Full address (e.g. '123 Main St, Cityville, CA 12345')"
    )

    # Optional Parameters
    subcategory: Optional[ResourceSubcategory] = Field(
        None, description="Subcategory (e.g. 'HOUSING')"
    )
    distance_miles: int = Field(
        default=100, description="Distance in miles (default: 100)"
    )
    mode: TravelMode | None = Field(
        default=None, description="Travel mode: DRIVE, WALK, BICYCLE, TRANSIT"
    )
    limit: int = Field(default=20, description="Results limit (default: 20)")

    # Validation
    @field_validator("mode")
    def validate_mode(cls, v, info):
        if info.data.get("time") is not None and v is None:
            raise ValueError("If time is provided, mode is required")
        return v


class GetPlanResourcesRequest(BaseModel):
    category: ResourceCategory = Field(description="Resource category")
    subcategory: Optional[ResourceSubcategory] = Field(
        None, description="Resource subcategory"
    )

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
    # TODO(#10014): Have subcategory be required in the new API
    subcategory: Optional[ResourceSubcategory] = Field(
        default=None, description="Resource subcategory"
    )
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
    limit: Optional[int] = Field(default=10, description="How many")


class Resource(BaseModel):
    id: str = Field(description="Unique identifier for the resource.")

    category: ResourceCategory = Field(description="Category of the resource.")
    subcategory: Optional[ResourceSubcategory] = Field(
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


ResourcesList: TypeAlias = list[Resource]

ResourcesListModel = TypeAdapter(ResourcesList)


class ResourceFailureReason(Enum):
    API_ERROR = "api_error"
    NO_RESULTS_FOUND = "no_results_found"
    SUCCESS = "success"


class GetResourcesResponse(BaseModel):
    resources: List[Resource]
    failure_reason: Optional[ResourceFailureReason] = None
    error_message: Optional[str] = None

    def as_json(self):
        return ResourcesListModel.dump_json(self.resources).decode("utf8")


async def list_resources(request: GetResourcesRequest) -> GetResourcesResponse:
    """
    List resources based on the request parameters.
    Uses the external API if configured, otherwise falls back to built-in resources.
    In test environments, always uses built-in resources.

    Args:
        request: The resources request
        limit: Optional limit of results per resource type

    Returns:
        GetResourcesResponse with resources
    """
    # Import exists here to avoid circular imports.
    # TODO: Refactor modle to avoid this
    from app.services.resources.api import list_external_resources

    response = await list_external_resources(request)
    filtered_resources = [r for r in response.resources if resource_is_allowed(r)]
    return GetResourcesResponse(
        resources=filtered_resources,
        failure_reason=response.failure_reason
        if filtered_resources
        else ResourceFailureReason.NO_RESULTS_FOUND,
        error_message=response.error_message,
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
