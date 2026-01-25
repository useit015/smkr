import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        requestAnimationFrame: "readonly",
        performance: "readonly",
        setTimeout: "readonly",
        Promise: "readonly",
        Object: "readonly",
        Math: "readonly",
        Array: "readonly",
        localStorage: "readonly",
        Audio: "readonly",
        navigator: "readonly",
        KeyboardEvent: "readonly",
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-prototype-builtins": "off",
    },
  },
];
