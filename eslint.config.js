import omer from "@omer-x/eslint-config";

export default [
  ...omer,
  {
    rules: {
      "no-console": "off",
      "@typescript-eslint/class-methods-use-this": "off",
    },
  },
];
