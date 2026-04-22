(() => {

  // initializing all the actionable/dynamic components
  const imageBtn = document.querySelector(".insert-image-btn");
  const tableToggleBtn = document.querySelector(".insert-table-toggle-btn");
  const tableDropdown = document.querySelector(".insert-table-dropdown");
  const createTableBtn = document.querySelector(".insert-table-create-btn");
  const rowsInput = document.querySelector(".insert-table-rows");
  const colsInput = document.querySelector(".insert-table-cols");
  const iconToggleBtn = document.querySelector(".insert-icon-toggle-btn");
  const iconDropdown = document.querySelector(".insert-icon-dropdown");
  const iconSearchInput = document.querySelector(".insert-icon-search");
  const iconResults = document.querySelector(".insert-icon-results");
  const textboxToggleBtn = document.querySelector(".insert-textbox-toggle-btn");
  const textboxDropdown = document.querySelector(".insert-textbox-dropdown");
  const textboxFillInput = document.querySelector(".insert-textbox-fill");
  const textboxFontInput = document.querySelector(".insert-textbox-font");
  const textboxCreateBtn = document.querySelector(".insert-textbox-create-btn");


  if (!imageBtn) return;

  // listening to click on the "insert image"
  imageBtn.addEventListener("click", async () => {
    if (!window.editor || !window.insertAPI) return;

    // opening the dialog for image
    const dataUrl = await window.insertAPI.pickImage();
    if (!dataUrl) return; // return if no image selected

    // getting the cursor position
    const range = window.editor.getSelection(true) || {
      index: Math.max(0, window.editor.getLength() - 1),
      length: 0
    };

    window.editor.insertEmbed(range.index, "image", dataUrl, "user"); // inserting the image
    window.editor.setSelection(range.index + 1, 0, "silent"); // setting the new cursor position after image
    window.editor.focus();
  });

  if (!tableToggleBtn || !tableDropdown || !createTableBtn || !rowsInput || !colsInput) return;

  // listening for the click on "insert table" button
  tableToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    tableDropdown.style.display = tableDropdown.style.display === "none" ? "block" : "none"; // toggle dropdown visibility
  });

  //if the user clicks outside the dropdown menu then the dropdown closes
  document.addEventListener("click", (e) => {
    if (!tableDropdown.contains(e.target) && !tableToggleBtn.contains(e.target)) {
      tableDropdown.style.display = "none";
    }
  });

  createTableBtn.addEventListener("click", () => {
    if (!window.editor) return;

    const rows = Math.max(1, Math.min(50, parseInt(rowsInput.value, 10) || 1)); // reading the number of rows
    const cols = Math.max(1, Math.min(20, parseInt(colsInput.value, 10) || 1)); // reading the number of columns

    const tableModule = window.editor.getModule("table"); // getting the table module from Quill

    //if table module is not available
    if (!tableModule || typeof tableModule.insertTable !== "function") {
      console.warn("Quill table module not available.");
      tableDropdown.style.display = "none";
      return;
    }

    //getting the position of the cursor
    const range = window.editor.getSelection(true) || {
      index: Math.max(0, window.editor.getLength() - 1),
      length: 0
    };

    window.editor.setSelection(range.index, 0, "silent"); // setting the new cursor position
    tableModule.insertTable(rows, cols); // inserting the table on the document
    window.editor.focus();
    tableDropdown.style.display = "none"; // toggling off the dropdown menu
  });
  
  loadStaticIconCatalog();

// listening to "insert icon" button  
if (iconToggleBtn && iconDropdown && iconSearchInput && iconResults) {
  iconToggleBtn.addEventListener("click", async (e) => {
    e.stopPropagation();

    const hidden = iconDropdown.style.display === "none" || iconDropdown.style.display === "";
    iconDropdown.style.display = hidden ? "block" : "none"; //toggle dropdown menu visibility

    if (hidden) {
      if (!iconCatalog.length) await loadStaticIconCatalog(); // rendering all the icons
      iconSearchInput.value = ""; //setting null by default
      renderIcons(iconResults, searchIcons("")); // rendering all when none is value
      iconSearchInput.focus();
    }
  });

  //when any input is passed the icons are filtered
  iconSearchInput.addEventListener("input", () => {
    renderIcons(iconResults, searchIcons(iconSearchInput.value));
  });

  // listening to click on the submit button
  iconResults.addEventListener("click", (e) => {
    const btn = e.target.closest(".insert-icon-item");
    if (!btn || !window.editor) return;

    const char = btn.getAttribute("data-char"); //fetching the icon character
    if (!char) return;

    // getting the cursor position
    const range = window.editor.getSelection(true) || {
      index: Math.max(0, window.editor.getLength() - 1),
      length: 0
    };

    // inserting the icon
    window.editor.insertText(range.index, char, "user");
    window.editor.setSelection(range.index + char.length, 0, "silent"); // setting new cursor position
    window.editor.focus();
    iconDropdown.style.display = "none"; //toggling off the dropdown menu
  });

  document.addEventListener("click", (e) => {
    if (!iconDropdown.contains(e.target) && !iconToggleBtn.contains(e.target)) {
      iconDropdown.style.display = "none";
    }
  });
}

// listening to "insert text box" button
if (textboxToggleBtn && textboxDropdown && textboxFillInput && textboxFontInput && textboxCreateBtn) {
  textboxToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const hidden = textboxDropdown.style.display === "none" || textboxDropdown.style.display === ""; 
    textboxDropdown.style.display = hidden ? "block" : "none"; //toggle dropdown menu visibility
  });

  // creating the text box on clicking on create button
  textboxCreateBtn.addEventListener("click", () => {
    const fillColor = textboxFillInput.value || "#fff3b0";
    const fontColor = textboxFontInput.value || "#000000";

    window.dispatchEvent(new CustomEvent("textbox:create-mode", {
      detail: { fillColor, fontColor }
    }));

    textboxDropdown.style.display = "none";
  });

  document.addEventListener("click", (e) => {
    if (!textboxDropdown.contains(e.target) && !textboxToggleBtn.contains(e.target)) {
      textboxDropdown.style.display = "none";
    }
  });
}
  
})();

let iconCatalog = [];

//fetching the icon-catalog json file
async function loadStaticIconCatalog() {
  const res = await fetch("./libs/icon-catalog/iconCatalog.json");
  iconCatalog = res.ok ? await res.json() : [];
}

// helping to filter the icons on searching
function searchIcons(q) {
  const s = String(q || "").trim().toLowerCase();
  if (!s) return iconCatalog.slice(0, 80);
  return iconCatalog.filter((i) =>
    i.name.toLowerCase().includes(s) ||
    (Array.isArray(i.keywords) && i.keywords.some((k) => k.toLowerCase().includes(s)))
  ).slice(0, 80);
}

//rendering the icons in the dropdown menu
function renderIcons(container, list) {
  if (!container) return;
  container.innerHTML = list.map((i) =>
    '<button class="insert-icon-item" type="button" data-char="' + i.char + '">' +
      '<span class="insert-icon-char" style="padding: 3px">' + i.char + '</span>' +
      '<span class = "insert-icon-name">'+ i.name +'</span>' +
    '</button>'
  ).join("");
}