import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";

const compat = new FlatCompat({
  baseDirectory: path.resolve(),
});

export default [
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
  ...compat.extends("next/core-web-vitals"),
];
