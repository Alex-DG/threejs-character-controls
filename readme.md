# Three.JS FBX Loader

Load FBX character with animations. The 3d model and animations can be found on [mixamo.com](https://www.mixamo.com/) by Adobe.

By pressing one of these keys: w,a,s,d and shift (turn on/off running mode) or space (start dancing!), you will be able to controle the character loaded.

<img alt="movements" src="https://user-images.githubusercontent.com/4311684/121783253-73eebc00-cba5-11eb-9a19-0f9d7fa0953a.gif" width="250" height="250">
<img alt="macarena" src="https://user-images.githubusercontent.com/4311684/121783271-8668f580-cba5-11eb-8f1d-ef949c7bf5a5.gif" width="250" height="250">

[Demo](https://threejs-fbx-loader.netlify.app/) a bit long to load but at the moment it's not very optimised. No draco loader, waiting before all actions to be loaded before showing the model.. But it gives you an overview (after the loading is done!) if you don't want to run the project locally.

## Setup

Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

```bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```
