<h1 align="center">Clueless Crafter - Cascadia JS 2025 Project</h1>

🏗️ "Clueless Crafter", helps reduce friction for real estate developers and individuals moving from idea to permit by providing natural language tools in a user-friendly experience.

🏡 Inspired by the memoir "Cabin" by Patrick Hutchison, and my own attempts to understand the daunting process of building on vacant land — I wanted to make parcel discovery, zoning regulations and permitting less intimidating.

<div align="center">
  <img alt="Screenshot 2025-10-12 at 22 26 47" src="https://github.com/user-attachments/assets/545d842d-9630-45a9-9ebb-82c663af3163" />
</div>

<h3 align="center">High Level Architecture</h3>
<div align="center">
   <img align="center" alt="Architecture overview" src="https://github.com/user-attachments/assets/f9758cae-de1b-43d4-8be5-b47eddcf6a4e" />
</div>

Demo here: https://lnkd.in/gJWp4Epb

### Local Development



## Running the Server

### Prep Env Vars
1. `cp .env.local.example .env.local`

### Setting up the SVG Generator LLM Workflow via Langflow
* The SVG Generator is a LLM powered workflow that given a prompt that includes an rawtext svg, will make modifications as requested within the prompt.
1. Download the Langflow desktop app https://www.langflow.org/desktop
2. Once Langflow is up and running locally, create a Langflow API Key and set `LANGFLOW_API_KEY` 
env var to the key.
3. Upload the workflow from ./langflow/svg_generator_workflow.json . You should then see a drag-n-drop visual of the workflow.
4. Supply your own _OpenAI API Key_ from https://platform.openai.com/api-keys to the Agent in the Langflow workflow. Set the env var `OPEN_API_KEY` to that key as well.


### Running the NextJS Server
```
npm run dev
```

### Rendering the Web App
* Visit http://localhost:3000 and start crafting! 
* Note - interactions with the Chat will query OpenAI, and will incur cost dependent on your personal plan.


