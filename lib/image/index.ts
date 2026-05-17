/**
 * Image Module Index
 */

export {
  preprocessImage,
} from './preprocessor'

export {
  detectImageOrientation,
  autoRotateImage,
  compressImageIntelligent,
  scaleImageIfNeeded,
} from './optimization'

export type {
  PreprocessOptions,
} from './preprocessor'
