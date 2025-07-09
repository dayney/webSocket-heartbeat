import eslint from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import parserVue from "vue-eslint-parser";
import pluginTs from "@typescript-eslint/eslint-plugin";
import parserTs from "@typescript-eslint/parser";

// 环境判断
const nodeEnv =
  typeof process !== "undefined" && process.env && process.env.NODE_ENV
    ? process.env.NODE_ENV
    : "";
const isProd = nodeEnv === "production";
const isTest = nodeEnv === "test";

// 基础配置
const baseConfig = {
  files: ["**/*.ts", "**/*.tsx"],
  languageOptions: {
    parser: parserTs,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    globals: {
      console: "readonly",
      document: "readonly",
      __dirname: "readonly",
    },
  },
  plugins: {
    "@typescript-eslint": pluginTs,
  },
  rules: {
    "no-debugger": "error",
    "comma-dangle": [
      "error",
      {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
        functions: "always-multiline",
      },
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "variable",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
      },
    ],
    complexity: ["error", { max: 5 }],
  },
};

// 开发环境配置
const devConfig = {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    "no-console": "off",
  },
};

// 测试环境配置
const testConfig = {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    "no-console": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
};

// 生产环境配置
const prodConfig = {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    "no-console": "error",
  },
};

// Vue 配置
const vueConfig = {
  files: ["**/*.vue"],
  languageOptions: {
    parser: parserVue,
    parserOptions: {
      parser: parserTs,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    globals: {
      console: "readonly",
      document: "readonly",
    },
  },
  plugins: {
    vue: pluginVue,
  },
  rules: {
    "vue/multi-word-component-names": "off",
    "vue/require-default-prop": "error",
    "vue/require-prop-types": "error",
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/component-definition-name-casing": ["error", "PascalCase"],
    "vue/attributes-order": [
      "error",
      {
        order: [
          "DEFINITION",
          "LIST_RENDERING",
          "CONDITIONALS",
          "RENDER_MODIFIERS",
          "GLOBAL",
          "UNIQUE",
          "TWO_WAY_BINDING",
          "OTHER_DIRECTIVES",
          "OTHER_ATTR",
          "EVENTS",
          "CONTENT",
        ],
      },
    ],
  },
};

// 根据环境选择配置
const config = isProd ? prodConfig : isTest ? testConfig : devConfig;

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.config.*",
      "configs/*.config.*",
      "scripts/*.js",
    ],
  },
  eslint.configs.recommended,
  config,
  vueConfig,
  {
    files: [
      "*.js",
      "*.cjs",
      "*.mjs",
      "scripts/**/*.js",
      "commitlint.config.js",
      "configs/**/*.js",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        __dirname: "readonly",
        console: "readonly",
        exports: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
  },
];
