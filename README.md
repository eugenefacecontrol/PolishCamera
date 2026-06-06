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
- Includes automated unit tests and GitHub Actions CI

## Project Structure

- `index.html` - static GitHub Pages entrypoint
- `app.js` - browser app wiring and camera lifecycle
- `src/app-logic.js` - pure, testable logic for localization and prediction processing
- `tests/app-logic.test.js` - unit tests for translation, sorting, filtering, and score formatting
- `.github/workflows/ci.yml` - GitHub Actions workflow that runs tests on push and pull request

## How it works

The app uses TensorFlow.js with the COCO-SSD object detection model. Detection runs on the client side, so no backend is required.

## Usage

1. Open the GitHub Pages URL.
2. Allow camera access in the browser.
3. Choose the language: `Polski` or `Русский`.
4. Point the camera at everyday objects.

## Testing

This project now includes automated unit tests that run both locally and on GitHub.

Current test coverage includes:

- UI text localization for Polish and Russian
- Fallback behavior when a translation is missing
- Object label translation logic
- Prediction sorting by confidence
- Live caption selection for top detections
- Detection filtering by minimum confidence
- Confidence formatting shown in the interface

Run tests locally:

```bash
npm test
```

GitHub CI:

- Every push to `main` runs the test suite
- Every pull request runs the same checks before merge

This gives you a clean story for LinkedIn too: the project is not only deployed on GitHub Pages, but also covered by automated tests and validated in GitHub Actions.

## Notes

- Camera access requires a secure context. GitHub Pages provides HTTPS, so this works there.
- Detection quality depends on lighting, camera quality, and whether the object is covered by the COCO model classes.
