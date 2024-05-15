# clean-proxy-server

I want to convert this into a better looking project.  Please use the following code to transform into something nice and clean that maintains the functionality.  This is JS client code serving an index.html with an express js proxy server.  Current Project Structure:
Project Root > server.js
Project Root > anthropic_js_call.js
Project Root > google_js_call.js
Project Root > openai_js_call.js
Project Root > Public > Index.html

Each files code follows:

//Project Root > server.js code
///////////////////////////////
const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/api/call-llm/:provider', (req, res) => {
  const { provider } = req.params;
  const { model, content, responseType } = req.body;

  let command;
  switch (provider) {
    case 'anthropic':
      command = `node ${path.join(__dirname, 'anthropic_js_call.js')} ${model} "${content}" ${responseType}`;
      break;
    case 'google':
      command = `node ${path.join(__dirname, 'google_js_call.js')} ${model} "${content}" ${responseType}`;
      break;
    case 'openai':
      command = `node ${path.join(__dirname, 'openai_js_call.js')} ${model} "${content}" ${responseType}`;
      break;
    default:
      res.status(400).send('Invalid provider');
      return;
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      res.status(500).send(`Error: ${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

//Project Root > anthropic_js_call.js code
//////////////////////////////////////////
const axios = require('axios');
const readline = require('readline');

// Get the API key from the environment variable
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    process.exit(1);
}

const model = process.argv[2];
const content = process.argv[3];
const responseType = process.argv[4]; // 'standard', 'streaming', or 'headers'

if (!model || !content || !responseType) {
    console.error("Usage: python callAnthropic.py <model> <content> <response_type> Valid Response Types: 'standard' for a standard response, 'streaming' for a streaming response, or 'headers' for a customer headers response.");
    process.exit(1);
}

const headers = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'messages-2023-12-15',  // Assuming this is needed based on your example
    'Content-Type': 'application/json'
};

const url = 'https://api.anthropic.com/v1/messages';

async function standardRequest(model, content) {
    console.log("----- standard request -----");
    try {
        const response = await axios.post(url, {
            model: model,
            messages: [
                { role: 'user', content: content }
            ],
            max_tokens: 1024
        }, { headers });

        if (response.data && response.data.content) {
            console.log(response.data.content[0].text);
        } else {
            console.log("No content found in the response.");
        }
    } catch (error) {
        console.error(`Error: ${error.response ? error.response.status : error.message}, ${error.response ? error.response.data : ''}`);
    }
}

async function streamingRequest(model, content) {
    console.log("----- streaming request -----");
    try {
        await new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: url,
                headers: headers,
                data: {
                    model: model,
                    messages: [
                        { role: 'user', content: content }
                    ],
                    max_tokens: 1024,
                    stream: true
                },
                responseType: 'stream'
            }).then(response => {
                const rl = readline.createInterface({
                    input: response.data,
                    crlfDelay: Infinity
                });

                let completeResponse = '';
                rl.on('line', (line) => {
                    if (line.startsWith('data: ')) {
                        const eventData = line.substring(6).trim();
                        try {
                            const eventJson = JSON.parse(eventData);
                            if (eventJson.type === 'content_block_delta' && eventJson.delta && eventJson.delta.text) {
                                const text = eventJson.delta.text;
                                completeResponse += text;
                                process.stdout.write(text); // Print incrementally
                            }
                        } catch (e) {
                            // Ignore JSON parse errors
                        }
                    }
                });

                rl.on('close', () => {
                    console.log("\nComplete response:", completeResponse);
                    resolve();
                });
            }).catch(error => {
                console.error(`Error: ${error.response ? error.response.status : error.message}, ${error.response ? error.response.data : ''}`);
                reject();
            });
        });
    } catch (error) {
        console.error(`Error: ${error.response ? error.response.status : error.message}, ${error.response ? error.response.data : ''}`);
    }
}

async function customHeadersRequest(model, content) {
    console.log("----- custom response headers test -----");
    try {
        const response = await axios.post(url, {
            model: model,
            messages: [
                { role: 'user', content: content }
            ],
            max_tokens: 1024
        }, { headers });

        if (response.data) {
            console.log(response.data.id || "No ID found in the response.");
            if (response.data.content) {
                console.log(response.data.content[0].text || "No content found in the response.");
            } else {
                console.log("No content found in the response.");
            }
        }
    } catch (error) {
        console.error(`Error: ${error.response ? error.response.status : error.message}, ${error.response ? error.response.data : ''}`);
    }
}

async function generateCompletion(model, content, responseType) {
    if (responseType === 'standard') {
        await standardRequest(model, content);
    } else if (responseType === 'streaming') {
        await streamingRequest(model, content);
    } else if (responseType === 'headers') {
        await customHeadersRequest(model, content);
    } else {
        console.error("Invalid response type. 'standard' for a standard response, 'streaming' for a streaming response, or 'headers' for a customer headers response.");
    }
}

generateCompletion(model, content, responseType);

//Project Root > google_js_call.js code
///////////////////////////////////////
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to generate text from text-only input
async function generateTextFromTextOnly(model, content) {
  console.log("----- standard request -----");
  const result = await model.generateContent(content);
  const response = await result.response;
  const text = response.text();
  console.log("Text-only response:", text);
}

// Function to use streaming for faster interactions
async function useStreaming(model, content) {
  console.log("----- streaming request -----");
  const result = await model.generateContentStream(content);
  let text = '';
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    process.stdout.write(chunkText); // Incremental printing
    text += chunkText;
  }
  console.log("\nStreaming response:", text);
}

// Main function to execute based on the specified response type
async function generateCompletion(modelName, content, responseType) {
  const model = genAI.getGenerativeModel({ model: modelName });
  if (responseType === 'standard') {
    await generateTextFromTextOnly(model, content);
  } else if (responseType === 'streaming') {
    await useStreaming(model, content);
  } else {
    console.error("Invalid response type. Use 'standard' or 'streaming'.");
  }
}

if (process.argv.length !== 5) {
  console.error("Usage: node callGemini.js <model_name> <content> <response_type>");
  process.exit(1);
}

const modelName = process.argv[2];
const content = process.argv[3];
const responseType = process.argv[4];

generateCompletion(modelName, content, responseType);

//Project Root > openai_js_call.js code
///////////////////////////////////////
const { OpenAI } = require("openai");
const fetch = require("node-fetch");

async function standardRequest(openai, model, content) {
  console.log("----- standard request -----");
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [{ role: "user", content: content }],
  });
  console.log(completion.choices[0].message.content);
}

async function streamingRequest(openai, model, content) {
  console.log("----- streaming request -----");
  const stream = await openai.chat.completions.create({
    model: model,
    messages: [{ role: "user", content: content }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
  console.log(); // Newline after streaming output
}

async function customHeadersRequest(model, content) {
  console.log("----- custom response headers test -----");

  try {
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Response-Format': 'json'
    });

    const body = JSON.stringify({
      model: model,
      messages: [{ role: "user", content: content }],
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: body,
    });

    const responseData = await response.json();
    console.log(response.headers.get("x-request-id"));
    console.log(responseData.choices[0].message.content);

  } catch (error) {
    console.error("Error retrieving response or request ID:", error);
  }
}

async function generateCompletion(model, content, responseType) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (responseType === 'standard') {
    await standardRequest(openai, model, content);
  } else if (responseType === 'streaming') {
    await streamingRequest(openai, model, content);
  } else if (responseType === 'headers') {
    await customHeadersRequest(model, content);
  } else {
    console.error("Invalid response type. Use 'standard', 'streaming', or 'headers'.");
  }
}

if (process.argv.length !== 5) {
  console.error("Usage: node callOpenAI.js <model> <content> <response_type>");
  process.exit(1);
}

const model = process.argv[2];
const content = process.argv[3];
const responseType = process.argv[4];

generateCompletion(model, content, responseType);

//Project Root > Public > Index.html code
/////////////////////////////////////////
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LLM API Call</title>
  <style>
    #modelFieldset { display: none; }
  </style>
</head>
<body>
  <form id="apiForm">
    <fieldset>
      <legend>Select LLM Provider:</legend>
      <label><input type="checkbox" name="provider" value="openai"> OpenAI</label>
      <label><input type="checkbox" name="provider" value="anthropic"> Anthropic</label>
      <label><input type="checkbox" name="provider" value="google"> Google</label>
    </fieldset>
    
    <fieldset id="modelFieldset">
      <legend>Select Model:</legend>
      <div id="openaiModels" class="providerModels" data-provider="openai">
        <h4>OpenAI Models</h4>
        <label><input type="radio" name="openaiModel" value="gpt-4o"> GPT 4o</label>
        <label><input type="radio" name="openaiModel" value="gpt-4-turbo"> GPT 4 Turbo</label>
        <label><input type="radio" name="openaiModel" value="gpt-3.5-turbo-0125"> GPT 3.5 Turbo Flagship</label>
      </div>
      <div id="anthropicModels" class="providerModels" data-provider="anthropic">
        <h4>Anthropic Models</h4>
        <label><input type="radio" name="anthropicModel" value="claude-3-opus-20240229"> Claude 3 Opus</label>
        <label><input type="radio" name="anthropicModel" value="claude-3-sonnet-20240229"> Claude 3 Sonnet</label>
        <label><input type="radio" name="anthropicModel" value="claude-3-haiku-20240307"> Claude 3 Haiku</label>
      </div>
      <div id="googleModels" class="providerModels" data-provider="google">
        <h4>Google Models</h4>
        <label><input type="radio" name="googleModel" value="gemini-1.5-pro-latest"> Gemini 1.5 Pro</label>
        <label><input type="radio" name="googleModel" value="gemini-pro"> Gemini 1 Pro</label>
      </div>
    </fieldset>

    <label for="content">Content:</label>
    <textarea id="content" name="content" required></textarea>
    
    <label for="responseType">Response Type:</label>
    <select id="responseType" name="responseType">
      <option value="standard">Standard</option>
      <option value="streaming">Streaming</option>
    </select>
    
    <button type="submit">Submit</button>
  </form>
  
  <div id="responseBox">
    <h3>Response:</h3>
    <pre id="responseContent"></pre>
  </div>

  <script>
    document.querySelectorAll('input[name="provider"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateModels);
    });

    function updateModels() {
      const selectedProviders = Array.from(document.querySelectorAll('input[name="provider"]:checked')).map(cb => cb.value);
      const modelFieldset = document.getElementById('modelFieldset');
      modelFieldset.style.display = selectedProviders.length ? 'block' : 'none';

      document.querySelectorAll('.providerModels').forEach(div => {
        div.style.display = selectedProviders.includes(div.getAttribute('data-provider')) ? 'block' : 'none';
      });
    }

    document.getElementById('apiForm').addEventListener('submit', async function(event) {
      event.preventDefault();

      const providers = Array.from(document.querySelectorAll('input[name="provider"]:checked')).map(cb => cb.value);
      const content = document.getElementById('content').value;
      const responseType = document.getElementById('responseType').value;

      document.getElementById('responseContent').textContent = ''; // Clear previous responses

      for (const provider of providers) {
        let model;
        if (provider === 'openai') {
          model = document.querySelector('input[name="openaiModel"]:checked').value;
        } else if (provider === 'anthropic') {
          model = document.querySelector('input[name="anthropicModel"]:checked').value;
        } else if (provider === 'google') {
          model = document.querySelector('input[name="googleModel"]:checked').value;
        }

        const response = await fetch(`/api/call-llm/${provider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ model, content, responseType })
        });

        const responseData = await response.text();
        document.getElementById('responseContent').textContent += `${provider.toUpperCase()} Response:\n${responseData}\n\n`;
      }
    });
  </script>
</body>
</html>

## Collaborate with GPT Engineer

This is a [gptengineer.app](https://gptengineer.app)-synced repository 🌟🤖

Changes made via gptengineer.app will be committed to this repo.

If you clone this repo and push changes, you will have them reflected in the GPT Engineer UI.

## Tech stack

This project is built with React and Chakra UI.

- Vite
- React
- Chakra UI

## Setup

```sh
git clone https://github.com/GPT-Engineer-App/clean-proxy-server.git
cd clean-proxy-server
npm i
```

```sh
npm run dev
```

This will run a dev server with auto reloading and an instant preview.

## Requirements

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
