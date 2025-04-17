"use client";

import type React from "react";

import {
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getConversationMessages, postQuery } from "@/lib/api";
import type { Conversation, Message } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ChatPanelProps {
  activeConversation: Conversation | null;
}

export default function ChatPanel({ activeConversation }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Make sure we're getting an array from the API
  const { data: messages = [] } = useQuery({
    queryKey: ["conversation", activeConversation?.id],
    queryFn: () =>
      activeConversation
        ? getConversationMessages(activeConversation.id)
        : Promise.resolve([]),
    enabled: !!activeConversation,
    // Transform the response to ensure it's an array
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const queryMutation = useMutation({
    mutationFn: postQuery,
    onMutate: async (newQuery) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["conversation", activeConversation?.id],
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>([
        "conversation",
        activeConversation?.id,
      ]);

      // Optimistically update to the new value
      if (previousMessages && Array.isArray(previousMessages)) {
        queryClient.setQueryData(
          ["conversation", activeConversation?.id],
          [
            ...previousMessages,
            {
              id: `temp-user-${Date.now()}`, // Add a temporary unique ID
              conversation_id: activeConversation?.id || "",
              role: "user",
              content: newQuery.content,
              created_at: new Date().toISOString(),
            },
          ]
        );
      } else {
        // If previous messages not found or not an array, create a new array
        queryClient.setQueryData(
          ["conversation", activeConversation?.id],
          [
            {
              id: `temp-user-${Date.now()}`,
              conversation_id: activeConversation?.id || "",
              role: "user",
              content: newQuery.content,
              created_at: new Date().toISOString(),
            },
          ]
        );
      }

      return { previousMessages };
    },
    onSuccess: (response, variables) => {
      // Get current messages
      const currentMessages = queryClient.getQueryData<Message[]>([
        "conversation",
        activeConversation?.id,
      ]) || [];
      
      // Ensure the response is properly formatted with IDs
      const updatedMessages = Array.isArray(currentMessages) 
        ? [...currentMessages]
        : [];
        
      // If the API doesn't return messages directly, we need to fetch fresh messages
      queryClient.invalidateQueries({
        queryKey: ["conversation", activeConversation?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["conversation", activeConversation?.id],
          context.previousMessages
        );
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversation) return;

    queryMutation.mutate({
      conversation_id: activeConversation.id,
      content: input,
    });

    setInput("");
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (!activeConversation) {
    return (
      <Paper
        h="100%"
        display="flex"
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Text c="dimmed">Select or create a conversation to get started</Text>
      </Paper>
    );
  }

  return (
    <Stack h="calc(100vh - 120px)" justify="space-between">
      <ScrollArea h="calc(100% - 80px)" viewportRef={viewport}>
        <Stack gap="md" p="md">
          {messages.length === 0 ? (
            <Text c="dimmed" ta="center">
              This is the beginning of your conversation. Type a message to get
              started.
            </Text>
          ) : (
            // Make sure messages is an array and add unique keys
            Array.isArray(messages) && messages.map((message, index) => (
              <Paper
                key={message.id || `message-${index}`} // Use message.id if available, otherwise use index
                p="md"
                radius="md"
                style={{
                  alignSelf:
                    message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  backgroundColor:
                    message.role === "user"
                      ? "var(--mantine-color-blue-1)"
                      : "var(--mantine-color-gray-1)",
                }}
              >
                <Stack gap={4}>
                  <Group gap="xs">
                    <Text fw={500} size="sm">
                      {message.role === "user" ? "You" : "Assistant"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {message.created_at ? formatDate(message.created_at) : "Just now"}
                    </Text>
                  </Group>
                  <Text>{message.content}</Text>
                </Stack>
              </Paper>
            ))
          )}
          {queryMutation.isPending && (
            <Paper
              p="md"
              radius="md"
              style={{
                alignSelf: "flex-start",
                maxWidth: "80%",
                backgroundColor: "var(--mantine-color-gray-1)",
              }}
            >
              <Text>Thinking...</Text>
            </Paper>
          )}
        </Stack>
      </ScrollArea>

      <Paper p="md" radius="md" withBorder>
        <form onSubmit={handleSubmit}>
          <Group align="flex-end">
            <Textarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1 }}
              autosize
              minRows={1}
              maxRows={5}
              disabled={queryMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!input.trim() || queryMutation.isPending}
              loading={queryMutation.isPending}
            >
              <IconSend size={16} />
            </Button>
          </Group>
        </form>
      </Paper>
    </Stack>
  );
}
