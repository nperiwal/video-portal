from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from ..utils.db import get_db
from ..utils.auth import get_current_user
from pymongo import MongoClient
from ..models.user import User
from ..utils.email import send_approval_email
from datetime import datetime

router = APIRouter()

async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action"
        )
    return current_user

@router.get("/users/pending")
async def get_pending_users(current_user: dict = Depends(get_current_admin_user)):
    db = get_db()
    # Add logging
    print("Current admin user:", current_user)
    
    query = {"is_approved": False, "is_admin": False}
    print("Query:", query)
    
    users = list(db.users.find(query, {"hashed_password": 0}))
    print("Found users:", users)
    
    result = [
        {
            "id": str(user["_id"]),
            "email": user["email"],
            "phone_number": user.get("phone_number"),
            "created_at": user.get("created_at")
        } for user in users
    ]
    print("Returning result:", result)
    return result

@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: str,
    current_user = Depends(get_current_admin_user)
):
    db = get_db()
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User approved successfully"}

@router.get("/users/approved")
async def get_approved_users(current_user: dict = Depends(get_current_admin_user)):
    db = get_db()
    # Only get approved users who are not admins
    query = {
        "is_approved": True,
        "is_admin": {"$ne": True}  # Explicitly exclude admin users
    }
    
    users = list(db.users.find(query, {"hashed_password": 0}))
    
    result = [
        {
            "id": str(user["_id"]),
            "email": user["email"],
            "phone_number": user.get("phone_number"),
            "created_at": user.get("created_at"),
            "is_admin": user.get("is_admin", False),
            "is_approved": user.get("is_approved", False)
        } for user in users
    ]
    
    return result

@router.get("/users/admins")
async def get_admin_users(current_user: dict = Depends(get_current_admin_user)):
    db = get_db()
    
    query = {"is_admin": True}
    users = list(db.users.find(query, {"hashed_password": 0}))
    
    result = [
        {
            "id": str(user["_id"]),
            "email": user["email"],
            "phone_number": user.get("phone_number"),
            "created_at": user.get("created_at"),
            "is_admin": True
        } for user in users
    ]
    
    return result

@router.put("/users/{user_id}/toggle-admin")
async def toggle_admin_status(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Toggle admin status of a user"""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can modify admin status"
        )
    
    # Prevent admin from removing their own admin status
    current_user_id = str(current_user.get("_id"))
    if user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin status for security reasons"
        )

    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Toggle admin status
    new_status = not user.get("is_admin", False)
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "is_admin": new_status,
            "updated_at": datetime.utcnow()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update admin status"
        )
    
    return {"message": f"Admin status {'granted' if new_status else 'revoked'} successfully"} 