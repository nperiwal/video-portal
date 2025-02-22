from fastapi import APIRouter, Depends, HTTPException, status
from ..models.video import VideoCreate, Video, AlbumCreate, Album
from ..utils.auth import get_current_user
from ..utils.db import get_db
from datetime import datetime
import uuid
from bson import ObjectId

router = APIRouter()

@router.post("/albums", response_model=Album)
async def create_album(album: AlbumCreate, current_user=Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create albums"
        )
    
    db = get_db()
    album_dict = album.dict()
    album_dict.update({
        "id": str(ObjectId()),
        "created_by": current_user["sub"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "video_count": 0,
        "is_active": True
    })
    
    result = db.albums.insert_one(album_dict)
    album_dict["_id"] = str(result.inserted_id)
    return Album(**album_dict)

@router.post("/videos", response_model=Video)
async def create_video(video: VideoCreate, current_user=Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can upload videos"
        )
    
    db = get_db()
    video_dict = video.dict()
    video_dict.update({
        "id": str(ObjectId()),
        "created_by": current_user["sub"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "share_token": str(uuid.uuid4())
    })
    
    if video.album_id:
        album = db.albums.find_one({"id": video.album_id})
        if not album:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Album not found"
            )
        db.albums.update_one(
            {"id": video.album_id},
            {"$inc": {"video_count": 1}}
        )
    
    result = db.videos.insert_one(video_dict)
    video_dict["_id"] = str(result.inserted_id)
    return Video(**video_dict)

@router.get("/videos/{video_id}")
async def get_video(video_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    video = db.videos.find_one({"id": video_id})
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    if not current_user["is_approved"] and not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not approved"
        )
    
    return Video(**video)

@router.get("/videos/share/{share_token}")
async def get_shared_video(share_token: str, current_user=Depends(get_current_user)):
    if not current_user["is_approved"] and not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not approved"
        )
    
    db = get_db()
    video = db.videos.find_one({"share_token": share_token})
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    return Video(**video)

@router.get("/albums")
async def get_albums(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_approved") and not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not approved"
        )
    
    db = get_db()
    albums = list(db.albums.find({"is_active": True}))
    
    # Convert ObjectId to string for JSON serialization
    for album in albums:
        album["_id"] = str(album["_id"])
        if "created_by" in album:
            album["created_by"] = str(album["created_by"])
        if "id" not in album:
            album["id"] = str(album["_id"])
    
    return albums 