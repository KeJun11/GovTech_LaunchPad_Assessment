# test_mongodb.py
import motor.motor_asyncio
import asyncio

async def test_connection():
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        # Test the connection
        await client.admin.command('ismaster')
        print("MongoDB connection successful!")
        client.close()
    except Exception as e:
        print(f"MongoDB connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())