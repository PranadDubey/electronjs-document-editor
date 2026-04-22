(() => {
  const formatBtns = document.querySelectorAll(".format-btn");
  const formatSelects = document.querySelectorAll(".format-select")
  const formatInputs = document.querySelectorAll(".format-input");
  const formatColors = document.querySelectorAll(".format-color");
  const paragraphBtns = document.querySelectorAll(".paragraph-btn");
  const paragraphInputs = document.querySelectorAll(".paragraph-input");
  let savedRange = null

  //converting RGB to HEX for simpler Quill compatability
  const rgbToHex = (color) => {
    if (!color) return "#000000";
    if (color.startsWith("#")) return color;
    const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return "#000000";
    return "#" + match.slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('');
  };

  // for bold, italics, underline, align etc.
  formatBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    if (!window.editor) return;

    //collecting data-format such as bold, italics or underline etc
    const formatName = btn.getAttribute("data-format");
    //collecting data-value for align such as center, left or right
    const formatValue = btn.getAttribute("data-value");
    const activeFormats = window.editor.getFormat();

    // Value formats (script/list/align-like buttons)
    if (formatValue) {
      const isSameValueActive = activeFormats[formatName] === formatValue;
      window.editor.format(formatName, isSameValueActive ? false : formatValue, "user"); //toggle the format on/off
    } else {
      // Boolean formats (bold/italic/underline/strike)
      const isActive = !!activeFormats[formatName];
      window.editor.format(formatName, !isActive, "user"); //toggle the format on/off
    }

    window.editor.focus();
  });
});

  //for font family
   formatSelects.forEach(select => {
    select.addEventListener("change", (e) => {
      if (!window.editor) return;
      const formatName = select.getAttribute("data-format");
      const formatValue = e.target.value;

      window.editor.format(formatName, formatValue === "" ? false : formatValue); // setting the selected font family
      window.editor.focus();
    });
  });

  //for font size
  formatInputs.forEach(input => {
    input.addEventListener("change", (e) => {
      if (!window.editor) return;
      const formatName = input.getAttribute("data-format");
      let val = e.target.value.trim();
      
      if (formatName === "size" && val !== "") {
        if (isNaN(val) || val < 1 || val > 200) { // if the font size entered is NaN or more than 200 or less than 1 then fallback to 11pt
           val = "11pt"; 
           input.value = "11";
        } else {
           val = val + "pt";
        }
      }

      window.editor.format(formatName, val === "" ? false : val); // setting the font size
      window.editor.focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur(); 
      }
    });
  })

    // for font color
    formatColors.forEach(colorInput => {
    colorInput.addEventListener("change", (e) => {
      if (!window.editor) return;

      const formatName = colorInput.getAttribute("data-format");
      const colorValue = e.target.value;

      if (savedRange && savedRange.length > 0) {
        // Apply on selected text
        window.editor.formatText(savedRange.index, savedRange.length, formatName, colorValue);
      } else {
        // Apply as typing color (cursor mode)
        const cursorIndex = savedRange ? savedRange.index : Math.max(0, window.editor.getLength() - 1);

        window.editor.focus();
        window.editor.setSelection(cursorIndex, 0, "silent");
        window.editor.format(formatName, colorValue);

        // Keep tracking cursor mode after applying
        savedRange = { index: cursorIndex, length: 0 };
      }
      window.editor.focus();
    });
  });

  //for alignment :- left, right, center and justify
  paragraphBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (!window.editor) return;

      const formatName = btn.getAttribute("data-format");
      const formatValue = btn.getAttribute("data-value");

      const liveRange = window.editor.getSelection();
      const range = liveRange || savedRange || { index: Math.max(0, window.editor.getLength() - 1), length: 0 };

      // Paragraph-level format
      const lengthForLine = Math.max(range.length, 1);
      window.editor.focus();
      if (formatValue === "left") {
        window.editor.formatLine(range.index, lengthForLine, formatName, false, "user");
      } else {
        window.editor.formatLine(range.index, lengthForLine, formatName, formatValue, "user");
      }

      savedRange = { index: range.index, length: range.length };
    });
  });

  //for line height
  paragraphInputs.forEach(input => {
    input.addEventListener("change", (e) => {
      if (!window.editor) return;

      const raw = e.target.value.trim();
      let num = Number(raw);

      // checking for valid value otherwise fallback
      if (!Number.isFinite(num) || num <= 0) {
        num = 1.0;
      }

      // Optional clamp for sane values
      if (num < 0.5) num = 0.5;
      if (num > 5) num = 5;

      const value = String(num);
      input.value = value;

      const liveRange = window.editor.getSelection();
      const range = liveRange || savedRange || { index: 0, length: 0 };

      window.editor.formatLine(
        range.index,
        Math.max(range.length, 1),
        "lineheight",
        value,
        "user"
      );
      window.editor.focus();
    });
  });

// keeping the UI in sync with the actions and current formatting
const bindEditorChange = () => {
  if (!window.editor) {
    requestAnimationFrame(bindEditorChange);
    return;
  }

    window.editor.on("editor-change", (eventName, range) => {
      if (eventName === "selection-change" && range !== null) {
        savedRange = range;
      }

      if (eventName === "selection-change" && range === null) {
        return;
      }

      if (eventName === "selection-change" || eventName === "text-change") {
        const activeFormats = window.editor.getFormat();

        formatBtns.forEach(btn => {
          const formatName = btn.getAttribute("data-format");
          const formatValue = btn.getAttribute("data-value");

          if (formatValue) {
            if (activeFormats[formatName] === formatValue) btn.classList.add("is-active");
            else btn.classList.remove("is-active");
          } else {
            if (activeFormats[formatName]) btn.classList.add("is-active");
            else btn.classList.remove("is-active");
          }
        });

        formatSelects.forEach(select => {
          const formatName = select.getAttribute("data-format");
          select.value = activeFormats[formatName] || "";
        });

        formatInputs.forEach(input => {
          if (document.activeElement === input) return;

          const formatName = input.getAttribute("data-format");
          let activeSize = activeFormats[formatName];

          if (activeSize) {
            input.value = activeSize.replace("pt", "");
          } else {
            input.value = "11";
          }
        });

        formatColors.forEach(colorInput => {
          if (colorInput.matches(":focus")) return;
          const formatName = colorInput.getAttribute("data-format");
          const activeColor = activeFormats[formatName];
          if (activeColor) {
            colorInput.value = rgbToHex(activeColor);
          }
        });
        const currentAlign = activeFormats.align;
        paragraphBtns.forEach(btn => {
          const value = btn.getAttribute("data-value");
          if (value === currentAlign) btn.classList.add("is-active");
          else btn.classList.remove("is-active");
        });
    
        paragraphInputs.forEach(input => {
          if (document.activeElement === input) return;
          if (activeFormats.hasOwnProperty("lineheight")) {
            input.value = activeFormats.lineheight;
          }
        });
      }
    });
  }
  bindEditorChange()
})();

async function loadFonts() {
  const fontSelect = document.querySelector('.format-select[data-format="font"]');
  const rawFonts = await window.fontAPI.getSystemFonts(); 
  
  const fonts = rawFonts.map(font => font.replace(/['"]/g, ''));
  
  fonts.forEach(font => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    option.style.fontFamily = `"${font}"`; 
    fontSelect.appendChild(option);
  });
  const Font = Quill.import('attributors/style/font');
  Font.whitelist = fonts; 
  Quill.register(Font, true);
}

loadFonts();