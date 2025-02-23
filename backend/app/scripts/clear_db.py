from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def clear_database():
    # Get MongoDB URL from environment variable
    mongodb_url = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
    database_name = os.getenv('DATABASE_NAME', 'video_portal_test')
    
    # Connect to MongoDB
    client = MongoClient(mongodb_url)
    db = client[database_name]
    
    # Collections to clear
    collections = ['videos', 'albums', 'users']
    
    try:
        for collection in collections:
            db[collection].delete_many({})
            print(f"Cleared collection: {collection}")
            
        print("\nDatabase cleared successfully!")
        
    except Exception as e:
        print(f"Error clearing database: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    confirm = input("This will clear all data from the database. Are you sure? (y/n): ")
    if confirm.lower() == 'y':
        clear_database()
    else:
        print("Operation cancelled") 