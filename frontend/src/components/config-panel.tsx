"use client";

import { Button, NumberInput, Select, Slider, Stack, Text, Textarea, Title} from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { updateConversation } from "@/lib/api";
import type { Conversation } from "@/lib/types";

interface ConfigPanelProps {
  activeConversation: Conversation | null;
  onUpdateConversation: (conversation: Conversation) => void;
}

export default function ConfigPanel({
  activeConversation,
  onUpdateConversation,
}: ConfigPanelProps) {
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [model, setModel] = useState("gpt-4o-mini");

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateConversation,
    onSuccess: (updatedConversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onUpdateConversation(updatedConversation);
    },
  });

  // Update form when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setName(activeConversation.name);
      setSystemPrompt(activeConversation.params?.system_prompt || "");
      setTemperature(activeConversation.params?.temperature || 0.7);
      setMaxTokens(activeConversation.params?.max_completion_tokens || 1000);
      setModel(activeConversation.params?.model || "gpt-4o-mini");
    }
  }, [activeConversation]);

  const handleSave = () => {
    if (!activeConversation) return;

    updateMutation.mutate({
      id: activeConversation.id,
      name,
      params: {
        system_prompt: systemPrompt,
        temperature,
        max_completion_tokens: maxTokens,
        model,
      },
    });
  };

  if (!activeConversation) {
    return (
      <Text c="dimmed" ta="center">
        Select a conversation to configure settings
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <Title order={4}>Configuration</Title>

      <Textarea
        label="System Prompt"
        placeholder="You are a helpful assistant..."
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        minRows={3}
      />

      <Stack gap="xs">
        <Text size="sm">Temperature: {temperature}</Text>
        <Slider
          min={0}
          max={1}
          step={0.1}
          value={temperature}
          onChange={setTemperature}
          marks={[
            { value: 0, label: "0" },
            { value: 0.5, label: "0.5" },
            { value: 1, label: "1" },
          ]}
        />
      </Stack>

      <NumberInput
        label="Max Completion Tokens"
        value={maxTokens}
        onChange={(val) => setMaxTokens(Number(val))}
        min={1}
        max={4000}
      />

      <Select
        label="Model"
        value={model}
        onChange={(val) => setModel(val || "gpt-4")}
        data={[
          { value: "gpt-4o-mini", label: "GPT-4o-mini" },
          { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
        ]}
      />

      <Button onClick={handleSave} loading={updateMutation.isPending} mt="md">
        Save Changes
      </Button>
    </Stack>
  );
}
