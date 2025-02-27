document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveButton = document.getElementById('saveApiKey');
  const apiStatus = document.getElementById('apiStatus');

  // Load saved API key
  chrome.storage.local.get(['geminiApiKey'], function(result) {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
      apiStatus.textContent = '✓ API key is set';
      apiStatus.className = 'api-status success';
    } else {
      apiStatus.textContent = 'Please enter your API key';
      apiStatus.className = 'api-status warning';
    }
  });
  
  // Save API key
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (apiKey) {
      // Test the API key with a simple request
      testApiKey(apiKey).then(isValid => {
        if (isValid) {
          chrome.storage.local.set({ geminiApiKey: apiKey }, function() {
            apiStatus.textContent = '✓ API key saved successfully';
            apiStatus.className = 'api-status success';
            
            // Show success state on button
            saveButton.textContent = 'Saved!';
            saveButton.classList.add('success');
            
            setTimeout(function() {
              saveButton.textContent = 'Save Key';
              saveButton.classList.remove('success');
            }, 2000);
          });
        } else {
          apiStatus.textContent = '✗ Invalid API key';
          apiStatus.className = 'api-status error';
        }
      });
    } else {
      apiStatus.textContent = 'Please enter a valid API key';
      apiStatus.className = 'api-status warning';
    }
  });

  // Test API key validity
  async function testApiKey(apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Hello',
              }],
            }],
          }),
        }
      );
      return response.ok;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }
});