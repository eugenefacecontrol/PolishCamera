# PolishCamera

Static browser camera app for GitHub Pages. It detects common objects directly in the browser and shows their names in Polish or Russian.

GitHub Pages URL:
[https://eugenefacecontrol.github.io/PolishCamera/](https://eugenefacecontrol.github.io/PolishCamera/)

## Features

- Works as a fully static site on GitHub Pages
- Uses the device camera over HTTPS
- Detects objects in real time in the browser
- Shows bounding boxes and translated labels
- Lets you switch the interface and object labels between Polish and Russian

## How it works

The app uses TensorFlow.js with the COCO-SSD object detection model. Detection runs on the client side, so no backend is required.

## Usage

1. Open the GitHub Pages URL.
2. Allow camera access in the browser.
3. Choose the language: `Polski` or `Русский`.
4. Point the camera at everyday objects.

## Notes

- Camera access requires a secure context. GitHub Pages provides HTTPS, so this works there.
- Detection quality depends on lighting, camera quality, and whether the object is covered by the COCO model classes.
