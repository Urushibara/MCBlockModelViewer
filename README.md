# MCBlockModelViewer

**MCBlockModelViewer** is a tool for loading Minecraft JARs and browsing blocks in a web viewer.

## Features

- Loads blockstates, model JSON files, and textures to dynamically generate and render block models.
- Allows selection of any blockstate properties for previewing different block variants.
- Supports loading and applying multiple resource packs.
- Exports renders as PNG images. Animated textures are supported and can be saved as APNG.

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Urushibara/MCBlockModelViewer.git
cd mcblockmodelviewer
```

### 2. Install dependencies
```bash
npm install
```

#### Dependency Note

This project uses a forked version of [`canvas2apng`](https://github.com/Urushibara/canvas2apng),  
customized to work as an ES module. It is installed via GitHub:

```json
"@urushibara/canvas2apng": "github:Urushibara/canvas2apng"
```
Note: `git` is required for npm install to work correctly.


### 3. Start the development server
```bash
npm run dev
```
The app will be available at http://localhost:5173 by default.



## Special Thanks to AI
Most of the source code was generated with the help of AI (ChatGPT and Gemini),  
while design, testing, debugging, and fixes were done manually.
