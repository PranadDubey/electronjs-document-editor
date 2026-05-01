(() => {
  const docArea = document.getElementById("doc-area");
  
  if (docArea) {
    docArea.innerHTML = ""; 

    const pageObj = document.createElement("div");
    pageObj.className = "doc-page";
    
    const contentObj = document.createElement("div");
    contentObj.className = "doc-content";
    contentObj.id = "quill-editor";
    
    pageObj.appendChild(contentObj);
    docArea.appendChild(pageObj);

    //Quill custom formatting
    const Parchment = Quill.import("parchment");
    const LineHeightStyle = new Parchment.StyleAttributor("lineheight", "line-height", {
      scope: Parchment.Scope.BLOCK
    });
    Quill.register(LineHeightStyle, true);
    
    const AlignStyle = Quill.import("attributors/style/align");
    Quill.register(AlignStyle, true);
    
    const Color = Quill.import("attributors/style/color");
    Quill.register(Color, true);
    
    const Size = Quill.import("attributors/style/size");
    Size.whitelist = null;
    Quill.register(Size, true);

    const BlotFormatter2Mod =
    window.QuillBlotFormatter2 ||
    window.BlotFormatter2 ||
    window.QuillBlotFormatter;

    const BlotFormatter2 = BlotFormatter2Mod?.default || BlotFormatter2Mod;


    if (BlotFormatter2) {
      Quill.register("modules/blotFormatter2", BlotFormatter2);
    } else {
      console.warn("BlotFormatter2 not loaded");
    }

    //configuring quill
    const quillModules = { toolbar: false , table:true};
    if (BlotFormatter2) {
      quillModules.blotFormatter2 = {
        resize: { allowResizing: true },
        align: { allowAligning: true }
      };
    }

    console.log("BF2 loaded:", !!(window.QuillBlotFormatter2 || window.BlotFormatter2 || window.QuillBlotFormatter));

    //initializing quill
    window.editor = new Quill("#quill-editor", {
      theme: "snow",
      modules: quillModules
    });

    //setting the image as draggable
    function ensureImagesDraggable() {
      const imgs = window.editor.root.querySelectorAll("img");
      imgs.forEach((img) => img.setAttribute("draggable", "true"));
    }
    
    ensureImagesDraggable();
    
    //ensures where the image should be placed when inserted
    let draggedImageBlot = null;
    function getDropIndexFromPoint(x, y) {
      let range = null;
    
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }
      
      if (!range) return window.editor.getLength() - 1;
      
      const blot = Quill.find(range.startContainer, true);
      if (!blot) return window.editor.getLength() - 1;
    
      const idx = window.editor.getIndex(blot);
      return Math.max(0, Math.min(idx, window.editor.getLength() - 1));
    }
    
    //initiating when the image drag starts
    window.editor.root.addEventListener("dragstart", (e) => {
      const img = e.target.closest("img"); //selects the image
      if (!img) return;
    
      const blot = Quill.find(img, true); // turning it into the Quill image
      if (!blot) return;
      
      draggedImageBlot = blot;
      e.dataTransfer.effectAllowed = "move"; // setting the image object in "move"
    });
    
    // constantly running while the image is getting dragged
    window.editor.root.addEventListener("dragover", (e) => {
      if (!draggedImageBlot) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    
    // triggered when the image is dropped
    window.editor.root.addEventListener("drop", (e) => {
      if (!draggedImageBlot) return;
      e.preventDefault();
      
      const oldIndex = window.editor.getIndex(draggedImageBlot); 
      const imgNode = draggedImageBlot.domNode;
      const src = imgNode.getAttribute("src");  // getting the image source
      const width = imgNode.style.width || imgNode.getAttribute("width") || ""; // setting the new width of the image so it doesnt reset into default
      
      let newIndex = getDropIndexFromPoint(e.clientX, e.clientY);
      
      // If moving forward, account for removal shift
      if (newIndex > oldIndex) newIndex -= 1;
    
      window.editor.deleteText(oldIndex, 1, "user"); // deleting image from old postion
      window.editor.insertEmbed(newIndex, "image", src, "user"); // fixing image at new position
      
      // restore width on moved image
      const [leaf] = window.editor.getLeaf(newIndex);
      if (leaf && leaf.domNode && width) {
        leaf.domNode.style.width = width;
      }
    
      // setting the new cursor position
      window.editor.setSelection(newIndex + 1, 0, "silent");
      //resetting the drag image into null 
      draggedImageBlot = null;
    });

    // creates a "text box" component
    const textboxLayer = document.createElement("div");
    textboxLayer.className = "textbox-layer";
    pageObj.appendChild(textboxLayer);

    let textboxPlacementMode = false;
    let pendingTextboxStyle = {
      fillColor: "#fff3b0",
      fontColor: "#000000"
    };

    // placing the text box in the document
    window.addEventListener("textbox:create-mode", (e) => {
      textboxPlacementMode = true;
      pendingTextboxStyle = {
        fillColor: e?.detail?.fillColor || "#fff3b0",
        fontColor: e?.detail?.fontColor || "#000000"
      };
    });
    
    // creating the text box
    function createTextboxAt(pageX, pageY) {
      const box = document.createElement("div");
      box.className = "textbox-item";
      box.style.left = `${pageX}px`;
      box.style.top = `${pageY}px`;
      box.style.width = "220px";
      box.style.height = "110px";
      box.style.background = pendingTextboxStyle.fillColor;
      box.style.color = pendingTextboxStyle.fontColor;

      const content = document.createElement("div");
      content.className = "textbox-content";
      content.contentEditable = "true";
      content.textContent = "Type here...";

      const handle = document.createElement("div");
      handle.className = "textbox-resize-handle";

      box.appendChild(content);
      box.appendChild(handle);
      textboxLayer.appendChild(box);

      makeTextboxDraggable(box, handle);
      makeTextboxResizable(box, handle);

      moveCursorBelowTextbox(box);
    }

    function makeTextboxDraggable(box, handle) {
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      box.addEventListener("mousedown", (e) => {
        if (e.target === handle || e.target.classList.contains("textbox-content")) return; // return if user clicks inside the text box

        dragging = true;
        const rect = box.getBoundingClientRect(); // position of rectangle
        const layerRect = textboxLayer.getBoundingClientRect(); // position of the text box parent area

        // where the mouse clicked
        startX = e.clientX;
        startY = e.clientY;
        // getting the document position
        startLeft = rect.left - layerRect.left;
        startTop = rect.top - layerRect.top;

        e.preventDefault();
      });

      document.addEventListener("mousemove", (e) => {
        if (!dragging) return;

        // calculating new position
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // fixing the new position of the text box
        box.style.left = `${Math.max(0, startLeft + dx)}px`;
        box.style.top = `${Math.max(0, startTop + dy)}px`;
      });

      // exiting the draggable phase when mouse is lifted
      document.addEventListener("mouseup", () => {
        if (dragging) moveCursorBelowTextbox(box);
        dragging = false;
      });
    }

    // for resizing the box
    function makeTextboxResizable(box, handle) {
      let resizing = false;
      let startX = 0;
      let startY = 0;
      let startW = 0;
      let startH = 0;

      // listening with the click occurs in the resize handler
      handle.addEventListener("mousedown", (e) => {
        resizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startW = box.offsetWidth;
        startH = box.offsetHeight;
        e.preventDefault();
        e.stopPropagation();
      });

      // running continously when the mouse drags the handler 
      document.addEventListener("mousemove", (e) => {
        if (!resizing) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        //calculating the new width and height
        const newW = Math.max(120, startW + dx);
        const newH = Math.max(60, startH + dy);

        box.style.width = `${newW}px`;
        box.style.height = `${newH}px`;
      });

      // when mouse is lifted the reisizing is stopped
      document.addEventListener("mouseup", () => {
        if (resizing) moveCursorBelowTextbox(box);
        resizing = false;
      });
    }


    pageObj.addEventListener("mousedown", (e) => {
      if (!textboxPlacementMode) return;
      if (!e.target.closest(".doc-page")) return;

      const rect = textboxLayer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      createTextboxAt(x, y);
      textboxPlacementMode = false;
      e.preventDefault();
    });

  // moves the cursor below the text box  
  function moveCursorBelowTextbox(box) {
    if (!window.editor || !box) return;

    const editorRoot = window.editor.root;
    const boxRect = box.getBoundingClientRect();
    const rootRect = editorRoot.getBoundingClientRect();

    // Anchor near top of textbox so following text gets pushed down
    const targetX = rootRect.left + 24;
    const targetY = Math.min(boxRect.top + 4, rootRect.bottom - 6);

    // getting cursor position from screen coordinates and keep it within valid editor range
    let index = getDropIndexFromPoint(targetX, targetY);
    index = Math.max(0, Math.min(index, window.editor.getLength() - 1));

    const [line] = window.editor.getLine(index);

    const lineIndex = window.editor.getIndex(line); // which line does it starts
    const afterLine = lineIndex + line.length(); // end of current line

    // Reserve enough lines for textbox height
    const approxLinePx = 22;
    const spacerPx = box.offsetHeight + 24;
    const lines = Math.max(2, Math.ceil(spacerPx / approxLinePx)); // calculate how much space to leave

    window.editor.insertText(afterLine, "\n".repeat(lines), "user"); // leaving the "n" numbers of lines after textbox
    window.editor.setSelection(afterLine + lines, 0, "silent");
    window.editor.focus();
    window.editor.scrollSelectionIntoView();
  }
    const pageNumberLayer = document.createElement("div");
    pageNumberLayer.className = "page-number-layer";
    pageObj.appendChild(pageNumberLayer);

    let pageNumberEnabled = false;
    let pageNumberStartFromPage = 1;

    window.addEventListener("pageNumbers:config", (e) => {
      pageNumberEnabled = !!e?.detail?.enabled;
      pageNumberStartFromPage = Math.max(1, parseInt(e?.detail?.startFromPage, 10) || 1);
      // re-render with current page count
      renderPageNumbers(lastTotalPages);
    });

    function renderPageNumbers(totalPages) {
      pageNumberLayer.innerHTML = "";

      if (!pageNumberEnabled) return;

      for (let i = 0; i < totalPages; i++) {
        const physicalPage = i + 1;
        if (physicalPage < pageNumberStartFromPage) continue;

        const marker = document.createElement("div");
        marker.className = "page-number-marker";

        // Numbering starts at 1 on selected start page
        const displayNumber = physicalPage - pageNumberStartFromPage + 1;
        marker.textContent = `${displayNumber}`;

        // Bottom center of each white page
        const y = (i * CYCLE_HEIGHT) + PAGE_HEIGHT - PAGE_NUMBER_CENTER_FROM_BOTTOM;
        marker.style.top = `${y}px`;

        pageNumberLayer.appendChild(marker);
      }
    }
    // distributing a seperate header and footer area in the document
    const headerFooterLayer = document.createElement("div");
    headerFooterLayer.className = "header-footer-layer";
    headerFooterLayer.style.position = "absolute";
    headerFooterLayer.style.inset = "0";
    headerFooterLayer.style.pointerEvents = "none";
    headerFooterLayer.style.zIndex = "14";
    pageObj.appendChild(headerFooterLayer);
    const HEADER_OFFSET_TOP = 8;
    const FOOTER_OFFSET_BOTTOM = 8;
    const HEADER_REGION_HEIGHT = 32;
    const FOOTER_REGION_HEIGHT = 32;
    const PAGE_NUMBER_CENTER_FROM_BOTTOM = 18;
    const FOOTER_TO_PAGE_NUMBER_GAP = 8;

    let headerEnabled = false;
    let footerEnabled = false;
    let headerText = "";
    let footerText = "";
    let activeHeaderFooterRegion = null;

    // setting the cursor at the end of the element
    function placeCursorAtEnd(el) {
      const sel = window.getSelection();
      if (!sel) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // syncs the header and footer text for all pages
    function syncHeaderFooterText(regionName, value) {
      const nodes = headerFooterLayer.querySelectorAll('.hf-region[data-region="' + regionName + '"]');
      nodes.forEach((n) => {
        if (n.innerText !== value) n.innerText = value;
      });
    }

    // handling the editable status of header and footer
    function setHeaderFooterEditable(regionName) {
      activeHeaderFooterRegion = regionName || null;

      const nodes = headerFooterLayer.querySelectorAll(".hf-region");
      nodes.forEach((node) => {
        const region = node.dataset.region;
        const active = !!activeHeaderFooterRegion && region === activeHeaderFooterRegion;

        node.contentEditable = active ? "true" : "false";
        node.style.background = active ? "rgba(0, 0, 0, 0.03)" : "transparent";

        if (region === "header") {
          node.style.borderBottom = active ? "1px dotted #666" : "1px dotted transparent";
        } else {
          node.style.borderTop = active ? "1px dotted #666" : "1px dotted transparent";
        }
      });

      if (activeHeaderFooterRegion) {
        const first = headerFooterLayer.querySelector('.hf-region[data-region="' + activeHeaderFooterRegion + '"]');
        if (first) {
          first.focus();
          placeCursorAtEnd(first);
        }
      }
    }

// setting up the header and footer component and area in the document
function createHeaderFooterNode(region, pageTop) {
  const node = document.createElement("div");
  node.className = "hf-region";
  node.dataset.region = region;

  node.style.position = "absolute";
  node.style.left = `${PAGE_MARGIN}px`;
  node.style.width = `calc(100% - ${PAGE_MARGIN * 2}px)`;
  node.style.padding = "4px 6px";
  node.style.boxSizing = "border-box";
  node.style.whiteSpace = "pre-wrap";
  node.style.outline = "none";
  node.style.pointerEvents = "auto";
  node.style.userSelect = "text";
  node.style.fontSize = "12px";
  node.style.lineHeight = "1.3";
  node.style.color = "#222";
  node.style.maxWidth = `calc(100% - ${PAGE_MARGIN * 2}px)`;
  node.style.overflowX = "hidden";
  node.style.overflowWrap = "anywhere";
  node.style.wordBreak = "break-word";

  if (region === "header") {
    node.style.top = `${pageTop + HEADER_OFFSET_TOP}px`;
    node.style.minHeight = `${HEADER_REGION_HEIGHT}px`;
    node.style.borderBottom = "1px dotted transparent";
    node.innerText = headerText;
  } else {
      const footerTop =
      pageTop +
      PAGE_HEIGHT -
      PAGE_NUMBER_CENTER_FROM_BOTTOM -
      FOOTER_TO_PAGE_NUMBER_GAP -
      FOOTER_REGION_HEIGHT;

      node.style.top = `${footerTop}px`;
      node.style.height = `${FOOTER_REGION_HEIGHT}px`;
      node.style.overflowY = "auto";
      node.style.borderTop = "1px dotted transparent";
      node.innerText = footerText;
  }

  node.contentEditable = "false";
  node.spellcheck = false;

  // listening fir double click in the header/footer region to make it active and editable
  node.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHeaderFooterEditable(region);
  });

  node.addEventListener("keydown", (e) => {
    e.stopPropagation();
  });

  //updating the header/footer text with each input
  node.addEventListener("input", () => {
    if (region === "header") {
      headerText = node.innerText || "";
      syncHeaderFooterText("header", headerText);
    } else {
      footerText = node.innerText || "";
      syncHeaderFooterText("footer", footerText);
    }
  });

  return node;
}

//rendering the header and footer all synced up in all the pages
function renderHeaderFooters(totalPages) {
  headerFooterLayer.innerHTML = "";

  if (!headerEnabled && !footerEnabled) return;

  for (let i = 0; i < totalPages; i++) {
    const pageTop = i * CYCLE_HEIGHT;

    if (headerEnabled) {
      headerFooterLayer.appendChild(createHeaderFooterNode("header", pageTop));
    }

    if (footerEnabled) {
      headerFooterLayer.appendChild(createHeaderFooterNode("footer", pageTop));
    }
  }

  if (activeHeaderFooterRegion) {
    setHeaderFooterEditable(activeHeaderFooterRegion);
  }
}

// listening the broadcast from the insert.js file regarding the activation of the header and footer option from the dropdown
window.addEventListener("headerFooter:config", (e) => {
  headerEnabled = !!e?.detail?.headerEnabled;
  footerEnabled = !!e?.detail?.footerEnabled;

  const requested = e?.detail?.activeRegion || null;

  if (requested === "header" && headerEnabled) activeHeaderFooterRegion = "header";
  else if (requested === "footer" && footerEnabled) activeHeaderFooterRegion = "footer";
  else activeHeaderFooterRegion = null;

  renderHeaderFooters(lastTotalPages);
});

// if the user clicks outside the region of the header/footer region then it becomes non-editable again
document.addEventListener("mousedown", (e) => {
  const insideHeaderFooter = !!e.target.closest(".hf-region");
  const insideHeaderFooterDropdown = !!e.target.closest(".insert-header-footer-dropdown");
  const insideRibbon = !!e.target.closest(".ribbon");
  if (!insideHeaderFooter && !insideHeaderFooterDropdown && !insideRibbon) {
    setHeaderFooterEditable(null);
  }
});

    //Add Watermark handler
    let currentWatermark = { type: 'none' };
    
    window.addEventListener("watermark:apply", (e) => {
      currentWatermark = e.detail;
      if(typeof lastTotalPages !== 'undefined') {
        renderWatermarks(lastTotalPages);
      }
    });

    function renderWatermarks(totalPages) {
      const docPage = document.querySelector('.doc-page');
      if (!docPage) return;

      // Clear existing watermarks first
      const existing = docPage.querySelectorAll('.watermark-container');
      existing.forEach(el => el.remove());

      if (currentWatermark.type === "none") return;

      // Your standard cycle sizes
      const PAGE_HEIGHT = 1056;  
      const PAGE_GAP = 24;      
      const CYCLE_HEIGHT = PAGE_HEIGHT + PAGE_GAP; 

      for (let i = 0; i < totalPages; i++) {
        const wmContainer = document.createElement("div");
        wmContainer.className = "watermark-container";
        
        // Position exactly matching this page index bounds
        wmContainer.style.top = `${(i * CYCLE_HEIGHT)}px`;
        wmContainer.style.height = `${PAGE_HEIGHT}px`;

        if (currentWatermark.type === "image") {
          const img = document.createElement("img");
          img.src = currentWatermark.image;
          img.className = "watermark-img";
          wmContainer.appendChild(img);
        } else if (currentWatermark.type === "text") {
          const txt = document.createElement("div");
          txt.textContent = currentWatermark.text;
          txt.className = "watermark-txt";
          txt.style.color = currentWatermark.color;
          txt.style.fontSize = `${currentWatermark.size}px`;
          
          if (currentWatermark.layout === "diagonal") {
            txt.style.transform = "rotate(-45deg)";
          }
          wmContainer.appendChild(txt);
        }

        docPage.appendChild(wmContainer);
      }
    }

    // Page Color handler
    window.addEventListener("pageColor:apply", (e) => {
      const docPage = document.querySelector('.doc-page');
      if (docPage) {
        docPage.style.setProperty("--page-bg",e.detail.color)
      }
    });
        //Dimensions of the page
        const PAGE_HEIGHT = 1056; 
        const PAGE_MARGIN = 96;   
        const PAGE_GAP = 24;      
        const CYCLE_HEIGHT = PAGE_HEIGHT + PAGE_GAP; 
        let lastTotalPages = 1;
    
        //Pagination process
        function enforcePagination() {
          const qlEditor = document.querySelector('.ql-editor');
          const docPage = document.querySelector('.doc-page');
          const blocks = qlEditor.children;
          
          let maxPageIndex = 0; // Track the furthest page used
    
          // Reset margins
          for (let block of blocks) {
            block.style.marginTop = '0px';
          }
    
          // Check blocks
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            
            let topY = block.offsetTop;
            let pageIndex = Math.floor(topY / CYCLE_HEIGHT);
            
            // Defining dead zone which is the bottom margin + grey gap + top margin
            let deadZoneStart = (pageIndex * CYCLE_HEIGHT) + PAGE_HEIGHT - PAGE_MARGIN;
            let nextValidStart = ((pageIndex + 1) * CYCLE_HEIGHT) + PAGE_MARGIN;
    
            let bottomY = block.offsetTop + block.offsetHeight;
            
            if (bottomY > deadZoneStart) {
              // Push down tot the next page
              const distanceToNextPage = nextValidStart - block.offsetTop;
              block.style.marginTop = `${distanceToNextPage}px`;
              
              //updating the page index
              pageIndex++; 
            }
    
            //updating the max pages counter
            if (pageIndex > maxPageIndex) {
              maxPageIndex = pageIndex;
            }
          }


      const requiredPaperHeight = (maxPageIndex + 1) * CYCLE_HEIGHT;
      docPage.style.height = `${requiredPaperHeight}px`;

      lastTotalPages = maxPageIndex + 1;
      renderPageNumbers(lastTotalPages);
      renderHeaderFooters(lastTotalPages);
      renderWatermarks(lastTotalPages);

      //checking the active page on which the user is focusing on
      let activePage = 1;
      const selection = window.editor.getSelection();

      if (selection) {
        const bounds = window.editor.getBounds(selection.index);
        if (bounds) {
          activePage = Math.floor(bounds.top / CYCLE_HEIGHT) + 1;
        }
      }

      //counting words in the document
      const text = window.editor.getText().trim();
      const wordCount = text.length > 0 ? text.split(/\s+/).length : 0;

      //sending the document stats to event bus
      window.EventBus.emit("page-update", { 
          totalPages: maxPageIndex + 1,
          currentPage: activePage,
          wordCount:wordCount
        });
    }


    // Run the pagination math every time the user types or hits enter
    window.editor.on('text-change', (eventName, ...args) => {
      enforcePagination();
      ensureImagesDraggable();
    });

    // Run once on intial load
    enforcePagination();

    window.editor.focus();
  }
})();