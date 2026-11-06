import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env'

export default {
  plugins: [
    postcssPresetEnv({ stage: 2, features: { 'nesting-rules': true } }),
    autoprefixer(),
  ],
}
