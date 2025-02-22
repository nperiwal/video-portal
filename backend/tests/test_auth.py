from fastapi.testclient import TestClient
import pytest
from bson import ObjectId
from datetime import datetime

def test_login_success(client, test_db):
    # Create a test user first
    hashed_password = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGpJ4vZKkOS"  # 'test123'
    user = {
        "_id": ObjectId(),
        "email": "test@example.com",
        "hashed_password": hashed_password,
        "is_admin": False,
        "is_approved": True,
        "created_at": datetime.utcnow()
    }
    test_db.users.insert_one(user)

    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "test123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "user" in data
    assert data["user"]["email"] == "test@example.com"

def test_login_invalid_credentials(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        }
    )
    assert response.status_code == 401

def test_register_success(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "test123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "User created successfully"
    assert data["user"]["email"] == "newuser@example.com"

def test_register_duplicate_email(client, test_db):
    # Create a user first
    user = {
        "_id": ObjectId(),
        "email": "existing@example.com",
        "hashed_password": "somehash",
        "is_admin": False,
        "is_approved": False,
        "created_at": datetime.utcnow()
    }
    test_db.users.insert_one(user)

    response = client.post(
        "/api/auth/register",
        json={
            "email": "existing@example.com",
            "password": "test123"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_get_current_user(client, approved_user_token):
    response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {approved_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "is_approved" in data
    assert data["is_approved"] == True

def test_get_current_user_no_token(client):
    response = client.get("/api/users/me")
    assert response.status_code == 401 