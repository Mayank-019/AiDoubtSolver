// content.js

function addChatMessage(sender, text) {
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    chatHistory.push({ sender, text, timestamp: Date.now() });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }
  
  function getChatHistoryText() {
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    let historyText = "";
    for (let i = 0; i < chatHistory.length; i++) {
        historyText += (chatHistory[i].sender === "user" ? "User: " : "AI: ") + chatHistory[i].text + "\n";
    }
    return historyText;
  }
  
  function isRelevant(message) {
    const irrelevantKeywords = ["protein", "diet", "nutrition", "food"];
    for (let i = 0; i < irrelevantKeywords.length; i++) {
        if (message.toLowerCase().indexOf(irrelevantKeywords[i]) !== -1) {
        return false;
      }
    }
    return true;
  }
  
  function injectAskAIButton() {
    console.log("Attempting to inject button...");
    console.log("Current URL:", window.location.href);
  
    if (window.location.href.indexOf("maang.in/problems/") === -1) {
      console.log("Not on a problems page, skipping injection");
      return;
    }
  
    if (document.querySelector(".ask-ai-button")) {
      console.log("Button already exists, skipping injection");
      return;
    }
  
    const targetContainer = document.querySelector(
      ".d-flex.align-items-start.align-items-sm-center.justify-content-between.flex-column.flex-sm-row"
    );
  
    if (!targetContainer) {
      console.error("Could not find the target container for injection");
      return;
    }
  
    console.log("Found target container for AI button injection");
  
    const askAiButton = document.createElement("button");
    askAiButton.type = "button";
    askAiButton.className =
      "ant-btn css-19gw05y ant-btn-default Button_gradient_light_button__ZDAR_ coding_ask_doubt_button__FjwXJ gap-1 py-2 px-3 overflow-hidden ask-ai-button";
    askAiButton.style.height = "fit-content";
    askAiButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="4" y="6" width="16" height="10" rx="2" ry="2" />
        <polygon points="9,16 12,16 10.5,19" />
        <circle cx="9" cy="10" r="1" fill="currentColor"/>
        <circle cx="15" cy="10" r="1" fill="currentColor"/>
        <path d="M9 13 Q12 15 15 13" stroke="currentColor" fill="none" stroke-linecap="round"/>
        <circle cx="3" cy="11" r="1" fill="currentColor"/>
        <circle cx="21" cy="11" r="1" fill="currentColor"/>
        <line x1="12" y1="6" x2="12" y2="3" stroke="currentColor"/>
        <circle cx="12" cy="3" r="1" fill="currentColor"/>
      </svg>
      <span class="coding_ask_doubt_gradient_text__FX_hZ">Ask AI</span>
    `;
  
    const askDoubtButton = targetContainer.querySelector(".coding_ask_doubt_button__FjwXJ");
  
    if (!askDoubtButton) {
      console.error("Could not find 'Ask a doubt' button");
      return;
    }
  
    targetContainer.insertBefore(askAiButton, askDoubtButton);
    console.log("AI button successfully injected");
  
    const chatContainer = document.createElement("div");
    chatContainer.className = "ai-chat-container";
    chatContainer.innerHTML = `
      <div class="chat-header">
        <h3>Ai Doubt Solver</h3>
        <button class="close-chat-btn">×</button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-container">
        <textarea class="chat-input" placeholder="Ask a question about this problem..."></textarea>
        <button class="send-message-btn">Send</button>
      </div>
    `;
    document.body.appendChild(chatContainer);
    console.log("Chat container added to body");
  
    askAiButton.addEventListener("click", function () {
      chatContainer.classList.add("show");
      extractProblemData();
    });
  
    document.querySelector(".close-chat-btn").addEventListener("click", function () {
      chatContainer.classList.remove("show");
    });
  
    document.querySelector(".send-message-btn").addEventListener("click", sendMessage);
    document.querySelector(".chat-input").addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  
    chrome.storage.local.get(["geminiApiKey"], function (result) {
      if (result.geminiApiKey) {
        document.querySelector(".gemini-api-key").value = result.geminiApiKey;
      }
    });
    console.log("Button and chat interface successfully injected");
  }
  
  function extractProblemDetails() {
    try {
        const titleElement = document.querySelector('.text-2xl.font-medium, .problem_heading.fs-4');

        const inputFormat = `The first line of input contains an integer T - the number of test cases.
Each of next T test cases consists of four lines.
First line: A single string components containing lowercase English letters
Second line: A single integer minLength representing the minimum length of the substring
Third line: A single integer maxLength representing the maximum length of the substring
Fourth line: A single integer maxUnique representing the maximum unique characters allowed in the substring`;

        const constraints = `1 ≤ T ≤ 10^5
2 ≤ |components| ≤ 10^5
2 ≤ minLength ≤ maxLength ≤ |components|
2 ≤ maxUnique ≤ 26
The sum of |components| across all test cases does not exceed 10^5.`;

        const sampleInputs = Array.from(document.querySelectorAll('.coding_input_format_container__iYezu .coding_input_format__pv9fS'))
            .filter((_, i) => i % 2 === 0)
            .map(el => el.textContent.trim());

        const sampleOutputs = Array.from(document.querySelectorAll('.coding_input_format_container__iYezu .coding_input_format__pv9fS'))
            .filter((_, i) => i % 2 === 1)
        .map(el => el.textContent.trim());

        const metadataElements = document.querySelectorAll('.problem_paragraph.mb-0');
        let difficulty = '', timeLimit = '', memoryLimit = '', score = '';

        metadataElements.forEach((el, index) => {
            const text = el.textContent.trim();
            if (index === 0) difficulty = text;
            if (index === 2) timeLimit = text;
            if (index === 4) memoryLimit = text;
            if (index === 6) score = text;
        });

      const problemDetails = {
            title: titleElement ? titleElement.textContent.trim() : 'Unknown Problem',
            difficulty: difficulty || 'Unknown',
            timeLimit: timeLimit || 'N/A',
            memoryLimit: memoryLimit || 'N/A',
            score: score || 'N/A',
            description: document.querySelector('.coding_desc__pltWY') ? document.querySelector('.coding_desc__pltWY').textContent.trim() : '',
            inputFormat: inputFormat,
            outputFormat: '',
            constraints: constraints,
            samples: sampleInputs.map((input, i) => ({
                input: input,
                output: sampleOutputs[i] || ''
            })),
            programmingLanguage: detectProgrammingLanguage(),
            url: window.location.href
        };

        console.log('Successfully extracted problem details:', problemDetails);
      return problemDetails;

    } catch (error) {
      console.error('Error extracting problem details:', error);
      return {
            title: document.querySelector('.text-2xl.font-medium, .problem_heading.fs-4') ? document.querySelector('.text-2xl.font-medium, .problem_heading.fs-4').textContent.trim() : 'Unknown Problem',
        difficulty: 'Unknown',
            description: document.querySelector('.coding_desc__pltWY') ? document.querySelector('.coding_desc__pltWY').textContent.trim() : '',
        samples: [],
            programmingLanguage: detectProgrammingLanguage(),
            url: window.location.href
      };
    }
  }
  
  async function makeGeminiApiRequest(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    if (isGreeting(prompt)) {
        return generateGreetingResponse();
    }

    const problemDetails = extractProblemDetails();
    
    if (!isRelevantMessage(prompt)) {
      return "I'm designed to help with coding problems and technical questions. Let's focus on the problem at hand. How can I help you with your coding challenge?";
    }

    const programmingLanguage = detectProgrammingLanguage();
    const chatHistory = formatChatHistoryForPrompt();
    
    let enhancedPrompt = `You are a friendly and helpful coding assistant on MAANG.in. 

PROBLEM DETAILS:
Title: ${problemDetails.title}
Difficulty: ${problemDetails.difficulty}
Time Limit: ${problemDetails.timeLimit}
Memory Limit: ${problemDetails.memoryLimit}
Score: ${problemDetails.score}

Description:
${problemDetails.description}

Input Format:
${problemDetails.inputFormat}

Output Format:
${problemDetails.outputFormat}

Constraints:
${problemDetails.constraints}

Sample Test Cases:
${problemDetails.samples.map((sample, i) => 
  `Sample ${i + 1}:
Input:
${sample.input}
Output:
${sample.output}
`).join('\n')}

Programming Language: ${programmingLanguage}

Previous Conversation:
${chatHistory}

User Question: ${prompt}

Instructions for Code Generation:
1. When showing C++ code, ALWAYS include complete and proper header files at the top (e.g., #include <iostream>, #include <vector>, etc.)
2. Each header file must be on its own line
3. Header files must be properly formatted with angle brackets or quotes (e.g., #include <string> not #include string)
4. Maintain consistent indentation (use 4 spaces)
5. Include all necessary headers for the code to compile
6. Common headers to include when needed:
   - <iostream> for input/output
   - <string> for string operations
   - <vector> for vectors
   - <algorithm> for algorithms like sort, min, max
   - <map> for maps
   - <set> for sets
   - <queue> for queues
   - <stack> for stacks
   - <cmath> for mathematical functions
   - <bits/stdc++.h> for competitive programming (if applicable)
7. Always include 'using namespace std;' after the header files
8. Add appropriate comments to explain the code
9. Ensure proper spacing around operators and after commas
10. End the program with return 0 in main()

General Instructions:
1. If you have the problem details above, provide specific help related to this problem
2. If you don't have complete problem details, ask the user to share the problem they're working on
3. Always provide responses in ${programmingLanguage} when showing code
4. Be friendly and encouraging while maintaining focus on the coding problem
5. If the user asks about previous discussion, use the chat history for context`;

    const data = {
      contents: [{
        parts: [{
          text: enhancedPrompt,
        }],
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      
        if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0] || !responseData.candidates[0].content.parts[0].text) {
        throw new Error("Invalid response format from Gemini API");
      }

      return responseData.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error(`Failed to get response: ${error.message}`);
    }
  }
  
  function extractProblemContext() {
    const title = document.querySelector('h1') ? document.querySelector('h1').textContent : '';
    const problemStatement = document.querySelector('.problem-statement') ? document.querySelector('.problem-statement').textContent : '';
    const codeExamples = Array.from(document.querySelectorAll('pre')).map(pre => pre.textContent).join('\n');
    
    return {
      title,
      problemStatement,
      codeExamples
    };
  }
  
  let chatContext = {
    problemDetails: null,
    messageHistory: [],
    maxHistoryLength: 10
  };
  
  function generateGreeting(problemDetails) {
    const greetings = [
      "Hello! 👋",
      "Hi there! 👋",
        "Welcome! 👋",
      "Greetings! 👋"
    ];

    const timeBasedGreetings = {
      morning: "Good morning! ☀️",
      afternoon: "Good afternoon! 🌤️",
      evening: "Good evening! 🌙"
    };

    const hour = new Date().getHours();
    let timeGreeting;
    if (hour >= 5 && hour < 12) {
      timeGreeting = timeBasedGreetings.morning;
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = timeBasedGreetings.afternoon;
    } else {
      timeGreeting = timeBasedGreetings.evening;
    }

    const casualGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    let message = timeGreeting + " " + casualGreeting + " ";
    
    if (problemDetails.title && problemDetails.title !== 'Unknown Problem') {
      message += `I see you're working on "${problemDetails.title}". `;
      if (problemDetails.difficulty) {
        message += `This is a ${problemDetails.difficulty.toLowerCase()} level problem. `;
      }
      message += "How can I help you solve it?";
    } else {
      message += "I'm your coding assistant. What problem would you like help with?";
    }

    return message;
  }
  
  async function initializeChatContext() {
    try {
        const details = extractProblemDetails();
      chatContext.problemDetails = details;
      
      const chatMessages = document.querySelector(".chat-messages");
      if (chatMessages) {
            chatMessages.innerHTML = "";

            const analysis = `I've analyzed the problem "${details.title}". Here's what I understand:

📝 Problem Type: ${getProblemType(details.description)}
🎯 Difficulty: ${details.difficulty}
⏱️ Time Limit: ${details.timeLimit}
💾 Memory Limit: ${details.memoryLimit}
🏆 Score: ${details.score}

Key Requirements:
${summarizeRequirements(details.description)}

Input Format:
${details.inputFormat}

Output Format:
${details.outputFormat}

There are ${details.samples.length} sample test cases provided.

How would you like to approach this problem? I can help you with:
1. Understanding the problem requirements
2. Developing an algorithm
3. Implementation in ${details.programmingLanguage}
4. Optimizing the solution
5. Test case analysis`;

            addChatMessage('ai', analysis);
            updateChatHistory('assistant', analysis);
      }
    } catch (error) {
      console.error('Error in initializeChatContext:', error);
      addErrorMessage('Failed to initialize chat context. Please refresh the page.');
    }
  }
  
  async function sendMessage() {
    const chatInput = document.querySelector(".chat-input");
    const userMessage = chatInput.value.trim();
    const chatMessages = document.querySelector(".chat-messages");
  
    if (!userMessage) return;
  
    addMessageToChat('user', userMessage);
    chatInput.value = "";
  
    const loadingMessage = addLoadingMessage();
  
    try {
      const result = await chrome.storage.local.get(["geminiApiKey"]);
      
      if (!result.geminiApiKey) {
        throw new Error("Please set your Gemini API key in the extension popup first.");
      }
  
      chatContext.messageHistory.push({
        role: 'user',
        content: userMessage
      });
  
      const response = await makeGeminiApiRequest(result.geminiApiKey, userMessage);
      
      loadingMessage.remove();
  
      addMessageToChat('ai', response);
  
      chatContext.messageHistory.push({
        role: 'assistant',
        content: response
      });
  
    } catch (error) {
      loadingMessage.remove();
      addErrorMessage(error.message);
    }
  
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function addMessageToChat(role, content) {
    const chatMessages = document.querySelector(".chat-messages");
    const messageDiv = document.createElement('div');
    messageDiv.className = role + "-message";
    messageDiv.innerHTML = "<p>" + formatMessage(content) + "</p>";
    chatMessages.appendChild(messageDiv);
    setupCodeCopyButtons();
  }
  
  function addLoadingMessage() {
    const chatMessages = document.querySelector(".chat-messages");
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-message loading';
    loadingDiv.innerHTML = "<p>Thinking</p>";
    chatMessages.appendChild(loadingDiv);
    return loadingDiv;
  }
  
  function addErrorMessage(error) {
    const chatMessages = document.querySelector(".chat-messages");
    const errorDiv = document.createElement('div');
    errorDiv.className = 'ai-message error';
    errorDiv.innerHTML = "<p>Error: " + error + "</p>";
    chatMessages.appendChild(errorDiv);
  }
  
// Completely revised code formatting and display system
function formatMessage(message) {
  let result = "";
  let parts = message.split("```");
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) { 
      // This is a code block
      let codeLines = parts[i].split("\n");
      let language = codeLines[0].trim().toLowerCase();
      let codeText = codeLines.slice(1).join("\n");
      
      // Generate a unique ID for this code block
      let uniqueId = "code-" + Math.random().toString(36).substr(2, 9);
      
      // Create the code block container with proper styling to preserve whitespace
      result += `
        <div class="code-block-container">
          <div class="code-header">
            <span class="code-language">${language}</span>
            <button class="copy-code-btn" data-code-id="${uniqueId}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            </button>
          </div>
          <pre><code id="${uniqueId}" class="language-${language}" data-raw-content="${encodeURIComponent(codeText)}">${codeText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>`;
    } else {
      // This is regular text - process inline code
      let subparts = parts[i].split("`");
      for (let j = 0; j < subparts.length; j++) {
        if (j % 2 === 1) {
          result += "<code>" + subparts[j].replace(/</g, '&lt;').replace(/>/g, '&gt;') + "</code>";
        } else {
          // Convert newlines to <br> tags for regular text
          result += subparts[j].replace(/\n/g, "<br>");
        }
      }
    }
  }
  
  return result;
}

