import React, { useState } from "react";
import { Container, VStack, Heading, Checkbox, CheckboxGroup, Textarea, Select, Button, Box, Text, Stack, Radio, RadioGroup, FormControl, FormLabel } from "@chakra-ui/react";
import { FaRocket } from "react-icons/fa";

const Index = () => {
  const [providers, setProviders] = useState([]);
  const [model, setModel] = useState("");
  const [content, setContent] = useState("");
  const [responseType, setResponseType] = useState("standard");
  const [response, setResponse] = useState("");

  const handleProviderChange = (values) => {
    setProviders(values);
  };

  const handleModelChange = (e) => {
    setModel(e.target.value);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleResponseTypeChange = (e) => {
    setResponseType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponse("");

    for (const provider of providers) {
      const response = await fetch(`/api/call-llm/${provider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, content, responseType }),
      });

      const responseData = await response.text();
      setResponse((prev) => `${prev}${provider.toUpperCase()} Response:\n${responseData}\n\n`);
    }
  };

  return (
    <Container centerContent maxW="container.md" py={8}>
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        <Heading as="h1" size="xl">
          LLM API Call
        </Heading>

        <FormControl as="fieldset">
          <FormLabel as="legend">Select LLM Provider:</FormLabel>
          <CheckboxGroup value={providers} onChange={handleProviderChange}>
            <Stack spacing={2} direction="row">
              <Checkbox value="openai">OpenAI</Checkbox>
              <Checkbox value="anthropic">Anthropic</Checkbox>
              <Checkbox value="google">Google</Checkbox>
            </Stack>
          </CheckboxGroup>
        </FormControl>

        {providers.length > 0 && (
          <FormControl as="fieldset">
            <FormLabel as="legend">Select Model:</FormLabel>
            <RadioGroup onChange={handleModelChange} value={model}>
              <Stack spacing={2}>
                {providers.includes("openai") && (
                  <Box>
                    <Text>OpenAI Models</Text>
                    <Radio value="gpt-4o">GPT 4o</Radio>
                    <Radio value="gpt-4-turbo">GPT 4 Turbo</Radio>
                    <Radio value="gpt-3.5-turbo-0125">GPT 3.5 Turbo Flagship</Radio>
                  </Box>
                )}
                {providers.includes("anthropic") && (
                  <Box>
                    <Text>Anthropic Models</Text>
                    <Radio value="claude-3-opus-20240229">Claude 3 Opus</Radio>
                    <Radio value="claude-3-sonnet-20240229">Claude 3 Sonnet</Radio>
                    <Radio value="claude-3-haiku-20240307">Claude 3 Haiku</Radio>
                  </Box>
                )}
                {providers.includes("google") && (
                  <Box>
                    <Text>Google Models</Text>
                    <Radio value="gemini-1.5-pro-latest">Gemini 1.5 Pro</Radio>
                    <Radio value="gemini-pro">Gemini 1 Pro</Radio>
                  </Box>
                )}
              </Stack>
            </RadioGroup>
          </FormControl>
        )}

        <FormControl>
          <FormLabel htmlFor="content">Content:</FormLabel>
          <Textarea id="content" value={content} onChange={handleContentChange} required />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="responseType">Response Type:</FormLabel>
          <Select id="responseType" value={responseType} onChange={handleResponseTypeChange}>
            <option value="standard">Standard</option>
            <option value="streaming">Streaming</option>
          </Select>
        </FormControl>

        <Button type="submit" colorScheme="teal" leftIcon={<FaRocket />}>
          Submit
        </Button>

        {response && (
          <Box mt={4} p={4} borderWidth="1px" borderRadius="md" width="100%">
            <Heading as="h3" size="md">
              Response:
            </Heading>
            <Text as="pre" whiteSpace="pre-wrap">
              {response}
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default Index;
