const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const globals = require("globals");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = tseslint.config(
    { ignores: ["dist/**", "node_modules/**"] },
    {
        files: ["**/*.js"],
        ...js.configs.recommended,
        languageOptions: {
            ...js.configs.recommended.languageOptions,
            globals: { ...globals.node },
        },
    },
    {
        files: ["**/*.ts"],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: {
            globals: { ...globals.node },
        },
    },
    eslintConfigPrettier,
);