// Updated code copy button handler - completely new approach
function setupCodeCopyButtons() {
  document.querySelectorAll('.copy-code-btn').forEach(button => {
    if (!button.hasListener) {
      button.addEventListener('click', async () => {
        try {
          const codeId = button.getAttribute('data-code-id');
          const codeElement = document.getElementById(codeId);
          
          // Get the raw content directly from the data attribute to preserve all formatting
          let codeText = decodeURIComponent(codeElement.getAttribute('data-raw-content'));
          
          // Copy to clipboard without modifying the content
          await navigator.clipboard.writeText(codeText);
          
          // Visual feedback for successful copy
          const originalText = button.innerHTML;
          button.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
            <span>Copied!</span>`;
          
          setTimeout(() => {
            button.innerHTML = originalText;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
          button.innerHTML = '<span>Failed</span>';
          setTimeout(() => {
            button.innerHTML = originalText;
          }, 2000);
        }
      });
      button.hasListener = true;
    }
  });
}

// Enhanced styles for code blocks
const style = document.createElement('style');
style.textContent = `
  .code-block-container {
    position: relative;
    background: var(--color-background-secondary, #f6f8fa);
    border-radius: 8px;
    margin: 16px 0;
    overflow: hidden;
  }

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--color-background-tertiary, #e7edf3);
    border-bottom: 1px solid var(--color-border, #ddd);
  }
  
  .code-language {
    font-size: 12px;
    color: var(--color-text-secondary, #57606a);
    font-weight: 500;
  }

  .copy-code-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    font-size: 11px;
    color: var(--color-text-secondary, #57606a);
    background: transparent;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .copy-code-btn:hover {
    background: var(--color-background-primary, #fff);
    color: var(--color-text-primary, #24292f);
  }

  .code-block-container pre {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    background: transparent;
  }

  .code-block-container code {
    font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre !important;
    word-spacing: normal;
    word-break: normal;
    tab-size: 4;
    hyphens: none;
    display: block;
    overflow-x: auto;
    color: var(--color-text-primary, #24292f);
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .code-block-container {
      background: var(--color-background-secondary, #161b22);
    }
    
    .code-header {
      background: var(--color-background-tertiary, #0d1117);
      border-color: var(--color-border, #30363d);
    }
    
    .code-language, .copy-code-btn {
      color: var(--color-text-secondary, #8b949e);
    }
    
    .copy-code-btn:hover {
      background: var(--color-background-primary, #0d1117);
      color: var(--color-text-primary, #c9d1d9);
    }
    
    .code-block-container code {
      color: var(--color-text-primary, #c9d1d9);
    }
  }
`;
document.head.appendChild(style);

  function injectButtonDirectly() {
    console.log("Attempting direct button injection");
    const floatingButton = document.createElement("div");
    floatingButton.className = "ask-ai-floating-button";
    floatingButton.innerHTML = "<button>Ask AI</button>";
    floatingButton.style.position = "fixed";
    floatingButton.style.bottom = "20px";
    floatingButton.style.right = "20px";
    floatingButton.style.zIndex = "10000";
    floatingButton.style.backgroundColor = "#4285F4";
    floatingButton.style.color = "white";
    floatingButton.style.borderRadius = "50%";
    floatingButton.style.width = "60px";
    floatingButton.style.height = "60px";
    floatingButton.style.display = "flex";
    floatingButton.style.justifyContent = "center";
    floatingButton.style.alignItems = "center";
    floatingButton.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
    floatingButton.style.cursor = "pointer";
    document.body.appendChild(floatingButton);
    console.log("Floating button added to page");
  
    const chatContainer = document.createElement("div");
    chatContainer.className = "ai-chat-container";
    chatContainer.style.display = "none";
    chatContainer.innerHTML = `
      <div class="chat-header">
        <h3>Ai Doubt Solver</h3>
        <button class="close-chat-btn">×</button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-container">
        <textarea class="chat-input" placeholder="Ask a question about this problem..."></textarea>
        <button class="send-message-btn">Send</button>
      </div>
    `;
    chatContainer.style.position = "fixed";
    chatContainer.style.bottom = "90px";
    chatContainer.style.right = "20px";
    chatContainer.style.width = "350px";
    chatContainer.style.height = "500px";
    chatContainer.style.backgroundColor = "white";
    chatContainer.style.borderRadius = "10px";
    chatContainer.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.2)";
    chatContainer.style.zIndex = "10001";
    chatContainer.style.overflow = "hidden";
    chatContainer.style.display = "flex";
    chatContainer.style.flexDirection = "column";
    document.body.appendChild(chatContainer);
  
    const chatHeader = chatContainer.querySelector(".chat-header");
    chatHeader.style.backgroundColor = "#4285F4";
    chatHeader.style.color = "white";
    chatHeader.style.padding = "15px";
    chatHeader.style.display = "flex";
    chatHeader.style.justifyContent = "space-between";
    chatHeader.style.alignItems = "center";
  
    const chatMessages = chatContainer.querySelector(".chat-messages");
    chatMessages.style.flex = "1";
    chatMessages.style.overflowY = "auto";
    chatMessages.style.padding = "15px";
  
    const chatInputContainer = chatContainer.querySelector(".chat-input-container");
    chatInputContainer.style.display = "flex";
    chatInputContainer.style.padding = "10px";
    chatInputContainer.style.borderTop = "1px solid #ddd";
  
    const chatInput = chatContainer.querySelector(".chat-input");
    chatInput.style.flex = "1";
    chatInput.style.padding = "10px";
    chatInput.style.border = "1px solid #ddd";
    chatInput.style.borderRadius = "4px";
    chatInput.style.resize = "none";
    chatInput.style.height = "40px";
  
    const sendButton = chatContainer.querySelector(".send-message-btn");
    sendButton.style.backgroundColor = "#4285F4";
    sendButton.style.color = "white";
    sendButton.style.border = "none";
    sendButton.style.borderRadius = "4px";
    sendButton.style.padding = "0 15px";
    sendButton.style.marginLeft = "10px";
    sendButton.style.cursor = "pointer";
  
    floatingButton.addEventListener("click", function () {
      chatContainer.style.display = "flex";
      extractProblemData();
    });
  
    document.querySelector(".close-chat-btn").addEventListener("click", function () {
      chatContainer.style.display = "none";
    });
  
    document.querySelector(".send-message-btn").addEventListener("click", sendMessage);
    document.querySelector(".chat-input").addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  
    chrome.storage.local.get(["gemini-api-key"], function (result) {
      if (result.geminiApiKey) {
        document.querySelector(".gemini-api-key").value = result.geminiApiKey;
      }
    });
    console.log("Floating button and chat interface successfully injected");
  }
  
  function initializeExtension() {
    console.log("Initializing extension");
    try {
      injectAskAIButton();
    } catch (error) {
      console.error("Error in standard injection:", error);
      try {
        injectButtonDirectly();
      } catch (error2) {
        console.error("Error in direct injection:", error2);
      }
    }
    try {
      const observer = new MutationObserver(function (mutations) {
        if (
                window.location.href.indexOf("maang.in/problems/") !== -1 &&
          !document.querySelector(".ask-ai-button") &&
          !document.querySelector(".ask-ai-floating-button")
        ) {
          console.log("DOM changed, attempting to reinject button");
          try {
            injectAskAIButton();
          } catch (error) {
            console.error("Error in reinjection:", error);
            injectButtonDirectly();
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      console.log("Observer setup complete");
    } catch (error) {
      console.error("Error setting up observer:", error);
    }
  }
  
  console.log("Content script loaded");
  
  if (document.readyState === "loading") {
    console.log("Document still loading, waiting for DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", function () {
      console.log("DOMContentLoaded fired");
      setTimeout(initializeExtension, 1500);
    });
  } else {
    console.log("Document already loaded, initializing directly");
    setTimeout(initializeExtension, 1500);
  }
  
  setTimeout(function () {
    if (
      !document.querySelector(".ask-ai-button") &&
      !document.querySelector(".ask-ai-floating-button")
    ) {
      console.log("No button found after wait, trying again");
      initializeExtension();
    }
  }, 3000);
  
  function isProblemPage() {
    return window.location.href.indexOf('/problems/') !== -1 || 
           document.querySelector('.problem-text') !== null ||
           document.querySelector('.text-2xl.font-medium') !== null;
  }
  
  function observeProblemChanges() {
    if (!isProblemPage()) return;

    const observer = new MutationObserver(() => {
        if (isProblemPage()) {
            const newDetails = extractProblemDetails();
            if (newDetails && (!chatContext.problemDetails || chatContext.problemDetails.title !== newDetails.title)) {
                console.log('Problem changed, updating context...');
                chatContext.messageHistory = [];
                chatContext.problemDetails = newDetails;
                initializeChatContext();
            }
        }
    });

    const mainContent = document.querySelector('main') || document.body;
    observer.observe(mainContent, {
        subtree: true,
        childList: true,
        characterData: true
    });
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    if (isProblemPage()) {
        setTimeout(() => {
            const details = extractProblemDetails();
            console.log('Initial problem details:', details);
            chatContext.problemDetails = details;
            initializeChatContext();
            observeProblemChanges();
        }, 1000);
    }
  });

function isGreeting(message) {
    const greetingPatterns = [
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening"
    ];
    message = message.trim().toLowerCase();
    for (let i = 0; i < greetingPatterns.length; i++) {
        if (message === greetingPatterns[i] || message.indexOf(greetingPatterns[i] + " ") === 0) {
            return true;
        }
    }
    return false;
}

function generateGreetingResponse() {
    const greetings = [
        "Hello! 👋",
        "Hi there! 👋",
        "Hey! 👋",
        "Greetings! 👋"
    ];

    const timeBasedGreetings = {
        morning: "Good morning! ☀️",
        afternoon: "Good afternoon! 🌤️",
        evening: "Good evening! 🌙"
    };

    const hour = new Date().getHours();
    let timeGreeting;
    if (hour >= 5 && hour < 12) {
        timeGreeting = timeBasedGreetings.morning;
    } else if (hour >= 12 && hour < 18) {
        timeGreeting = timeBasedGreetings.afternoon;
    } else {
        timeGreeting = timeBasedGreetings.evening;
    }

    const casualGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    return timeGreeting + " " + casualGreeting + " How can I assist you with your coding today?";
}
  
  function isRelevantMessage(message) {
    if (isGreeting(message)) {
        return true;
    }
    const relevantKeywords = [
      'code', 'problem', 'solution', 'algorithm', 'error', 'bug', 'function',
      'programming', 'debug', 'help', 'explain', 'how', 'why', 'what',
      'complexity', 'time', 'space', 'approach', 'method', 'implement',
      'optimize', 'improve', 'fix', 'issue', 'test', 'case', 'example',
        'hint', 'stuck', 'understand', 'logic', 'data', 'structure', 'solve'
    ];
    const irrelevantPatterns = [
        "weather", "sports", "movies", "music", "eat", "food", "drink", "game", "play"
    ];
    message = message.toLowerCase();
    for (let i = 0; i < irrelevantPatterns.length; i++) {
        if (message.indexOf(irrelevantPatterns[i]) !== -1) {
            return false;
        }
    }
    for (let i = 0; i < relevantKeywords.length; i++) {
        if (message.indexOf(relevantKeywords[i]) !== -1) {
      return true;
    }
    }
      return false;
  }

  function updateChatHistory(role, message, isRelevant = true) {
    if (isRelevant) {
      chatContext.messageHistory.push({
            role: role,
        content: message,
        timestamp: new Date().toISOString()
      });

      if (chatContext.messageHistory.length > chatContext.maxHistoryLength * 2) {
        chatContext.messageHistory = chatContext.messageHistory.slice(-chatContext.maxHistoryLength * 2);
      }
    }
  }

  function formatChatHistoryForPrompt() {
    return chatContext.messageHistory
        .map(msg => msg.role + ": " + msg.content)
        .join("\n\n");
  }
  
  function detectProgrammingLanguage() {
    try {
      const languageSelector = document.querySelector('.ant-select-selection-item');
      if (languageSelector) {
        const languageText = languageSelector.textContent.trim();
        
        const languageMap = {
          'C++14': 'cpp',
          'C++17': 'cpp',
          'C++': 'cpp',
          'Python3': 'python',
          'Python': 'python',
          'Java': 'java',
          'JavaScript': 'javascript',
          'JS': 'javascript',
          'C#': 'csharp',
          'Go': 'go',
          'Ruby': 'ruby',
          'PHP': 'php',
          'Swift': 'swift',
          'Kotlin': 'kotlin',
          'Rust': 'rust'
        };

            for (let key in languageMap) {
                if (languageText.indexOf(key) !== -1) {
                    console.log('Detected programming language:', languageMap[key]);
                    return languageMap[key];
                }
            }
        }

      console.log('No language detected, defaulting to cpp');
      return 'cpp';
    } catch (error) {
      console.error('Error detecting programming language:', error);
        return 'cpp';
    }
}

function getElementByText(selector, text) {
    const elements = document.querySelectorAll(selector);
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].textContent.trim().toLowerCase().indexOf(text.toLowerCase()) !== -1) {
            return elements[i];
        }
    }
    return null;
}

function getProblemType(description) {
    const types = {
        'array': ['array', 'elements', 'sequence'],
        'string': ['string', 'substring', 'palindrome'],
        'graph': ['graph', 'tree', 'path'],
        'dynamic programming': ['maximum', 'minimum', 'optimal'],
        'greedy': ['smallest', 'largest', 'maximum possible']
    };

    for (let type in types) {
        let keywords = types[type];
        for (let i = 0; i < keywords.length; i++) {
            if (description.toLowerCase().indexOf(keywords[i]) !== -1) {
                return type.charAt(0).toUpperCase() + type.slice(1);
            }
        }
    }
    return 'Algorithm';
}

function summarizeRequirements(description) {
    let sentences = description.split(".");
    return sentences.slice(0, 2).join(".") + ".";
}
  