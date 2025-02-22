from fastapi.testclient import TestClient
import pytest
from bson import ObjectId

def test_create_album_admin(client, admin_token):
    response = client.post(
        "/api/videos/albums",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Test Album",
            "description": "Test Description"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Album"
    assert data["description"] == "Test Description"
    assert "id" in data
    assert data["video_count"] == 0
    assert data["is_active"] == True

def test_create_album_unauthorized(client, user_token):
    response = client.post(
        "/api/videos/albums",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "title": "Test Album",
            "description": "Test Description"
        }
    )
    assert response.status_code == 403

def test_get_albums_approved_user(client, approved_user_token, test_album):
    response = client.get(
        "/api/videos/albums",
        headers={"Authorization": f"Bearer {approved_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["title"] == test_album["title"]

def test_get_albums_unapproved_user(client, user_token):
    response = client.get(
        "/api/videos/albums",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403 