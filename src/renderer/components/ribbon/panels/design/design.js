(() => {
  const btn = document.getElementById("watermark-btn");
  const menu = document.getElementById("watermark-menu");
  const radios = document.querySelectorAll('input[name="wm-type"]');
  const imgDetails = document.getElementById("wm-image-details");
  const textDetails = document.getElementById("wm-text-details");
  const selectImgBtn = document.getElementById("wm-select-img");
  const imgName = document.getElementById("wm-img-name");
  const applyBtn = document.getElementById("wm-apply");
  
  let selectedImage = null;

  if (btn && menu) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });
    
    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#watermark-group")) {
        menu.hidden = true;
      }
    });

    // Stop clicks from closing inside menu
    menu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Toggle Visibility of Image vs Text inputs based on Radios
  radios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      const val = e.target.value;
      if (imgDetails) imgDetails.style.display = val === "image" ? "flex" : "none";
      if (textDetails) textDetails.style.display = val === "text" ? "flex" : "none";
    });
  });

  if (selectImgBtn) {
    selectImgBtn.addEventListener("click", async () => {
      // Call the image picker API through preload.js
      const base64Img = await window.insertAPI.pickImage();
      if (base64Img) {
        selectedImage = base64Img;
        if (imgName) imgName.textContent = "Image selected ✓";
      }
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const type = document.querySelector('input[name="wm-type"]:checked').value;
      const config = { type };

      if (type === "image") {
        if (!selectedImage) {
          alert("Please select an image first.");
          return;
        }
        config.image = selectedImage;
      } else if (type === "text") {
        config.text = document.getElementById("wm-text-val").value;
        config.color = document.getElementById("wm-color").value;
        let rawSize = parseInt(document.getElementById("wm-size").value, 10);
        if (rawSize > 200) rawSize = 200;
        if (rawSize < 10) rawSize = 10;
        config.size = rawSize;
        config.layout = document.querySelector('input[name="wm-layout"]:checked').value;
      }

      // Fire a custom event letting the Document know to generate watermarks
      window.dispatchEvent(new CustomEvent("watermark:apply", { detail: config }));
      menu.hidden = true;
    });
  }
  const pageColorPicker = document.getElementById("page-color-picker");

if (pageColorPicker) {
  // Use "input" so it updates live as the user drags the color slider
  pageColorPicker.addEventListener("input", (e) => {
    const selectedColor = e.target.value;
    window.dispatchEvent(new CustomEvent("pageColor:apply", { 
      detail: { color: selectedColor } 
    }));
  });
}
})();