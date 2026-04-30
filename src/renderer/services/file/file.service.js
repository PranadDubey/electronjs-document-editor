(() =>{
    let currentFilePath = null;
    window.addEventListener("header:file-action", async(e)=>{
        const {action } = e.detail

        if(action==="open-doc"){
            await handleFileOpen()
        }
        else if(action == "save-doc"){
            await handleFileSave()
        }
    })

    async function handleFileOpen() {
        try {
            // Ensure this matches what you exposed in preload.js
            const exposeNamespace = window.fileSystem;
            
            const fileData = await exposeNamespace.openDocument();
            
            if (!fileData) return;
            currentFilePath = fileData.filePath; 
            console.log("Opened file:", fileData.fileName);

            if (window.editor) {
                if (fileData.isHtml) {
                    // It's a converted .docx file (HTML code)
                    // We need to paste HTML so styling/headers remain intact
                    const delta = window.editor.clipboard.convert({ html: fileData.content });
                    window.editor.setContents(delta, 'api');
                } else {
                    // It's a plain .txt file
                    window.editor.setText(fileData.content);
                }
            } else {
                console.error("Quill editor is not initialized.");
            }

        } catch (error) {
            console.error("Failed to open document:", error);
        }
    }

    async function handleFileSave() {
        if (!window.editor) {
            console.error("Quill editor is not initialized.");
            return;
        }

        try {
            // Get the HTML content from Quill to preserve formatting (bold, italic, etc)
            const htmlContent = window.editor.root.innerHTML;
            const plainText = window.editor.getText()

            const exposeNamespace = window.fileSystem;
            
            // Send the content to the main process, along with the path if we have one
            const savedPath = await exposeNamespace.saveDocument({
                filePath: currentFilePath,
                content: htmlContent,
                text: plainText
            });

            if (savedPath) {
                // If it was a generic "Save As", update our current path to the new destination
                currentFilePath = savedPath;
                console.log("Successfully saved to:", currentFilePath);
                alert("File Saved!");
            } else {
                console.log("Save cancelled.");
            }
        } catch (error) {
            console.error("Failed to save document:", error);
            alert("Failed to save file.");
            window.editor.focus(); 
        }
    }
})()