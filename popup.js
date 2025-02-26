document.addEventListener('DOMContentLoaded', function() {
    // Load saved API key
    chrome.storage.local.get(['geminiApiKey'], function(result) {
      if (result.geminiApiKey) {
        document.getElementById('apiKeyInput').value = result.geminiApiKey;
      }
    });
    
    // Save API key
    document.getElementById('saveApiKey').addEventListener('click', function() {
      const apiKey = document.getElementById('apiKeyInput').value.trim();
      
      if (apiKey) {
        chrome.storage.local.set({ geminiApiKey: apiKey }, function() {
          // Show success message
          const button = document.getElementById('saveApiKey');
          const originalText = button.textContent;
          button.textContent = 'Saved!';
          button.classList.add('success');
          
          // Reset button text after 2 seconds
          setTimeout(function() {
            button.textContent = originalText;
            button.classList.remove('success');
          }, 2000);
        });
      } else {
        alert('Please enter a valid API key.');
      }
    });
  });