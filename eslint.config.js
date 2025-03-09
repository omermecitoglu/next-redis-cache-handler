import omer from "@omer-x/eslint-config";

export default [
  ...omer,
  {
    rules: {
      "@typescript-eslint/class-methods-use-this": "off",
    },
  },
];
