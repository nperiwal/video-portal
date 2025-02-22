from fastapi import APIRouter, Depends
from ..utils.auth import get_current_user

router = APIRouter()

@router.get("/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "is_admin": current_user.get("is_admin", False),
        "is_approved": current_user.get("is_approved", False),
        "phone_number": current_user.get("phone_number")
    } 