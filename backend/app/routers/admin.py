from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from ..utils.db import get_db
from ..utils.auth import get_current_user

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