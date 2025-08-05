import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.intake import IntakeSection
from app.routes.intake_sections_router import IntakeSectionCreate


@pytest.mark.asyncio
async def test_create_default_intake_sections(
    async_session: AsyncSession, client: AsyncClient, assert_response
):
    """Test creating default intake sections when no sections provided."""
    # Call the endpoint with no sections parameter
    response = await client.post("/intake-sections")

    # Verify response
    assert_response(response, 201)
    response_data = response.json()

    # Verify default sections were created
    assert len(response_data) >= 5

    # Verify all required fields are present in the response
    for section in response_data:
        assert "id" in section
        assert "title" in section
        assert "description" in section
        assert "created_at" in section
        assert "updated_at" in section

    # Verify titles of default sections
    section_titles = {section["title"] for section in response_data}
    expected_titles = {
        "Employment",
        "Education",
        "Financial",
        "Family and Marital Relationships",
        "Accommodation",
        "Leisure and Recreation",
        "Companions",
        "Alcohol and Drug Use",
    }
    assert expected_titles.issubset(section_titles)


@pytest.mark.asyncio
async def test_create_custom_intake_sections(
    async_session: AsyncSession, client: AsyncClient, assert_response
):
    """Test creating custom intake sections."""
    # Define custom sections
    custom_sections = [
        IntakeSectionCreate(
            title="Custom Section 1",
            description="Description for custom section 1",
            required_information="Required info for section 1",
        ),
        IntakeSectionCreate(
            title="Custom Section 2",
            description="Description for custom section 2",
            required_information="Required info for section 2",
        ),
    ]

    # Call the endpoint with custom sections
    response = await client.post(
        "/intake-sections", json=[s.model_dump(mode="json") for s in custom_sections]
    )

    # Verify response
    assert_response(response, 201)
    response_data = response.json()

    # Verify custom sections were created
    assert len(response_data) == 2
    assert {section["title"] for section in response_data} == {
        "Custom Section 1",
        "Custom Section 2",
    }

    # Verify IDs were assigned
    assert all(section["id"] is not None for section in response_data)


@pytest.mark.asyncio
async def test_create_duplicate_title_failure(
    async_session: AsyncSession, client: AsyncClient, assert_response
):
    """Test that creating sections with duplicate titles fails."""
    # Define sections with duplicate titles
    duplicate_sections = [
        IntakeSectionCreate(
            title="Duplicate Title",
            description="Description 1",
            required_information="Required info 1",
        ),
        IntakeSectionCreate(
            title="Duplicate Title",
            description="Description 2",
            required_information="Required info 2",
        ),
    ]

    # Call the endpoint with duplicate sections
    response = await client.post(
        "/intake-sections", json=[s.model_dump(mode="json") for s in duplicate_sections]
    )

    # Verify response indicates failure
    assert_response(response, 400)
    assert "Duplicate section titles" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_specific_intake_section(
    client: AsyncClient, async_session, assert_response
):
    """Test retrieving a specific intake section by ID."""
    # Create a section
    section = IntakeSection(
        title="Specific Section",
        description="Description for specific section",
        required_information="Required information for specific section",
    )
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Get the section ID
    section_id = section.id

    # Call the get specific section endpoint
    response = await client.get(f"/intake-sections/{section_id}")

    # Verify response
    assert_response(response, 200)
    section_data = response.json()

    # Verify correct section returned
    assert section_data["id"] == str(section_id)
    assert section_data["title"] == "Specific Section"
    assert section_data["description"] == "Description for specific section"


@pytest.mark.asyncio
async def test_get_nonexistent_intake_section(
    client: AsyncClient, assert_response, async_session
):
    """Test retrieving a non-existent intake section returns 404."""
    # Use a non-existent ID
    non_existent_id = "12345678-1234-5678-1234-567812345678"

    # Call the get specific section endpoint
    response = await client.get(f"/intake-sections/{non_existent_id}")

    # Verify response is 404
    assert_response(response, 404)


@pytest.mark.asyncio
async def test_update_intake_section(
    client: AsyncClient, async_session, assert_response
):
    """Test updating an intake section."""
    # Create a section
    section = IntakeSection(
        title="Section to Update",
        description="Original description",
        required_information="Original required info",
    )
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Get the section ID
    section_id = section.id

    # Define update data
    update_data = IntakeSectionCreate(
        title="Updated Section Title",
        description="Updated description",
        required_information="Updated required info",
    )

    # Call the update endpoint
    response = await client.patch(
        f"/intake-sections/{section_id}", json=update_data.model_dump(mode="json")
    )

    # Verify response
    assert_response(response, 200)
    updated_section = response.json()

    # Verify section was updated
    assert updated_section["id"] == str(section_id)
    assert updated_section["title"] == "Updated Section Title"
    assert updated_section["description"] == "Updated description"


@pytest.mark.asyncio
async def test_update_nonexistent_section(
    client: AsyncClient, assert_response, async_session
):
    """Test updating a non-existent section returns 404."""
    # Use a non-existent ID
    non_existent_id = "12345678-1234-5678-1234-567812345678"

    # Define update data
    update_data = IntakeSectionCreate(
        title="Updated Non-existent Section",
        description="This section doesn't exist",
        required_information="Some required info",
    )

    # Call the update endpoint
    response = await client.patch(
        f"/intake-sections/{non_existent_id}", json=update_data.model_dump(mode="json")
    )

    # Verify response is 404
    assert_response(response, 404)


@pytest.mark.asyncio
async def test_update_section_duplicate_title(
    client: AsyncClient, async_session, assert_response
):
    """Test updating a section with a title that already exists fails."""
    # Create two sections
    sections = [
        IntakeSection(
            title="Existing Title",
            description="Description 1",
            required_information="Required info 1",
        ),
        IntakeSection(
            title="Section to Rename",
            description="Description 2",
            required_information="Required info 2",
        ),
    ]
    async_session.add_all(sections)
    await async_session.commit()

    # Refresh to get IDs
    for section in sections:
        await async_session.refresh(section)

    # Get the ID of the section to rename
    section_to_update_id = sections[1].id

    # Try to rename to an existing title
    update_data = IntakeSectionCreate(
        title="Existing Title",  # This title already exists
        description="Updated description",
        required_information="Updated required info",
    )

    # Call the update endpoint
    response = await client.patch(
        f"/intake-sections/{section_to_update_id}",
        json=update_data.model_dump(mode="json"),
    )

    # Verify response indicates conflict
    assert_response(response, 409)
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_delete_intake_section(
    client: AsyncClient, async_session, assert_response
):
    """Test deleting an intake section."""
    # Create a section
    section = IntakeSection(
        title="Section to Delete",
        description="Will be deleted",
        required_information="Info to be deleted",
    )
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Get the section ID
    section_id = section.id

    # Call the delete endpoint
    response = await client.delete(f"/intake-sections/{section_id}")

    # Verify response (204 No Content)
    assert_response(response, 204)

    # Verify section was deleted from DB
    result = await async_session.exec(
        select(IntakeSection).where(IntakeSection.id == section_id)
    )
    assert result.first() is None


@pytest.mark.asyncio
async def test_delete_nonexistent_section(
    client: AsyncClient, assert_response, async_session
):
    """Test deleting a non-existent section returns 404."""
    # Use a non-existent ID
    non_existent_id = "12345678-1234-5678-1234-567812345678"

    # Call the delete endpoint
    response = await client.delete(f"/intake-sections/{non_existent_id}")

    # Verify response is 404
    assert_response(response, 404)
