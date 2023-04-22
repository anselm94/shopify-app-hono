import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';

/**
 * @type {import('rollup').RollupOptions[]}
 */
const config = [
  // CommonJS & ES output
  {
    input: 'src/index.ts',
    plugins: [esbuild()],
    output: [
      {
        file: 'build/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'build/index.mjs',
        format: 'es',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'src/adapter/hono/index.ts',
    plugins: [esbuild()],
    output: [
      {
        file: 'build/adapter-hono.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'build/adapter-hono.mjs',
        format: 'es',
        sourcemap: true,
      },
    ],
  },
  // Typescript Definitions
  {
    input: 'src/index.ts',
    plugins: [dts()],
    output: {
      file: 'build/index.d.ts',
      format: 'es',
    },
  },
  {
    input: 'src/adapter/hono/index.ts',
    plugins: [dts()],
    output: {
      file: 'build/adapter-hono.d.ts',
      format: 'es',
    },
  },
];
export default config;
