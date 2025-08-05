from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from taskiq.depends.progress_tracker import BaseModel

from app.core.db import AsyncSession, get_session
from app.crud.intake_section import (
    check_section_in_use,
    get_intake_section_by_id,
    get_intake_sections_by_titles,
)
from app.crud.intake_section import (
    create_intake_sections as crud_create_intake_sections,
)
from app.crud.intake_section import (
    delete_intake_section as crud_delete_intake_section,
)
from app.crud.intake_section import (
    update_intake_section as crud_update_intake_section,
)
from app.manage.intake import seed_default_sections
from app.models.intake import IntakeSection
from app.routes.base import IntakeSectionResponse

router = APIRouter()


class IntakeSectionCreate(BaseModel):
    """
    Model for creating intake sections
    """

    title: str
    description: str
    required_information: str


@router.post(
    "",
    response_model=List[IntakeSectionResponse],
    status_code=201,
    summary="Add new intake sections",
    description="Create one or multiple intake sections for the assessment process",
    tags=["Intake Sections"],
)
async def create_intake_sections(
    data: List[IntakeSectionCreate] | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Endpoint to add multiple intake sections.

    - Allows adding a single or multiple intake sections
    - If no sections provided, seeds default sections
    - Validates input data
    - Checks for duplicate titles
    - Performs batch insert
    """
    try:
        # If sections not provided, use seed_default_sections
        if not data:
            default_sections = await seed_default_sections(session)
            return [
                IntakeSectionResponse(
                    id=section.id,
                    title=section.title,
                    description=section.description,
                    created_at=section.created_at,
                    updated_at=section.updated_at,
                )
                for section in default_sections
            ]

        titles = [section.title for section in data]
        if len(set(titles)) != len(titles):
            raise HTTPException(
                status_code=400, detail="Duplicate section titles are not allowed"
            )

        existing_sections = await get_intake_sections_by_titles(session, titles)
        if existing_sections:
            existing_titles = [section.title for section in existing_sections]
            raise HTTPException(
                status_code=409,
                detail=f"Sections with titles {existing_titles} already exist",
            )

        intake_sections = [
            IntakeSection(
                title=section.title,
                description=section.description,
                required_information=section.required_information,
            )
            for section in data
        ]

        created_sections = await crud_create_intake_sections(session, intake_sections)

        return [
            IntakeSectionResponse(
                id=section.id,
                title=section.title,
                description=section.description,
                created_at=section.created_at,
                updated_at=section.updated_at,
            )
            for section in created_sections
        ]
    except HTTPException:
        raise
    except Exception as e:
        # Rollback is handled in the CRUD layer
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{section_id}",
    response_model=IntakeSectionResponse,
    summary="Retrieve a specific intake section",
    description="Fetch a single intake section by its ID",
    tags=["Intake Sections"],
)
async def get_intake_section(
    section_id: str, session: AsyncSession = Depends(get_session)
):
    """
    Endpoint to retrieve a specific intake section by its ID.
    """
    try:
        section = await get_intake_section_by_id(session, UUID(section_id))

        if not section:
            raise HTTPException(
                status_code=404, detail=f"Intake section with ID {section_id} not found"
            )

        return IntakeSectionResponse(**section.model_dump())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch(
    "/{section_id}",
    response_model=IntakeSectionResponse,
    summary="Update an intake section",
    description="Update a specific intake section by its ID",
    tags=["Intake Sections"],
)
async def update_intake_section(
    section_id: str,
    update_data: IntakeSectionCreate,
    session: AsyncSession = Depends(get_session),
):
    """
    Endpoint to update a specific intake section.

    - Updates title, description or default status
    - Validates input data
    - Returns the updated section
    """
    try:
        section = await get_intake_section_by_id(session, UUID(section_id))

        if not section:
            raise HTTPException(
                status_code=404, detail=f"Intake section with ID {section_id} not found"
            )

        # Check for duplicate title if changing the title
        if update_data.title != section.title:
            duplicate = await get_intake_sections_by_titles(
                session, [update_data.title]
            )
            if duplicate:
                raise HTTPException(
                    status_code=409,
                    detail=f"Section with title '{update_data.title}' already exists",
                )

        # Update the section fields
        section.title = update_data.title
        section.description = update_data.description

        # Save changes
        updated_section = await crud_update_intake_section(session, section)
        return IntakeSectionResponse(
            id=updated_section.id,
            title=updated_section.title,
            description=updated_section.description,
            created_at=updated_section.created_at,
            updated_at=updated_section.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/{section_id}",
    status_code=204,
    summary="Delete an intake section",
    description="Remove a specific intake section by its ID",
    tags=["Intake Sections"],
)
async def delete_intake_section(
    section_id: str, session: AsyncSession = Depends(get_session)
):
    """
    Endpoint to delete a specific intake section.

    - Validates section exists
    - Checks that section is not in use by any client intake
    - Removes the section from the database
    """
    try:
        # Check if section exists
        section = await get_intake_section_by_id(session, UUID(section_id))

        if not section:
            raise HTTPException(
                status_code=404, detail=f"Intake section with ID {section_id} not found"
            )

        # Check if section is in use by any client intake
        is_in_use = await check_section_in_use(session, UUID(section_id))
        if is_in_use:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete this section as it is in use by one or more client intakes",
            )

        # Delete the section
        success = await crud_delete_intake_section(session, UUID(section_id))
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete section")

        return None  # 204 No Content response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
