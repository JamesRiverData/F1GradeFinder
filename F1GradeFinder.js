// ==UserScript==
// @name         GT Week Fetcher (Dropdown Enhanced)
// @namespace    https://jamesriver.fellowshiponego.com
// @version      1.2
// @description  Fetch GT Week dates (date5–date8) and display in the autocomplete dropdown
// @author       You
// @match        https://jamesriver.fellowshiponego.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const FIELD_LABELS = {
    text6: 'GRADE',
    date5: 'GT Week 1',
    date6: 'GT Week 2',
    date7: 'GT Week 3',
    date8: 'GT Week 4'
  };

  async function fetchAndDisplay(uid, nameSpan) {
    const apiUrl = `https://jamesriver.fellowshiponego.com:443/api/people/${uid}`;

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const jsonData = await response.json();
      console.log(`API data for UID ${uid}:`, jsonData);

      // Adjust path if date fields are nested (inspect console output)
      const data = jsonData?.data?.person || jsonData?.data || jsonData;

      const infoDiv = document.createElement("div");
      infoDiv.classList.add("gt-week-info");
      infoDiv.style.marginTop = "4px";
      infoDiv.style.fontSize = "0.85em";
      infoDiv.style.color = "#333";
      infoDiv.innerHTML = `
        <ul style="margin:0; padding-left:16px; list-style-type:disc;">
          ${Object.entries(FIELD_LABELS)
            .map(([f, l]) => `<li><strong>${l}:</strong> ${data[f] || ''}</li>`)
            .join('')}
        </ul>
      `;

      nameSpan.insertAdjacentElement('afterend', infoDiv);

    } catch (err) {
      console.error(`Error fetching GT Weeks for UID ${uid}:`, err);
    }
  }

  function processDropdown() {
    const listItems = document.querySelectorAll('ul.check-in-search-list li.ui-menu-item');
    listItems.forEach(li => {
      if (li.dataset.gtProcessed) return;
      li.dataset.gtProcessed = "true";

      const nameSpan = li.querySelector('.autoCompleteName');
      if (!nameSpan) return;

      // Try to get UID from image or name text
      let uid = null;
      const imgDiv = li.querySelector('.user-img');
      if (imgDiv) {
        const style = imgDiv.getAttribute('style') || "";
        const match = style.match(/profilePictures\/(\d+)_thumb\.jpg/);
        if (match) uid = match[1];
      }

      // If no image UID, extract from "(number)" in name text
      if (!uid) {
        const nameText = nameSpan.textContent;
        const match = nameText.match(/\((\d+)\)/);
        if (match) uid = match[1];
      }

      if (uid) fetchAndDisplay(uid, nameSpan);
    });
  }

  // Watch for new dropdowns/results being added dynamically
  const observer = new MutationObserver(() => {
    processDropdown();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Run initially in case dropdown is already visible
  window.addEventListener('load', processDropdown);
})();
