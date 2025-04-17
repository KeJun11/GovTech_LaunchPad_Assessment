from fastapi import APIRouter, HTTPException, status
from typing import List, Any

# file imports
from .models import ConversationFull, ConversationPOST, ConversationPUT, Conversation, QueryRequest
from .services import create_conversation_service, get_conversations_service, get_conversation_service, update_conversation_service, delete_conversation_service, process_query_service

import logging

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Endpoint
@router.post("/conversation", response_model=ConversationFull, status_code=status.HTTP_201_CREATED)
async def create_conversation(conversation_data: ConversationPOST):
    """Create a new conversation."""
    try:
        conversation = await create_conversation_service(
            name=conversation_data.name,
            params=conversation_data.params
        )
        # Gotta convert the id to string first cuz FastAPI is bson
        conv_dict = conversation.dict()
        conv_dict["id"] = str(conversation.id)
        return conv_dict
    except Exception as e:
        import traceback
        error_detail = f"Failed to create conversation: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}"
        )
    
@router.get("/conversations", response_model=List[Conversation])
async def get_conversations():
    """Get a list of all conversations."""
    try:
        conversations = await get_conversations_service()
        return conversations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversations: {str(e)}"
        )

@router.get("/conversations/{id}", response_model=ConversationFull)
async def get_conversation(id: str):
    """Get a specific conversation with all details."""
    try:
        conversation = await get_conversation_service(id=id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with ID {id} not found"
            )
        conv_dict = conversation.dict()
        conv_dict["id"] = str(conversation.id)
        return conv_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversation: {str(e)}"
        )

@router.put("/conversations/{id}", response_model=ConversationFull)
async def update_conversation(id: str, conversation_data: ConversationPUT):
    """Update an existing conversation."""
    try:
        updated_conversation = await update_conversation_service(
            id=id,
            name=conversation_data.name,
            params=conversation_data.params
        )
        if not updated_conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with ID {id} not found"
            )
        conv_dict = updated_conversation.dict()
        conv_dict["id"] = str(updated_conversation.id)
        return conv_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update conversation: {str(e)}"
        )
    
@router.delete("/conversations/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(id: str):
    """Delete a conversation."""
    try:
        success = await delete_conversation_service(id=id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with ID {id} not found"
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete conversation: {str(e)}"
        )
    
@router.post("/queries")
async def process_query(query: QueryRequest):
    """Process a query to the LLM and store in conversation."""
    try:
        result = await process_query_service(
            conversation_id=query.id,
            message={"role": query.message.role, "content": query.message.content}
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process query: {str(e)}"
        )