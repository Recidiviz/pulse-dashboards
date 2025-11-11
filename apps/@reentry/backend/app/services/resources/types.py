from enum import Enum
from typing import Optional, TypeAlias

from pydantic import BaseModel, Field, TypeAdapter

from app.services.resources.resource_taxonomy import (
    ResourceCategory,
    ResourceSubcategory,
)


class TravelMode(str, Enum):
    """
    Supported travel modes for calculating distance and duration to resources.
    """

    DRIVE = "DRIVE"
    WALK = "WALK"
    BICYCLE = "BICYCLE"
    TRANSIT = "TRANSIT"


class GetPlanResourcesRequest(BaseModel):
    category: ResourceCategory
    subcategory: ResourceSubcategory
    exclude: list[str] = Field(
        default_factory=list,
        description=(
            "Keywords to exclude in the resource names, if a specific "
            "resource for one of the resource types is mentioned. For "
            "example, if the client was banned from a specific shelter."
        ),
    )


# TODO(#10014): This class can be deprecated
#
# Not doing a docstring as the LLM may pull information from that.
# This is data from the 'client_extracted_info' field of the Plan
# DB model, which is JSON when in the DB and a dict in pydantic.
class ClientExtractedInfo(BaseModel):
    home: str | None = Field(
        default=None,
        description="Client's home address, which can be a full address (preferred), a zip code, or a landmark.",
    )

    work: str | None = Field(
        default=None,
        description="Client's work address, which can be a full address (preferred), a zip code, or a landmark.",
    )

    school: str | None = Field(
        default=None,
        description="Client's school address, which can be a full address (preferred), a zip code, or a landmark.",
    )

    probation_office: str | None = Field(
        default=None,
        description=(
            "Client's probation office address, which can be a full address (preferred), "
            "a zip code, or a landmark."
        ),
    )

    can_drive: bool | None = Field(
        default=False, description="Whether the client has a car"
    )

    can_walk: bool | None = Field(
        default=True, description="Whether the client can comfortably walk"
    )

    can_bike: bool | None = Field(
        default=False, description="Whether the client has a bike"
    )

    transit_pass: bool | None = Field(
        default=False, description="Whether the client has a transit pass"
    )


class GetResourcesRequest(BaseModel):
    category: ResourceCategory = Field(description="Resource category")
    subcategory: ResourceSubcategory = Field(description="Resource subcategory")
    address: str = Field(
        description="Location from which we search for resources. Either a full address (e.g. '123 Main St, Cityville, CA 12345'), or a locale (Chicago, IL). A value that cannot be geocoded will result in a HTTP_422_UNPROCESSABLE_ENTITY response."
    )
    distance_miles: int = Field(
        default=100,
        description="The distance in miles from this request's address to search within.",
    )
    travel_mode: TravelMode | None = Field(
        default=None,
        description="Preferred travel mode (DRIVE, WALK, BICYCLE, TRANSIT)",
    )
    keywords_to_exclude: list[str] = Field(
        default_factory=list,
        description="Resources with any of these keywords in their name will be excluded from the response.",
    )
    addresses_to_exclude: list[str] = Field(
        default_factory=list,
        description="Resources with any of these addresses will be excluded from the response.",
    )
    ids_to_exclude: list[str] = Field(
        default_factory=list,
        description="Resources with any of these Google Place IDs will be excluded from the response.",
    )
    limit: int = Field(
        default=10,
        description="The maximum number of resources to receive in the response.",
    )

    @classmethod
    def from_client_extracted_info(
        cls,
        *,
        category: ResourceCategory,
        subcategory: ResourceSubcategory,
        keywords_to_exclude: list[str] | None,
        client_info: ClientExtractedInfo,
        limit: int = 10,
    ) -> "GetResourcesRequest":
        address = cls._address_from_client_extracted_info(client_info)
        travel_mode, distance_miles = cls._mode_and_distance_from_client_extracted_info(
            client_info
        )
        return GetResourcesRequest(
            category=category,
            subcategory=subcategory,
            address=address,
            travel_mode=travel_mode,
            distance_miles=distance_miles,
            keywords_to_exclude=keywords_to_exclude or [],
            limit=limit,
        )

    @classmethod
    def from_client_extracted_json(
        cls,
        *,
        category: ResourceCategory,
        subcategory: ResourceSubcategory,
        keywords_to_exclude: list[str] | None,
        client_info_json: dict,
        limit: int = 10,
    ):
        client_info = ClientExtractedInfo.model_validate(client_info_json, strict=True)
        return cls.from_client_extracted_info(
            category=category,
            subcategory=subcategory,
            keywords_to_exclude=keywords_to_exclude,
            client_info=client_info,
            limit=limit,
        )

    @staticmethod
    def _address_from_client_extracted_info(client_info: ClientExtractedInfo):
        """

        TODO(#10014): Only the home address is collected from a client currently,
                      through a form after the intake chat.
        """
        if client_info.home:
            return client_info.home
        if client_info.work:
            return client_info.work
        if client_info.school:
            return client_info.school
        if client_info.probation_office:
            return client_info.probation_office
        raise ValueError(
            "At least one address (home, work, school, or probation_office) is "
            "required to request resources."
        )

    @staticmethod
    def _mode_and_distance_from_client_extracted_info(client_info: ClientExtractedInfo):
        if client_info.can_drive is not False:
            return TravelMode.DRIVE, 100
        elif client_info.transit_pass is not False:
            return TravelMode.TRANSIT, 50
        elif client_info.can_bike is not False:
            return TravelMode.BICYCLE, 10
        elif client_info.can_walk is not False:
            return TravelMode.WALK, 5
        return None, 100


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
    address: str = Field(description="Address of the resource.")
    description: Optional[str] = None
    website: Optional[str] = Field(
        default=None, description="Website of the resource, if available."
    )
    email: Optional[str] = Field(
        default=None, description="Email to contacts if available."
    )

    # rating and ratingCount are from Google Places
    rating: Optional[float] = None
    ratingCount: Optional[int] = None

    transport_mode: Optional[TravelMode] = None
    transport_minutes: Optional[int] = None


ResourcesList: TypeAlias = list[Resource]

ResourcesListModel = TypeAdapter(ResourcesList)


class ResourceAPIResultType(Enum):
    API_ERROR = "api_error"
    NO_RESULTS_FOUND = "no_results_found"
    BAD_REQUEST = "bad_request"
    SUCCESS = "success"


class GetResourcesResponse(BaseModel):
    resources: list[Resource]
    result: ResourceAPIResultType | None = None
    error_message: str | None = None

    def as_json(self):
        return ResourcesListModel.dump_json(self.resources).decode("utf8")
