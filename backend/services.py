from typing import Dict, List, Any
from datetime import datetime
import os
import json
import logging
from .models import ConversationFull, Message, Conversation
import openai
from dotenv import load_dotenv
import traceback

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Service functions
async def create_conversation_service(name: str, params: Dict[str, Any]) -> ConversationFull:
    """Creates a new conversation row in the database"""
    try:
        # Add detailed logging for debugging
        logger.info(f"Attempting to create conversation with name: {name} and params: {params}")

        conversation = ConversationFull(
            name=name,
            params=params,
            tokens=0,
            messages=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        # Log before insertion attempt
        logger.info(f"About to insert conversation: {conversation.dict()}")

        await conversation.insert()
        logger.info(f"Created conversation: {conversation.id}")
        return conversation
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

# Get all
async def get_conversations_service() -> List[Dict]:
    """Fetches the conversation from the database"""
    try:
        conversations = await ConversationFull.find_all().to_list()
        logger.info(f"Retrieved {len(conversations)} conversations")
        return [
            Conversation(
                id=str(conv.id),
                name=conv.name,
                params=conv.params,
                tokens=conv.tokens,
                # messages=conv.messages
            )
            for conv in conversations
        ]
    except Exception as e:
        logger.error(f"Error retrieving conversations: {str(e)}")
        raise

# Update
async def update_conversation_service(id: str, name: str, params: Dict[str, Any]) -> ConversationFull:
    """Fetches the conversation based on id and updates its rows"""
    try:
        conversation = await ConversationFull.get(id)
        if not conversation:
            logger.info(f"No conversation found with id: {id} for update")
            return None
        
        conversation.name = name
        conversation.params = params
        conversation.updated_at = datetime.now()
        await conversation.save()
        logger.info(f"Updated conversation with id: {id}")
        return conversation
    except Exception as e:
        logger.error(f"Error updating conversation with id {id}: {str(e)}")
        raise

# Delete
async def delete_conversation_service(id: str) -> bool:
    """Delete a conversation row"""
    try:
        conversation = await Conversation.get(id)
        if not conversation:
            logger.info(f"No conversation found with id: {id} for deletion")
            return False
        
        await conversation.delete()
        logger.info(f"Deleted conversation with id: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting conversation with id {id}: {str(e)}")
        raise

# Get one
async def get_conversation_service(id: str) -> ConversationFull:
    """Fetches a conversation based on id and returns it"""
    try:
        conversation = await ConversationFull.get(id)
        if conversation:
            logger.info(f"Retrieved conversation with id: {id}")
        else:
            logger.info(f"No conversation found with id: {id}")
        return conversation
    except Exception as e:
        logger.error(f"Error retrieving conversation with id {id}: {str(e)}")
        raise

# Post query to LLM
async def process_query_service(conversation_id: str, message: Dict[str, Any]) -> Dict:
    """
    Process a user query:
    1. Add the user message to conversation
    2. Generate LLM response using conversation history
    3. Add LLM response to conversation
    4. Update token count
    5. Save updated conversation to database
    """
    try:
        # Load environment variables and set up OpenAI API key
        load_dotenv()
        openai.api_key = os.getenv("OPENAI_API_KEY")

        # Get the existing conversation
        conversation = await ConversationFull.get(conversation_id)
        if not conversation:
            logger.error(f"No conversation found with id: {conversation_id}")
            raise ValueError(f"Conversation with ID {conversation_id} not found")
        
        # Add user message to conversation
        user_msg = Message(
            role=message["role"], 
            content=message["content"],
            timestamp=datetime.now()
        )
        conversation.messages.append(user_msg)
        
        # Format all messages for the API call
        formatted_messages = []
        
        # Add system message if provided in params
        if "system_prompt" in conversation.params:
            formatted_messages.append({
                "role": "system", 
                "content": conversation.params["system_prompt"]
            })
        else:
            formatted_messages.append({
                "role": "system", 
                "content": "You are a helpful assistant."
            })
        
        # Add all conversation messages
        for msg in conversation.messages:
            formatted_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Determine which model to use
        model = conversation.params.get("model", "gpt-4o-mini")
        
        # Make the API call
        response = openai.chat.completions.create(
            model=model,
            messages=formatted_messages,
            temperature=conversation.params.get("temperature", 0.7),
            max_tokens=conversation.params.get("max_tokens", 1000),
        )
        
        # Extract response content
        assistant_response = response.choices[0].message.content
        
        # Add the LLM's response to conversation
        assistant_msg = Message(role="assistant", content=assistant_response)
        conversation.messages.append(assistant_msg)
        
        # Update token count
        if hasattr(response, 'usage') and response.usage:
            conversation.tokens += response.usage.total_tokens
        
        # Update conversation timestamp and save
        conversation.updated_at = datetime.now()
        await conversation.save()
        
        logger.info(f"Processed query for conversation: {conversation_id}")
        
        # Return the assistant's response along with updated conversation
        return {
            "response": assistant_response,
            "conversation": conversation
        }
        
    except Exception as e:
        logger.error(f"Error processing query for conversation {conversation_id}: {str(e)}")
        raise

# Tests
# async def generate_response(prompt):
#     # Load environment variables from .env file
#     load_dotenv()

#     # Set up the OpenAI API key
#     openai.api_key = os.getenv("OPENAI_API_KEY")

#     # Get the existing conversation
#     conversation = await Conversation.get(conversation_id)
#     if not conversation:
#         logger.error(f"No conversation found with id: {conversation_id}")
#         raise ValueError(f"Conversation with ID {conversation_id} not found")
    
#     # Format messages for the API call
#     formatted_messages = []

#     try:
#         # Make the API call
#         response = openai.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[
#                 {"role": "system", "content": "You are a helpful assistant."},
#                 {"role": "user", "content": prompt}
#             ]
#         )
        
#         # Extract and print the response
#         result = response.choices[0].message.content
#         print(result)
#         return result
    
#     except Exception as e:
#         print(f"An error occurred: {e}")
#         return None