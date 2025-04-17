"use client";

import type React from "react";

import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createConversation, deleteConversation } from "@/lib/api";
import type { Conversation } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function ConversationSidebar({
  conversations,
  activeConversation,
  onSelectConversation,
}: ConversationSidebarProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [newConversationName, setNewConversationName] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onSelectConversation(newConversation);
      close();
      setNewConversationName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (conversations.length > 1 && activeConversation) {
        const index = conversations.findIndex(
          (c) => c.id === activeConversation.id
        );
        const nextIndex = index === 0 ? 1 : index - 1;
        onSelectConversation(conversations[nextIndex]);
      } else {
        onSelectConversation(null);
      }
    },
  });

  const handleCreateConversation = () => {
    if (newConversationName.trim()) {
      createMutation.mutate({ name: newConversationName });
    }
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4}>Conversations</Title>
          <Button leftSection={<IconPlus size={16} />} size="xs" onClick={open}>
            New
          </Button>
        </Group>

        <Stack gap="xs">
          {conversations.map((conversation) => (
            <Group key={conversation.id} gap="xs" wrap="nowrap">
              <Button
                variant={
                  activeConversation?.id === conversation.id
                    ? "filled"
                    : "subtle"
                }
                justify="flex-start"
                fullWidth
                onClick={() => onSelectConversation(conversation)}
                styles={{
                  root: {
                    height: "auto",
                    paddingTop: 8,
                    paddingBottom: 8,
                    minHeight: 64,
                  },
                  inner: {
                    justifyContent: "flex-start",
                  },
                }}
              >
                <Stack gap={2} style={{ textAlign: "left", flex: 1 }}>
                  <Text size="sm" truncate="end">
                    {conversation.name}
                  </Text>
                  <Group gap="xs">
                    <Text size="xs">{formatDate(conversation.updated_at)}</Text>
                    <Text size="xs">{conversation.tokens} tokens</Text>
                  </Group>
                </Stack>
              </Button>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={(e) => handleDeleteConversation(conversation.id, e)}
                aria-label="Delete conversation"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ))}

          {conversations.length === 0 && (
            <Text c="dimmed" ta="center" size="sm" mt="md">
              No conversations yet. Create one to get started.
            </Text>
          )}
        </Stack>
      </Stack>

      <Modal opened={opened} onClose={close} title="New Conversation" centered>
        <Stack>
          <TextInput
            label="Conversation Name"
            placeholder="Enter a name for your conversation"
            value={newConversationName}
            onChange={(e) => setNewConversationName(e.target.value)}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              loading={createMutation.isPending}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
