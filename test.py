import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://localhost:27017"  # Ensure MongoDB is running locally
client = AsyncIOMotorClient(MONGO_URI)
db = client["video_portal"]
users_collection = db["users"]

async def test_mongo_connection():
    try:
        await users_collection.insert_one({"test": "MongoDB is working"})
        result = await users_collection.find_one({"test": "MongoDB is working"})
        print("MongoDB Connection Test:", result is not None)
    except Exception as e:
        print("MongoDB Connection Failed:", str(e))

asyncio.run(test_mongo_connection())
