"use client";

import { AppShell, Burger, Group, Loader, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/lib/api";
import ConversationSidebar from "@/components/conversation-sidebar";
import ChatPanel from "@/components/chat-panel";
import ConfigPanel from "@/components/config-panel";
import ThemeToggle from "@/components/theme-toggle";
import type { Conversation } from "@/lib/types";

export default function ChatLayout() {
  const [opened, { toggle: toggleSidebar }] = useDisclosure();
  const [configOpened, { toggle: toggleConfig }] = useDisclosure(true);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  // Set first conversation as active when data loads
  useEffect(() => {
    if (conversations?.length && !activeConversation) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      aside={{
        width: 300,
        breakpoint: "md",
        collapsed: { desktop: !configOpened, mobile: true },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggleSidebar}
              hiddenFrom="sm"
              size="sm"
            />
            <Text size="lg" fw={700}>
              AI Chat App
            </Text>
          </Group>
          <Group>
            <Burger
              opened={configOpened}
              onClick={toggleConfig}
              hiddenFrom="md"
              size="sm"
              color="gray"
            />
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {isLoading ? (
          <Group justify="center" mt="xl">
            <Loader />
          </Group>
        ) : (
          <ConversationSidebar
            conversations={conversations || []}
            activeConversation={activeConversation}
            onSelectConversation={setActiveConversation}
          />
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        <ChatPanel activeConversation={activeConversation} />
      </AppShell.Main>

      <AppShell.Aside p="md">
        <ConfigPanel
          activeConversation={activeConversation}
          onUpdateConversation={(updated) => {
            if (activeConversation) {
              setActiveConversation(updated);
            }
          }}
        />
      </AppShell.Aside>
    </AppShell>
  );
}
