// Function to add a chat message to local storage
function addChatMessage(sender, text) {
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    chatHistory.push({ sender, text, timestamp: Date.now() });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }
  
  // Function to retrieve conversation history as text
  function getChatHistoryText() {
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    let historyText = "";
    chatHistory.forEach(item => {
      historyText += (item.sender === "user" ? "User: " : "AI: ") + item.text + "\n";
    });
    return historyText;
  }
  
  // Function to check if the user's message is relevant to the problem
  function isRelevant(message) {
    const irrelevantKeywords = ["protein", "diet", "nutrition", "food"];
    for (const word of irrelevantKeywords) {
      if (message.toLowerCase().includes(word)) {
        return false;
      }
    }
    return true;
  }
  
  // Function to inject the "Ask AI" button
  function injectAskAIButton() {
    console.log("Attempting to inject button...");
    console.log("Current URL:", window.location.href);
  
    // Check if we're on a problem page
    if (!window.location.href.includes("maang.in/problems/")) {
      console.log("Not on a problems page, skipping injection");
      return;
    }
  
    // Check if button already exists
    if (document.querySelector(".ask-ai-button")) {
      console.log("Button already exists, skipping injection");
      return;
    }
  
    // Find the container that holds the problem heading and "Ask a doubt" button
    const targetContainer = document.querySelector(
      ".d-flex.align-items-start.align-items-sm-center.justify-content-between.flex-column.flex-sm-row"
    );
  
    if (!targetContainer) {
      console.error("Could not find the target container for injection");
      return;
    }
  
    console.log("Found target container for AI button injection");
  
    // Create the AI button with the same styling as the "Ask a doubt" button
    const askAiButton = document.createElement("button");
    askAiButton.type = "button";
    // Use the same classes as the "Ask a doubt" button and add our custom class
    askAiButton.className =
      "ant-btn css-19gw05y ant-btn-default Button_gradient_light_button__ZDAR_ coding_ask_doubt_button__FjwXJ gap-1 py-2 px-3 overflow-hidden ask-ai-button";
    askAiButton.style.height = "fit-content";
    askAiButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <!-- Chat bubble base -->
        <rect x="4" y="6" width="16" height="10" rx="2" ry="2" />
        <polygon points="9,16 12,16 10.5,19" />
        <!-- Robot face inside: two eyes and a smile -->
        <circle cx="9" cy="10" r="1" fill="currentColor"/>
        <circle cx="15" cy="10" r="1" fill="currentColor"/>
        <path d="M9 13 Q12 15 15 13" stroke="currentColor" fill="none" stroke-linecap="round"/>
        <!-- Ears: circles outside left and right -->
        <circle cx="3" cy="11" r="1" fill="currentColor"/>
        <circle cx="21" cy="11" r="1" fill="currentColor"/>
        <!-- Antenna: a line from top center and a circle -->
        <line x1="12" y1="6" x2="12" y2="3" stroke="currentColor"/>
        <circle cx="12" cy="3" r="1" fill="currentColor"/>
      </svg>
      <span class="coding_ask_doubt_gradient_text__FX_hZ">Ask AI</span>
    `;
  
    // Find the existing "Ask a doubt" button
    const askDoubtButton = targetContainer.querySelector(".coding_ask_doubt_button__FjwXJ");
  
    if (!askDoubtButton) {
      console.error("Could not find 'Ask a doubt' button");
      return;
    }
  
    // Insert AI button before "Ask a doubt" button
    targetContainer.insertBefore(askAiButton, askDoubtButton);
    console.log("AI button successfully injected");
  
    // Create the chat container (initially hidden)
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
      <div class="api-key-container">
        <input type="password" class="gemini-api-key" placeholder="Enter your Gemini API key">
        <button class="save-api-key-btn">Save Key</button>
      </div>
    `;
    document.body.appendChild(chatContainer);
    console.log("Chat container added to body");
  
    // Add event listeners for chat interactions
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
  
    document.querySelector(".save-api-key-btn").addEventListener("click", saveApiKey);
  
    // Load API key if saved
    chrome.storage.local.get(["geminiApiKey"], function (result) {
      if (result.geminiApiKey) {
        document.querySelector(".gemini-api-key").value = result.geminiApiKey;
      }
    });
    console.log("Button and chat interface successfully injected");
  }
  
  // Extract problem data from the page
  function extractProblemData() {
    console.log("Extracting problem data");
    let problemData = {
      title: "",
      statement: "",
      hints: ""
    };
  
    const titleElements = [
      document.querySelector(".page-title-text h1"),
      document.querySelector("h1"),
      document.querySelector(".problem-title"),
      document.querySelector(".card-title")
    ];
  
    for (const elem of titleElements) {
      if (elem) {
        problemData.title = elem.textContent.trim();
        console.log("Found title:", problemData.title);
        break;
      }
    }
  
    if (!problemData.title) {
      const urlParts = window.location.pathname.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      problemData.title = lastPart.replace(/-/g, " ");
      console.log("Generated title from URL:", problemData.title);
    }
  
    const statementElements = [
      document.querySelector(".problem-statement"),
      document.querySelector(".problem-description"),
      document.querySelector(".problem-text"),
      document.querySelector(".card.card-body"),
      document.querySelector(".card p")
    ];
  
    for (const elem of statementElements) {
      if (elem) {
        problemData.statement = elem.textContent.trim();
        console.log("Found problem statement with length:", problemData.statement.length);
        break;
      }
    }
  
    const hintsElements = [
      document.querySelector(".problem-hints"),
      document.querySelector(".hints"),
      document.querySelector(".card small")
    ];
  
    for (const elem of hintsElements) {
      if (elem) {
        problemData.hints = elem.textContent.trim();
        console.log("Found hints with length:", problemData.hints.length);
        break;
      }
    }
  
    if (!problemData.statement) {
      const mainContent = document.querySelector("main") ||
        document.querySelector(".main-content") ||
        document.querySelector(".content") ||
        document.querySelector(".card");
      if (mainContent) {
        problemData.statement = mainContent.textContent.trim();
        console.log("Got fallback statement with length:", problemData.statement.length);
      }
    }
  
    chrome.storage.local.set({ problemData: problemData });
  
    const chatMessages = document.querySelector(".chat-messages");
    chatMessages.innerHTML = `
      <div class="ai-message">
        <p>I've analyzed the following problem:</p>
        <p><strong>Title:</strong> ${problemData.title || "Unknown problem"}</p>
        <p>How can I help you with this problem?</p>
      </div>
    `;
  }
  
  // Send message to Gemini API and manage interactivity
  function sendMessage() {
    const chatInput = document.querySelector(".chat-input");
    const userMessage = chatInput.value.trim();
    const chatMessages = document.querySelector(".chat-messages");
  
    if (!userMessage) return;
  
    // Check message relevance
    if (!isRelevant(userMessage)) {
      chatMessages.innerHTML += `
        <div class="ai-message">
          <p>I am not made for this.</p>
        </div>
      `;
      chatInput.value = "";
      return;
    }
  
    // Store user message
    addChatMessage("user", userMessage);
  
    // Add user message to chat
    chatMessages.innerHTML += `
      <div class="user-message">
        <p>${userMessage}</p>
      </div>
    `;
    chatInput.value = "";
  
    // Show loading indicator
    chatMessages.innerHTML += `
      <div class="ai-message loading" id="loading-message">
        <p>Thinking...</p>
      </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  
    // Retrieve problem data and conversation history
    chrome.storage.local.get(["problemData"], function (result) {
      const problemData = result.problemData || { title: "", statement: "", hints: "" };
      const historyText = getChatHistoryText();
  
      let prompt = "";
      // If the user's message contains "solution" or "code", provide a complete solution.
      if (userMessage.toLowerCase().includes("solution") || userMessage.toLowerCase().includes("code")) {
        prompt = `
  Conversation history:
  ${historyText}
  
  I need help with the following DSA problem from MAANG.in:
  
  Title: ${problemData.title || "Unknown problem"}
  
  Problem Statement: ${problemData.statement || "No statement available"}
  
  ${problemData.hints ? "Hints: " + problemData.hints : ""}
  
  My question: ${userMessage}
  
  Please provide a complete solution that includes both a brute-force approach and an optimal approach, with detailed explanations and code examples.
  `;
      } else {
        // Otherwise, behave interactively.
        prompt = `
  Conversation history:
  ${historyText}
  
  I need help with the following DSA problem from MAANG.in:
  
  Title: ${problemData.title || "Unknown problem"}
  
  Problem Statement: ${problemData.statement || "No statement available"}
  
  ${problemData.hints ? "Hints: " + problemData.hints : ""}
  
  My question: ${userMessage}
  
  Please behave like ChatGPT—respond in an interactive and conversational manner.
  Ask clarifying questions if needed, and do not provide a complete solution until explicitly requested.
  `;
      }
  
      // Call Gemini API with the constructed prompt
      makeGeminiApiRequest(document.querySelector(".gemini-api-key").value.trim(), prompt)
        .then((response) => {
          const loadingMessage = document.getElementById("loading-message");
          if (loadingMessage) {
            loadingMessage.remove();
          }
          chatMessages.innerHTML += `
            <div class="ai-message">
              <p>${formatResponse(response)}</p>
            </div>
          `;
          addChatMessage("ai", response);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        })
        .catch((error) => {
          const loadingMessage = document.getElementById("loading-message");
          if (loadingMessage) {
            loadingMessage.remove();
          }
          chatMessages.innerHTML += `
            <div class="ai-message error">
              <p>Error: ${error.message || "Failed to get response from Gemini API"}</p>
            </div>
          `;
          chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    });
  }
  
  // Format the AI response with markdown styling
  function formatResponse(text) {
    text = text.replace(/```(\\w*)([\\s\\S]*?)```/g, function (match, language, code) {
      return `<pre><code class="${language}">${code}</code></pre>`;
    });
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    text = text.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    text = text.replace(/^# (.*$)/gm, "<h1>$1</h1>");
    text = text.replace(/^\\* (.*$)/gm, "<li>$1</li>");
    text = text.replace(/^- (.*$)/gm, "<li>$1</li>");
    text = text.replace(/\\n\\n/g, "</p><p>");
    return "<p>" + text + "</p>";
  }
  
  // Make request to Gemini API
  async function makeGeminiApiRequest(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const data = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    };
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const responseData = await response.json();
  
      if (
        responseData.candidates &&
        responseData.candidates[0] &&
        responseData.candidates[0].content &&
        responseData.candidates[0].content.parts &&
        responseData.candidates[0].content.parts[0]
      ) {
        return responseData.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Unexpected response format from Gemini API");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  }
  
  // Save API key to Chrome storage
  function saveApiKey() {
    const apiKey = document.querySelector(".gemini-api-key").value.trim();
    if (apiKey) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, function () {
        alert("API key saved successfully!");
      });
    } else {
      alert("Please enter a valid API key.");
    }
  }
  
  // Alternative approach: Direct button injection
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
      <div class="api-key-container">
        <input type="password" class="gemini-api-key" placeholder="Enter your Gemini API key">
        <button class="save-api-key-btn">Save Key</button>
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
  
    const apiKeyContainer = chatContainer.querySelector(".api-key-container");
    apiKeyContainer.style.padding = "10px";
    apiKeyContainer.style.borderTop = "1px solid #ddd";
    apiKeyContainer.style.display = "flex";
  
    const apiKeyInput = chatContainer.querySelector(".gemini-api-key");
    apiKeyInput.style.flex = "1";
    apiKeyInput.style.padding = "8px";
    apiKeyInput.style.border = "1px solid #ddd";
    apiKeyInput.style.borderRadius = "4px";
  
    const saveKeyButton = chatContainer.querySelector(".save-api-key-btn");
    saveKeyButton.style.backgroundColor = "#34A853";
    saveKeyButton.style.color = "white";
    saveKeyButton.style.border = "none";
    saveKeyButton.style.borderRadius = "4px";
    saveKeyButton.style.padding = "0 15px";
    saveKeyButton.style.marginLeft = "10px";
    saveKeyButton.style.cursor = "pointer";
  
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
  
    document.querySelector(".save-api-key-btn").addEventListener("click", saveApiKey);
  
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
          window.location.href.includes("maang.in/problems/") &&
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
  