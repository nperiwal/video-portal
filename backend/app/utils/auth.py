from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv
from ..utils.db import get_db
from bson import ObjectId
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# JWT Settings
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # Increase to 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.info(f"Validating token: {token[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info(f"Token payload: {payload}")
        user_id = payload.get("sub")
        logger.info(f"Looking for user with ID: {user_id}")
        
        if user_id is None:
            logger.error("No user_id in token")
            raise credentials_exception
        
        # Get user from database
        db = get_db()
        # Log all users in database
        all_users = list(db.users.find())
        logger.info(f"All users in DB: {[str(u['_id']) for u in all_users]}")
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        logger.info(f"Found user: {user}")
        
        if user is None:
            logger.error(f"No user found for id: {user_id}")
            raise credentials_exception
            
        return {
            "sub": str(user["_id"]),
            "email": user["email"],
            "is_admin": user.get("is_admin", False),
            "is_approved": user.get("is_approved", False)
        }
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {e}")
        logger.exception(e)  # This will log the full stack trace
        raise credentials_exception

async def get_current_active_user(current_user = Depends(get_current_user)):
    if not current_user["is_approved"] and not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not approved"
        )
    return current_user

async def get_admin_user(current_user = Depends(get_current_user)):
    if not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def get_current_admin_user(current_user = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action"
        )
    return current_user 