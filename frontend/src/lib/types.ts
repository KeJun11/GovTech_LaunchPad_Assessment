export interface Message {
  id?: string; // Make ID optional since some messages might not have it initially
  conversation_id?: string;
  role: string;
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  name: string;
  params?: Record<string, any>;
  tokens?: number;
  messages?: Message[];
  created_at?: string;
  updated_at?: string;
}
