import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import prettierConfig from '@vue/eslint-config-prettier'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/node_modules/**', 'trees/**', 'bees/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),
  prettierConfig,
  {
    // Прямой доступ к Web Storage разрешён только в обёртке storage.ts.
    name: 'app/no-direct-web-storage',
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Используй обёртку @/shared/persistence/storage' },
        { name: 'sessionStorage', message: 'Используй обёртку @/shared/persistence/storage' },
      ],
    },
  },
  {
    name: 'app/storage-wrapper-exception',
    files: ['src/shared/persistence/storage.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
]
