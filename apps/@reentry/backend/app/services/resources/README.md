# Resources Service Module

This module provides resource discovery functionality for the reentry application, enabling
the system to find and recommend community resources (housing, employment, healthcare, etc.) near a given location.

## Public API

### `list_resources()` - Main Entry Point

**IMPORTANT: The CPA should use `list_resources()` as the primary interface for retrieving resources. All categorizations are in `resource_taxonomy.py`**

```python
from app.services.resources.list_resources import list_resources
from app.services.resources.types import GetResourcesRequest
from app.services.resources.resource_taxonomy import ResourceCategory, ResourceSubcategory
from app.services.resources.api import TravelMode

# Example usage
request = GetResourcesRequest(
    category=ResourceCategory.HOUSING,
    subcategory=ResourceSubcategory.EMERGENCY_HOUSING_AND_SHELTERS,
    address="123 Main St, Cityville, CA 12345",
    distance_miles=50,
    travel_mode=TravelMode.DRIVE,
    exclude_names=["Banned", "Keyword"],
    limit=10
)

response = await list_resources(request)

if response.result == ResourceAPIResultType.SUCCESS:
    for resource in response.resources:
        print(f"{resource.name} - {resource.address}")
else:
    print(f"Error: {response.error_message}")
```

The `list_resources()` function:
- Communicates with the external Resource API
- Filters out disallowed resources
- Ranks and prioritizes results based on ratings, proximity, and origin
- Handles errors gracefully
- Returns a consistent response structure

## Module Structure

### `list_resources.py` - Public Interface

Contains the main `list_resources()` function and supporting logic:
- `list_resources()` - Main entry point for resource retrieval
- `filter_discovered_resources()` - Removes disallowed resources
- `filter_rank_limit()` - Ranks and limits results

### `types.py` - Data Models

Defines request/response models used throughout the application:
- `GetResourcesRequest` - Request parameters for resource discovery
- `GetResourcesResponse` - Response containing resources and status
- `Resource` - Internal resource representation
- `ResourceAPIResultType` - Status codes (SUCCESS, API_ERROR, NO_RESULTS_FOUND, BAD_REQUEST)

### `api.py` - Internal API Client

**Internal module - Should not be called directly by the rest of the application.**

Contains low-level API communication logic:
- `discover_resources()` - Makes HTTP requests to external Resource API
- `DiscoveredResource` - API-specific model. This allows us to incrementally add features.
- Exception types: `ResourceAPIFailure`, `BadResourceAPIRequest`

### `resource_taxonomy.py` - Resource Classification

Defines the taxonomy of resource categories and subcategories:
- `ResourceCategory` - Top-level categories (Housing, Employment, etc.)
- `ResourceSubcategory` - Specific resource types
- `ProviderOrigin` - Source of resource data (GOOGLE, CRAWLER, CURATED)
- `CATEGORY_SUBCATEGORY_MAP` - Valid category/subcategory combinations

## Data Flow

```
Application Code
    ↓
list_resources(GetResourcesRequest)
    ↓
discover_resources() [internal API call]
    ↓
External Resource API
    ↓
filter_rank_limit()
    ↓
GetResourcesResponse
    ↓
Application Code
```

## Configuration

Requires environment variables:
- `RESOURCE_API_URL` - Base URL for the external Resource API
- `RESOURCE_API_KEY` - API key for authentication
