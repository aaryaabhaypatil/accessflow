document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('openFullPopup');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      });
    }
  });
  