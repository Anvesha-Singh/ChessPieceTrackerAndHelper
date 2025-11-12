import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { loadGraphModel, GraphModel } from "@tensorflow/tfjs-converter";
import type { MutableRefObject } from 'react';
import { MODEL_HEIGHT, MODEL_WIDTH } from "../utils/constants";

/**
 * Load and warm up TFJS models. Resolves when both models are compiled and refs are set.
 */
export async function loadModels(
  piecesModelRef: MutableRefObject<GraphModel | null>,
  xcornersModelRef: MutableRefObject<GraphModel | null>
): Promise<void> {
  // Skip if already loaded
  if (piecesModelRef.current && xcornersModelRef.current) {
    console.log("✓ Models already loaded in refs");
    return;
  }

  // Ensure a backend is registered and selected
  try {
    await tf.setBackend('webgl');
  } catch {
    // If webgl isn't available, tf will choose a default; proceed
  }
  await tf.ready();
  try {
    console.log("🔄 Initializing TensorFlow backend...");

    // WebGL optimization settings
    tf.env().set('WEBGL_EXP_CONV', true);
    tf.env().set('WEBGL_PACK', false);
    tf.env().set('ENGINE_COMPILE_ONLY', true);

  console.log(`📦 Loading quantized models from public root...`);
    const loadStart = performance.now();

    // NOTE: Assets placed under Vite's public/ directory are served from the root.
    // So the correct URL is "/pieces_model/model.json" (no leading "public/").
    const piecesModel: GraphModel = await loadGraphModel(
      "/pieces_model/model.json"
    );
    console.log("✓ Pieces model loaded");

    const xcornersModel: GraphModel = await loadGraphModel(
      "/xcorners_model/model.json"
    );
    console.log("✓ XCorners model loaded");

    // Warm up models with dummy input (compiles WebGL shaders)
    console.log("🔥 Warming up models...");
    const dummyInput: tf.Tensor = tf.zeros([1, MODEL_HEIGHT, MODEL_WIDTH, 3]);

    // Execute models to compile shaders
    const piecesOutput = piecesModel.execute(dummyInput);
    const xcornersOutput = xcornersModel.execute(dummyInput);

    // Cleanup dummy tensors
    tf.dispose([dummyInput, piecesOutput as any, xcornersOutput as any]);

    // Finalize WebGL compilation
    const backend: any = tf.backend();
    backend.checkCompileCompletion?.();
    backend.getUniformLocations?.();
    tf.env().set('ENGINE_COMPILE_ONLY', false);

    // Store in refs (now safe to use in components)
    piecesModelRef.current = piecesModel;
    xcornersModelRef.current = xcornersModel;

    const loadEnd = performance.now();
    const loadTime = ((loadEnd - loadStart) / 1000).toFixed(2);
    console.log(`✅ Models loaded and warmed up in ${loadTime}s`);
  } catch (error) {
    console.error("❌ Failed to load models:", error);

  // Try fallback to relative (legacy) paths if root URLs failed (e.g. in non-Vite env)
  console.log("📥 Attempting fallback to legacy relative model paths...");
  const piecesModel = await loadGraphModel("pieces_model/model.json");
  const xcornersModel = await loadGraphModel("xcorners_model/model.json");

    piecesModelRef.current = piecesModel;
    xcornersModelRef.current = xcornersModel;
    console.log("⚠️ Loaded fallback unquantized models (slower)");
  }
}

/**
 * Helper to check if both models are loaded.
 */
export function areModelsReady(
  piecesModelRef: MutableRefObject<GraphModel | null>,
  xcornersModelRef: MutableRefObject<GraphModel | null>
): boolean {
  return Boolean(piecesModelRef?.current && xcornersModelRef?.current);
}

// Keep default export for legacy imports
export default loadModels;