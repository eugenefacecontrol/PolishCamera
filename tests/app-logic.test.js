import test from "node:test";
import assert from "node:assert/strict";

import {
  filterPredictionsByScore,
  formatPredictionScore,
  getLocalizedText,
  getTopPredictions,
  sortPredictionsByScore,
  translateClass
} from "../src/app-logic.js";

test("returns localized UI text for polish and russian", () => {
  assert.equal(getLocalizedText("pl", "startCamera"), "Włącz kamerę");
  assert.equal(getLocalizedText("ru", "startCamera"), "Включить камеру");
});

test("falls back to polish text when language key is unsupported", () => {
  assert.equal(getLocalizedText("en", "resultsTitle"), "Wykryte obiekty");
});

test("translates known object classes", () => {
  assert.equal(translateClass("cell phone", "pl"), "telefon");
  assert.equal(translateClass("cell phone", "ru"), "телефон");
});

test("falls back to original class name when translation is missing", () => {
  assert.equal(translateClass("lamp", "pl"), "lamp");
});

test("sorts predictions by descending confidence", () => {
  const predictions = [
    { class: "book", score: 0.67 },
    { class: "sofa", score: 0.91 },
    { class: "cup", score: 0.72 }
  ];

  const sorted = sortPredictionsByScore(predictions);

  assert.deepEqual(
    sorted.map((prediction) => prediction.class),
    ["sofa", "cup", "book"]
  );
});

test("selects top predictions for live captions", () => {
  const predictions = [
    { class: "book", score: 0.61 },
    { class: "sofa", score: 0.91 },
    { class: "cup", score: 0.72 }
  ];

  const topPredictions = getTopPredictions(predictions, 2);

  assert.equal(topPredictions.length, 2);
  assert.deepEqual(
    topPredictions.map((prediction) => prediction.class),
    ["sofa", "cup"]
  );
});

test("filters weak predictions out of the detection result", () => {
  const predictions = [
    { class: "book", score: 0.49 },
    { class: "sofa", score: 0.5 },
    { class: "cup", score: 0.88 }
  ];

  const filtered = filterPredictionsByScore(predictions, 0.5);

  assert.deepEqual(
    filtered.map((prediction) => prediction.class),
    ["sofa", "cup"]
  );
});

test("formats confidence scores as rounded percentages", () => {
  assert.equal(formatPredictionScore(0.751), "75%");
  assert.equal(formatPredictionScore(0.996), "100%");
});
