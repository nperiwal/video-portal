from pymongo import MongoClient
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db():
    try:
        # Create a single client instance
        client = MongoClient("mongodb://localhost:27017")
        db = client.video_portal
        # Test the connection
        db.command('ping')
        logger.info("Connected to MongoDB")
        return db
    except Exception as e:
        logger.error(f"MongoDB connection error: {e}")
        raise

def init_db():
    """Initialize database with required collections"""
    try:
        db = get_db()
        # Create collections if they don't exist
        if 'users' not in db.list_collection_names():
            db.create_collection('users')
            logger.info("Created users collection")
        if 'albums' not in db.list_collection_names():
            db.create_collection('albums')
            logger.info("Created albums collection")
        if 'videos' not in db.list_collection_names():
            db.create_collection('videos')
            logger.info("Created videos collection")
        return db
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise 