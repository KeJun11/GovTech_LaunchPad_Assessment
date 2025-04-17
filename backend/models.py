from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from beanie import Document, PydanticObjectId # Beanie has an in build pydantic object ID
from datetime import datetime


class Message(BaseModel):
    """Model representing a single message in a conversation."""
    role: str  # e.g., "user", "assistant", "system"
    content: str

class ConversationFull(Document):
    """Model representing a conversation between a user and an LLM chatbot."""
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
    name: str
    params: Dict[str, Any] = Field(default_factory=dict)  # Parameters passed to OpenAI
    tokens: int = 0 
    messages: List[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime)
    updated_at: datetime = Field(default_factory=datetime)
    
    class Settings:
        name = "conversations"  # Collection name in MongoDB

    # Pydantic configs
    model_config = ConfigDict(
        populate_by_name=True, # necessary so alias "_id" works
        json_encoders={PydanticObjectId: str}, # for encoding ObjectId to str in JSON
    )


class Conversation(BaseModel):
    id: str
    name: str
    params: Dict[str, Any]
    tokens: int


# Request/Response models
class ConversationPOST(BaseModel):
    name: str
    params: Dict[str, Any] = {}


class ConversationPUT(BaseModel):
    name: str
    params: Dict[str, Any] = {}


class QueryRequest(BaseModel):
    id: str
    message: Message
