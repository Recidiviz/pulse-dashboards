from pydantic import BaseModel


class ResourceByIdRequest(BaseModel):
    resource_id: str
