from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AlbumCreate(BaseModel):
    title: str
    description: Optional[str] = None

class Album(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    video_count: int = Field(default=0)
    is_active: bool = Field(default=True)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    url: str  # YouTube video URL
    album_id: Optional[str] = None

class VideoCreate(VideoBase):
    pass

class Video(VideoBase):
    id: str
    created_at: datetime
    updated_at: datetime
    created_by: str  # user_id of creator
    share_token: Optional[str] = None  # For generating unique sharing links
    album_id: Optional[str] = None  # Make sure this is included

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 