from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_current_admin_user,
    SECRET_KEY,
    ALGORITHM
)
from app.routers import admin, videos
from app.utils.db import init_db, get_db
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add this import for OAuth2 bearer token
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
client = MongoClient(MONGO_URL)
db = client.video_portal

# Add this near the top with other initializations
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {"message": "Video Portal API"}

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    logger.info(f"Login attempt for email: {user_data.email}")
    user = db.users.find_one({"email": user_data.email})
    if not user:
        logger.error(f"No user found with email: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    logger.info(f"Found user: {user['_id']}")
    if not verify_password(user_data.password, user["hashed_password"]):
        logger.error("Invalid password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    logger.info(f"Created token for user: {user['_id']}")
    
    # Make sure all user fields are included in response
    user_data = {
        "id": str(user["_id"]),
        "email": user["email"],
        "is_admin": user.get("is_admin", False),
        "is_approved": user.get("is_approved", False),
        "phone_number": user.get("phone_number"),
        "created_at": user.get("created_at", datetime.utcnow()).isoformat()
    }
    
    return {
        "token": access_token,
        "user": user_data
    }

@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    if db.users.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = {
        "email": user_data.email,
        "hashed_password": hashed_password,
        "is_admin": False,
        "is_approved": False,
        "created_at": datetime.utcnow()
    }
    
    result = db.users.insert_one(user)
    user["_id"] = str(result.inserted_id)
    
    return {
        "message": "User created successfully",
        "user": {
            "id": user["_id"],
            "email": user["email"]
        }
    }

@app.get("/api/test/create-admin")
async def create_test_admin():
    try:
        db = get_db()
        # Create admin user for testing
        admin_data = {
            "email": "admin@example.com",
            "hashed_password": get_password_hash("admin123"),
            "is_admin": True,
            "is_approved": True,
            "created_at": datetime.utcnow()
        }
        
        # Check if admin already exists
        existing_admin = db.users.find_one({"email": admin_data["email"]})
        if existing_admin:
            return {"message": "Admin user already exists", "id": str(existing_admin["_id"])}
        
        result = db.users.insert_one(admin_data)
        return {
            "message": "Admin user created successfully",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        logger.error(f"Error creating admin: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/test/db")
async def test_db():
    try:
        # Test MongoDB connection
        db.users.find_one({})
        return {"message": "Database connection successful"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# Include routers
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])

# Add these new endpoints

@app.get("/api/users/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    user = db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "is_admin": user.get("is_admin", False),
        "is_approved": user.get("is_approved", False),
        "phone_number": user.get("phone_number")
    }

@app.get("/api/videos/albums")
async def get_albums(current_user: dict = Depends(get_current_user)):
    """Get all video albums"""
    try:
        # Fetch albums from database
        albums = list(db.albums.find({"is_active": True}))
        
        # Convert ObjectId to string for JSON serialization
        for album in albums:
            album["_id"] = str(album["_id"])
            if "created_by" in album:
                album["created_by"] = str(album["created_by"])
        
        return albums
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching albums: {str(e)}"
        )

# Optional: Add an endpoint to create albums (for testing)
@app.post("/api/videos/albums")
async def create_album(
    title: str,
    description: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Create a new album"""
    try:
        album = {
            "title": title,
            "description": description,
            "created_by": ObjectId(current_user["sub"]),
            "created_at": datetime.utcnow(),
            "is_active": True,
            "videos": []
        }
        
        result = db.albums.insert_one(album)
        album["_id"] = str(result.inserted_id)
        album["created_by"] = str(album["created_by"])
        
        return album
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating album: {str(e)}"
        )

@app.get("/api/videos/share/{share_token}")
async def get_shared_video(share_token: str, current_user: dict = Depends(get_current_user)):
    """Get video by share token"""
    try:
        # First check if user exists and is approved
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(current_user["sub"])})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        # Check if user is approved or admin
        if not user.get("is_approved") and not user.get("is_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is pending approval. You will be able to watch videos once an admin approves your account."
            )
        
        # Then look for the video
        video = db.videos.find_one({"share_token": share_token})
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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting shared video: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 