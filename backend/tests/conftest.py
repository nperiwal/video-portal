import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId

from main import app
from app.utils.auth import create_access_token

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_db():
    # Use a test database
    client = MongoClient("mongodb://localhost:27017")
    db = client.video_portal_test
    yield db
    # Cleanup after tests
    client.drop_database('video_portal_test')

@pytest.fixture
def admin_token():
    # Create a test admin user
    admin_id = str(ObjectId())
    return create_access_token({"sub": admin_id, "is_admin": True})

@pytest.fixture
def user_token():
    # Create a regular user
    user_id = str(ObjectId())
    return create_access_token({"sub": user_id})

@pytest.fixture
def approved_user_token():
    # Create an approved user
    user_id = str(ObjectId())
    return create_access_token({"sub": user_id, "is_approved": True})

@pytest.fixture
def test_album(test_db):
    album = {
        "id": str(ObjectId()),
        "title": "Test Album",
        "description": "Test Description",
        "created_by": str(ObjectId()),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "video_count": 0,
        "is_active": True
    }
    test_db.albums.insert_one(album)
    return album

@pytest.fixture
def test_video(test_db, test_album):
    video = {
        "id": str(ObjectId()),
        "title": "Test Video",
        "description": "Test Description",
        "url": "https://www.youtube.com/watch?v=test",
        "album_id": test_album["id"],
        "created_by": str(ObjectId()),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "share_token": "test-token"
    }
    test_db.videos.insert_one(video)
    return video 