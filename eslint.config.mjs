import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/**
 * Flat config, using eslint-config-next 16's native flat exports directly.
 * (The older FlatCompat bridge is not needed and in fact breaks against this
 * version of the shared config.)
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      // Generated files — regenerate with `pnpm generate:types` and
      // `pnpm generate:importmap` rather than hand-editing.
      'src/payload-types.ts',
      'src/app/(payload)/admin/importMap.js',
      'src/migrations/**',
      'src/components/site/logoPaths.ts',
    ],
  },
  {
    rules: {
      /**
       * The site deliberately uses plain `<img>` rather than `next/image`.
       * Payload already generates 480/960/1600/2400px WebP variants on upload and
       * they are served straight from Cloudflare R2, where egress is free.
       * Routing them through Vercel's image optimiser would add a paid quota and
       * a serverless hop for no visual gain — see ResponsiveImage.tsx.
       */
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]

export default config
