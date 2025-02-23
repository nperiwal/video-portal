from pymongo import MongoClient
from seed_isopanisad import seed_isopanisad_content

def main():
    client = MongoClient("mongodb://localhost:27017")
    db = client.video_portal
    
    # First remove existing Sri Isopanisad album and its videos
    album = db.albums.find_one({"title": "Sri Isopanisad"})
    if album:
        album_id = str(album["_id"])
        # Delete all videos in this album
        db.videos.delete_many({"album_id": album_id})
        # Delete the album
        db.albums.delete_one({"_id": album["_id"]})
        print("Removed existing Sri Isopanisad album and its videos")
    
    # Now add the new content
    result = seed_isopanisad_content(db)
    print(f"Created album with ID: {result['album_id']}")
    print(f"Added {result['video_count']} videos")

if __name__ == "__main__":
    main() 