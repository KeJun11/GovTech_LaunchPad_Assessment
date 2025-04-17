import type { Conversation, Message } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Fetch all conversations
export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/conversations`);
  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }
  return response.json();
}

// Fetch messages for a specific conversation
export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  const response = await fetch(`${API_URL}/conversations/${conversationId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch conversation messages");
  }
  const data = await response.json();
  
  // Ensure we return an array of messages with unique IDs
  if (data.messages && Array.isArray(data.messages)) {
    return data.messages.map((msg: any, index: number) => ({
      ...msg,
      id: msg.id || `msg-${index}-${Date.now()}`, // Ensure each message has an ID
    }));
  }
  
  // If messages property isn't there or isn't an array, return empty array
  return [];
}

// Create a new conversation
export async function createConversation(data: {
  name: string;
  params?: { [key: string]: any };
}): Promise<Conversation> {
  const response = await fetch(`${API_URL}/conversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: data.name,
      params: data.params || {},
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }

  return response.json();
}

// Update a conversation
export async function updateConversation(data: {
  id: string;
  name: string;
  params: { [key: string]: any };
}): Promise<Conversation> {
  const response = await fetch(`${API_URL}/conversations/${data.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: data.name,
      params: data.params,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update conversation");
  }

  return response.json();
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/conversations/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete conversation");
  }
}

// Post a new query
export async function postQuery(data: {
  conversation_id: string;
  content: string;
}): Promise<Message[]> {  // Return type changed to Message[]
  const response = await fetch(`${API_URL}/queries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: data.conversation_id,
      message: {
        role: "user",
        content: data.content,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to post query");
  }

  // Get the updated conversation to retrieve all messages
  return getConversationMessages(data.conversation_id);
}
