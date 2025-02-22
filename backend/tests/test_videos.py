from fastapi.testclient import TestClient
import pytest
from bson import ObjectId
from datetime import datetime

def test_create_video_admin(client, admin_token, test_album):
    response = client.post(
        "/api/videos/videos",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Test Video",
            "description": "Test Description",
            "url": "https://www.youtube.com/watch?v=test",
            "album_id": test_album["id"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Video"
    assert data["url"] == "https://www.youtube.com/watch?v=test"
    assert data["album_id"] == test_album["id"]
    assert "id" in data
    assert "share_token" in data

def test_create_video_without_album(client, admin_token):
    response = client.post(
        "/api/videos/videos",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Test Video No Album",
            "description": "Test Description",
            "url": "https://www.youtube.com/watch?v=test"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["album_id"] is None

def test_create_video_invalid_album(client, admin_token):
    response = client.post(
        "/api/videos/videos",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Test Video",
            "description": "Test Description",
            "url": "https://www.youtube.com/watch?v=test",
            "album_id": "invalid_album_id"
        }
    )
    assert response.status_code == 404
    assert "Album not found" in response.json()["detail"]

def test_create_video_unauthorized(client, user_token):
    response = client.post(
        "/api/videos/videos",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "title": "Test Video",
            "description": "Test Description",
            "url": "https://www.youtube.com/watch?v=test"
        }
    )
    assert response.status_code == 403

def test_get_video(client, approved_user_token, test_db):
    # Create a test video first
    video = {
        "id": str(ObjectId()),
        "title": "Test Video",
        "description": "Test Description",
        "url": "https://www.youtube.com/watch?v=test",
        "created_by": str(ObjectId()),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "share_token": "test-token"
    }
    test_db.videos.insert_one(video)

    response = client.get(
        f"/api/videos/videos/{video['id']}",
        headers={"Authorization": f"Bearer {approved_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == video["title"]

def test_get_shared_video(client, approved_user_token, test_db):
    # Create a test video first
    video = {
        "id": str(ObjectId()),
        "title": "Test Video",
        "description": "Test Description",
        "url": "https://www.youtube.com/watch?v=test",
        "created_by": str(ObjectId()),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "share_token": "test-share-token"
    }
    test_db.videos.insert_one(video)

    response = client.get(
        f"/api/videos/share/test-share-token",
        headers={"Authorization": f"Bearer {approved_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == video["title"]

def test_get_album_videos(client, approved_user_token, test_db, test_album):
    # Create test videos in the album
    videos = [
        {
            "id": str(ObjectId()),
            "title": f"Test Video {i}",
            "description": f"Test Description {i}",
            "url": f"https://www.youtube.com/watch?v=test{i}",
            "album_id": test_album["id"],
            "created_by": str(ObjectId()),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "share_token": f"test-token-{i}"
        }
        for i in range(2)
    ]
    test_db.videos.insert_many(videos)

    response = client.get(
        f"/api/videos/albums/{test_album['id']}/videos",
        headers={"Authorization": f"Bearer {approved_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(video["album_id"] == test_album["id"] for video in data)

def test_get_album_videos_empty(client, approved_user_token, test_album):
    response = client.get(
        f"/api/videos/albums/{test_album['id']}/videos",
        headers={"Authorization": f"Bearer {approved_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0

def test_video_count_increment(client, admin_token, test_db, test_album):
    # Get initial video count
    initial_album = test_db.albums.find_one({"id": test_album["id"]})
    initial_count = initial_album.get("video_count", 0)

    # Add a video to the album
    response = client.post(
        "/api/videos/videos",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Test Video",
            "description": "Test Description",
            "url": "https://www.youtube.com/watch?v=test",
            "album_id": test_album["id"]
        }
    )
    assert response.status_code == 200

    # Verify video count increased
    updated_album = test_db.albums.find_one({"id": test_album["id"]})
    assert updated_album["video_count"] == initial_count + 1

def test_get_album_videos_not_found(client, approved_user_token):
    response = client.get(
        "/api/videos/albums/nonexistent-id/videos",
        headers={"Authorization": f"Bearer {approved_user_token}"}
    )
    assert response.status_code == 404

def test_get_album_videos_unauthorized(client, user_token, test_album):
    response = client.get(
        f"/api/videos/albums/{test_album['id']}/videos",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403 