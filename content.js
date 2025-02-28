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
  
    // Load API key if saved
    chrome.storage.local.get(["geminiApiKey"], function (result) {
      if (result.geminiApiKey) {
        document.querySelector(".gemini-api-key").value = result.geminiApiKey;
      }
    });
    console.log("Button and chat interface successfully injected");
  }
  
  // Function to extract problem details
  function extractProblemDetails() {
    try {
      // Extract problem title
      const titleElement = document.querySelector('.text-2xl.font-medium, .problem_heading.fs-4');

      // Extract problem description
      const descriptionElement = document.querySelector('.coding_desc__pltWY');
      
      // Extract input format
      const inputFormatSection = document.querySelector('h5.problem_heading.mt-4:contains("Input Format")');
      const inputFormatElement = inputFormatSection?.nextElementSibling?.querySelector('.coding_input_format__pv9fS');
      
      // Extract output format
      const outputFormatSection = document.querySelector('h5.problem_heading.mt-4:contains("Output Format")');
      const outputFormatElement = outputFormatSection?.nextElementSibling?.querySelector('.coding_input_format__pv9fS');
      
      // Extract constraints
      const constraintsSection = document.querySelector('h5.problem_heading.mt-4:contains("Constraints")');
      const constraintsElement = constraintsSection?.nextElementSibling?.querySelector('.coding_input_format__pv9fS');
      
      // Extract sample test cases
      const sampleInputs = Array.from(document.querySelectorAll('.coding_input_format_container__iYezu .coding_input_format__pv9fS'))
        .filter((_, i) => i % 2 === 0)
        .map(el => el.textContent.trim());
        
      const sampleOutputs = Array.from(document.querySelectorAll('.coding_input_format_container__iYezu .coding_input_format__pv9fS'))
        .filter((_, i) => i % 2 === 1)
        .map(el => el.textContent.trim());

      // Extract metadata (difficulty, time limit, etc.)
      const metadataElements = document.querySelectorAll('.problem_paragraph.mb-0');
      let difficulty = '', timeLimit = '', memoryLimit = '', score = '';
      
      metadataElements.forEach((el, index) => {
        const text = el.textContent.trim();
        if (index === 0) difficulty = text;
        if (index === 2) timeLimit = text;
        if (index === 4) memoryLimit = text;
        if (index === 6) score = text;
      });

      // Extract notes if available
      const notesSection = document.querySelector('h5.problem_heading.mt-4:contains("Note")');
      const notesElement = notesSection?.nextElementSibling?.querySelector('.coding_input_format__pv9fS');

      const problemDetails = {
        title: titleElement?.textContent?.trim() || 'Unknown Problem',
        difficulty: difficulty || 'Unknown',
        timeLimit: timeLimit || 'N/A',
        memoryLimit: memoryLimit || 'N/A',
        score: score || 'N/A',
        description: descriptionElement?.textContent?.trim() || '',
        inputFormat: inputFormatElement?.textContent?.trim() || '',
        outputFormat: outputFormatElement?.textContent?.trim() || '',
        constraints: constraintsElement?.textContent?.trim() || '',
        samples: sampleInputs.map((input, i) => ({
          input: input,
          output: sampleOutputs[i] || ''
        })),
        notes: notesElement?.textContent?.trim() || '',
        programmingLanguage: detectProgrammingLanguage(),
        url: window.location.href
      };

      // Log successful extraction
      console.log('Successfully extracted problem details:', problemDetails);
      return problemDetails;

    } catch (error) {
      console.error('Error extracting problem details:', error);
      // Return minimal problem details in case of error
      return {
        title: document.querySelector('.text-2xl.font-medium, .problem_heading.fs-4')?.textContent?.trim() || 'Unknown Problem',
        difficulty: 'Unknown',
        description: document.querySelector('.coding_desc__pltWY')?.textContent?.trim() || '',
        samples: [],
        programmingLanguage: detectProgrammingLanguage(),
        url: window.location.href
      };
    }
  }
  
  // Function to make request to Gemini API
  async function makeGeminiApiRequest(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const problemDetails = await Promise.resolve(extractProblemDetails());
    
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

Instructions:
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
      
      if (!responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from Gemini API");
      }

      return responseData.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error(`Failed to get response: ${error.message}`);
    }
  }
  
  // Function to extract problem context
  function extractProblemContext() {
    const title = document.querySelector('h1')?.textContent || '';
    const problemStatement = document.querySelector('.problem-statement')?.textContent || '';
    const codeExamples = Array.from(document.querySelectorAll('pre')).map(pre => pre.textContent).join('\n');
    
    return {
      title,
      problemStatement,
      codeExamples
    };
  }
  
  // Function to maintain chat context
  let chatContext = {
    problemDetails: null,
    messageHistory: [],
    maxHistoryLength: 10
  };
  
  // Add this function to generate a friendly greeting
  function generateGreeting(problemDetails) {
    const greetings = [
      "Hello! 👋",
      "Hi there! 👋",
      "Welcome! ��",
      "Greetings! 👋"
    ];

    const timeBasedGreetings = {
      morning: "Good morning! ☀️",
      afternoon: "Good afternoon! 🌤️",
      evening: "Good evening! 🌙"
    };

    // Get current hour to determine appropriate greeting
    const hour = new Date().getHours();
    let timeGreeting;
    if (hour >= 5 && hour < 12) {
      timeGreeting = timeBasedGreetings.morning;
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = timeBasedGreetings.afternoon;
    } else {
      timeGreeting = timeBasedGreetings.evening;
    }

    // Randomly select a casual greeting
    const casualGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    // Construct the full greeting
    let message = `${timeGreeting} ${casualGreeting} `;
    
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
  
  // Update the initializeChatContext function
  async function initializeChatContext() {
    try {
      const details = await Promise.resolve(extractProblemDetails());
      chatContext.problemDetails = details;
      
      const chatMessages = document.querySelector(".chat-messages");
      if (chatMessages) {
        chatMessages.innerHTML = '';
        
        // Generate a more detailed initial analysis
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

        addMessageToChat('ai', analysis);
        updateChatHistory('assistant', analysis);
      }
    } catch (error) {
      console.error('Error in initializeChatContext:', error);
      addErrorMessage('Failed to initialize chat context. Please refresh the page.');
    }
  }
  
  // Update sendMessage function to use chat context
  async function sendMessage() {
    const chatInput = document.querySelector(".chat-input");
    const userMessage = chatInput.value.trim();
    const chatMessages = document.querySelector(".chat-messages");
  
    if (!userMessage) return;
  
    // Add user message to chat
    addMessageToChat('user', userMessage);
    chatInput.value = "";
  
    // Show loading indicator
    const loadingMessage = addLoadingMessage();
  
    try {
      // Get API key from storage
      const result = await chrome.storage.local.get(["geminiApiKey"]);
      
      if (!result.geminiApiKey) {
        throw new Error("Please set your Gemini API key in the extension popup first.");
      }
  
      // Add message to context
      chatContext.messageHistory.push({
        role: 'user',
        content: userMessage
      });
  
      // Get AI response
      const response = await makeGeminiApiRequest(result.geminiApiKey, userMessage);
      
      // Remove loading message
      loadingMessage.remove();
  
      // Add AI response to chat
      addMessageToChat('ai', response);
  
      // Add to context
      chatContext.messageHistory.push({
        role: 'assistant',
        content: response
      });
  
    } catch (error) {
      loadingMessage.remove();
      addErrorMessage(error.message);
    }
  
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Helper functions for chat UI
  function addMessageToChat(role, content) {
    const chatMessages = document.querySelector(".chat-messages");
    const messageDiv = document.createElement('div');
    messageDiv.className = `${role}-message`;
    messageDiv.innerHTML = `<p>${formatMessage(content)}</p>`;
    chatMessages.appendChild(messageDiv);
  }
  
  function addLoadingMessage() {
    const chatMessages = document.querySelector(".chat-messages");
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-message loading';
    loadingDiv.innerHTML = '<p>Thinking</p>';
    chatMessages.appendChild(loadingDiv);
    return loadingDiv;
  }
  
  function addErrorMessage(error) {
    const chatMessages = document.querySelector(".chat-messages");
    const errorDiv = document.createElement('div');
    errorDiv.className = 'ai-message error';
    errorDiv.innerHTML = `<p>Error: ${error}</p>`;
    chatMessages.appendChild(errorDiv);
  }
  
  // Format message with markdown and code highlighting
  function formatMessage(message) {
    // Add your preferred markdown and code highlighting library here
    return message.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
                  .replace(/`([^`]+)`/g, '<code>$1</code>')
                  .replace(/\n/g, '<br>');
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
  
  // Add function to check if we're on a problem page
  function isProblemPage() {
    return window.location.href.includes('/problems/') || 
           document.querySelector('.problem-text') !== null ||
           document.querySelector('.text-2xl.font-medium') !== null;
  }
  
  // Update observer to be more resilient
  function observeProblemChanges() {
    if (!isProblemPage()) return;

    const observer = new MutationObserver(() => {
        if (isProblemPage()) {
            const newDetails = extractProblemDetails();
            if (newDetails && 
                (!chatContext.problemDetails || 
                 chatContext.problemDetails.title !== newDetails.title)) {
                console.log('Problem changed, updating context...');
                chatContext.messageHistory = [];
                chatContext.problemDetails = newDetails;
                initializeChatContext();
            }
        }
    });

    // Observe the entire main content area
    const mainContent = document.querySelector('main') || document.body;
    observer.observe(mainContent, {
        subtree: true,
        childList: true,
        characterData: true
    });
  }
  
  // Initialize when the page loads
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
  
  function isRelevantMessage(message) {
    const relevantKeywords = [
      'code', 'problem', 'solution', 'algorithm', 'error', 'bug', 'function',
      'programming', 'debug', 'help', 'explain', 'how', 'why', 'what',
      'complexity', 'time', 'space', 'approach', 'method', 'implement',
      'optimize', 'improve', 'fix', 'issue', 'test', 'case', 'example',
      'hint', 'stuck', 'understand', 'logic', 'data', 'structure','solve'
    ];

    const irrelevantPatterns = [
      /^(hi|hello|hey)$/i,
      /how are you/i,
      /weather/i,
      /sports/i,
      /movies/i,
      /music/i,
      /\b(eat|food|drink)\b/i,
      /\b(game|play)\b/i,
      /\b(chat|talk)\b/i
    ];

    if (chatContext.messageHistory.length === 0 && /^(hi|hello|hey)$/i.test(message.trim())) {
      return true;
    }

    if (irrelevantPatterns.some(pattern => pattern.test(message))) {
      return false;
    }

    const messageLower = message.toLowerCase();
    return relevantKeywords.some(keyword => messageLower.includes(keyword));
  }

  function updateChatHistory(role, message, isRelevant = true) {
    if (isRelevant) {
      chatContext.messageHistory.push({
        role,
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
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
  }
  
  // Add this function near the top of your file, after chatContext initialization
  function detectProgrammingLanguage() {
    try {
      // Find the language selector element
      const languageSelector = document.querySelector('.ant-select-selection-item');
      if (languageSelector) {
        const languageText = languageSelector.textContent.trim();
        
        // Map common language displays to standardized names
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

        // Try to find a match in our language map
        for (const [key, value] of Object.entries(languageMap)) {
          if (languageText.includes(key)) {
            console.log('Detected programming language:', value);
            return value;
          }
        }
      }

      // Default to C++ if no language is detected
      console.log('No language detected, defaulting to cpp');
      return 'cpp';
    } catch (error) {
      console.error('Error detecting programming language:', error);
      return 'cpp'; // Default to C++ in case of error
    }
  }
  
  // Helper function to find elements by text content
  function getElementByText(selector, text) {
    return Array.from(document.querySelectorAll(selector))
      .find(el => el.textContent.trim().toLowerCase().includes(text.toLowerCase()));
  }
  
  // Helper function to determine problem type
  function getProblemType(description) {
    const types = {
      'array': ['array', 'elements', 'sequence'],
      'string': ['string', 'substring', 'palindrome'],
      'graph': ['graph', 'tree', 'path'],
      'dynamic programming': ['maximum', 'minimum', 'optimal'],
      'greedy': ['smallest', 'largest', 'maximum possible']
    };

    for (const [type, keywords] of Object.entries(types)) {
      if (keywords.some(keyword => description.toLowerCase().includes(keyword))) {
        return type.charAt(0).toUpperCase() + type.slice(1);
      }
    }
    return 'Algorithm';
  }

  // Helper function to summarize requirements
  function summarizeRequirements(description) {
    const sentences = description.split('.');
    return sentences.slice(0, 2).join('.') + '.';
  }
  
  