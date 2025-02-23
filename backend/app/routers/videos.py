from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from ..models.video import VideoCreate, Video, AlbumCreate, Album
from ..utils.auth import get_current_user, get_current_admin_user
from ..utils.db import get_db
from datetime import datetime
import uuid
from bson import ObjectId
import secrets
from ..services.bunny_service import BunnyService
from typing import Optional

router = APIRouter()

# Add this function to generate share tokens
def generate_share_token():
    return secrets.token_urlsafe(16)

bunny_service = BunnyService()

@router.post("/albums", response_model=Album)
async def create_album(album: AlbumCreate, current_user=Depends(get_current_user)):
    try:
        if not current_user.get("is_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can create albums"
            )
        
        print(f"Creating album with data: {album.dict()}")  # Debug log
        print(f"Current user: {current_user}")  # Debug log
        
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
        
        print(f"Album dict before insert: {album_dict}")  # Debug log
        
        result = db.albums.insert_one(album_dict)
        album_dict["_id"] = str(result.inserted_id)
        
        print(f"Album created: {album_dict}")  # Debug log
        
        return Album(**album_dict)
    except Exception as e:
        print(f"Error creating album: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating album: {str(e)}"
        )

@router.post("/videos", response_model=Video)
async def create_video(video: VideoCreate, current_user=Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can upload videos"
        )
    
    db = get_db()
    video_dict = video.dict()
    print(f"Creating video with data: {video_dict}")  # Debug log
    
    video_dict.update({
        "id": str(ObjectId()),
        "created_by": current_user["sub"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "share_token": str(uuid.uuid4())
    })
    
    if video.album_id:
        album = db.albums.find_one({"id": video.album_id})
        print(f"Found album for video: {album}")  # Debug log
        if not album:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Album not found"
            )
        # Make sure album_id is included in video_dict
        video_dict["album_id"] = video.album_id
        db.albums.update_one(
            {"id": video.album_id},
            {"$inc": {"video_count": 1}}
        )
    
    result = db.videos.insert_one(video_dict)
    video_dict["_id"] = str(result.inserted_id)
    print(f"Created video: {video_dict}")  # Debug log
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

@router.get("/albums/{album_id}/videos")
async def get_album_videos(
    album_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get all videos in an album"""
    if not current_user.get("is_approved") and not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not approved"
        )
    
    db = get_db()
    
    # First check if album exists
    album = db.albums.find_one({"id": album_id})
    print(f"Looking for album with id: {album_id}")
    print(f"Found album: {album}")
    
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    
    # Get all videos in the album
    videos = list(db.videos.find({"album_id": album_id}))
    print(f"Found videos: {videos}")
    
    # Let's also check all videos in the collection
    all_videos = list(db.videos.find({}))
    print(f"All videos in DB: {all_videos}")
    
    # Convert ObjectId to string for JSON serialization
    for video in videos:
        video["_id"] = str(video["_id"])
        if "created_by" in video:
            video["created_by"] = str(video["created_by"])
    
    return videos

@router.post("/videos/{video_id}/share")
async def generate_share_link(
    video_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate a share token for a video"""
    try:
        db = get_db()
        
        # Add debug logging
        print(f"Looking for video with ID: {video_id}")
        
        # Get all videos to check the data structure
        all_videos = list(db.videos.find({}))
        print(f"All videos in DB: {all_videos}")
        
        video = db.videos.find_one({"id": video_id})
        print(f"Found video: {video}")
        
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        # Generate new share token
        share_token = generate_share_token()
        print(f"Generated share token: {share_token}")
        
        # Update video
        result = db.videos.update_one(
            {"id": video_id},
            {"$set": {"share_token": share_token}}
        )
        print(f"Update result: {result.modified_count} documents modified")
        
        return {
            "share_token": share_token,
            "share_url": f"/share/{share_token}"
        }
    except Exception as e:
        print(f"Error in generate_share_link: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/share/{share_token}")
async def get_shared_video(share_token: str, current_user: dict = Depends(get_current_user)):
    """Get video by share token"""
    try:
        db = get_db()
        print(f"Looking for video with share token: {share_token}")  # Debug log
        
        video = db.videos.find_one({"share_token": share_token})
        print(f"Found video: {video}")  # Debug log
        
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        # Convert ObjectId to string
        video["_id"] = str(video["_id"])
        if "created_by" in video:
            video["created_by"] = str(video["created_by"])
            
        return video
    except Exception as e:
        print(f"Error getting shared video: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/videos/upload")
async def upload_video(
    title: str,
    description: Optional[str] = None,
    album_id: Optional[str] = None,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can upload videos"
        )
    
    # Upload to Bunny.net
    bunny_response = await bunny_service.upload_video(file, title)
    if not bunny_response:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload video"
        )
    
    # Create video document in your database
    video_data = {
        "title": title,
        "description": description,
        "url": bunny_response["url"],
        "thumbnail_url": bunny_response["thumbnail"],
        "video_id": bunny_response["video_id"],
        "album_id": album_id,
        "created_by": current_user["sub"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    db = get_db()
    result = db.videos.insert_one(video_data)
    
    # Update album video count if needed
    if album_id:
        db.albums.update_one(
            {"_id": ObjectId(album_id)},
            {"$inc": {"video_count": 1}}
        )
    
    return {
        "id": str(result.inserted_id),
        **video_data
    } 