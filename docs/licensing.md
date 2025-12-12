# Licensing

This document covers the licensing terms for Pytrix and its dependencies.

---

## Project License

Pytrix is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Pytrix Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## What This Means

### You CAN:

- ✅ Use Pytrix commercially
- ✅ Modify the source code
- ✅ Distribute copies
- ✅ Use privately
- ✅ Sublicense

### You MUST:

- 📋 Include the copyright notice in copies
- 📋 Include the license text in copies

### You CANNOT:

- ❌ Hold contributors liable
- ❌ Use trademarks without permission

---

## Third-Party Dependencies

Pytrix uses several open-source libraries. Here are the key dependencies and their licenses:

### Core Framework

| Package                                       | License    | Purpose         |
| --------------------------------------------- | ---------- | --------------- |
| [Next.js](https://nextjs.org/)                | MIT        | React framework |
| [React](https://react.dev/)                   | MIT        | UI library      |
| [TypeScript](https://www.typescriptlang.org/) | Apache 2.0 | Type system     |

### Python Runtime

| Package                         | License | Purpose               |
| ------------------------------- | ------- | --------------------- |
| [Pyodide](https://pyodide.org/) | MPL-2.0 | Python in WebAssembly |

> [!NOTE]
> Pyodide is licensed under Mozilla Public License 2.0. This is a weak copyleft license that allows use in MIT-licensed projects. The Pyodide source code modifications (if any) must remain MPL-2.0, but this does not affect Pytrix's MIT license.

### AI Integration

| Package                                                                      | License    | Purpose    |
| ---------------------------------------------------------------------------- | ---------- | ---------- |
| [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) | Apache 2.0 | Gemini SDK |

### UI Components

| Package                                                     | License | Purpose           |
| ----------------------------------------------------------- | ------- | ----------------- |
| [shadcn/ui](https://ui.shadcn.com/)                         | MIT     | Component library |
| [Radix UI](https://www.radix-ui.com/)                       | MIT     | Primitives        |
| [Tailwind CSS](https://tailwindcss.com/)                    | MIT     | CSS framework     |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | MIT     | Code editor       |
| [Phosphor Icons](https://phosphoricons.com/)                | MIT     | Icons             |
| [Tabler Icons](https://tabler-icons.io/)                    | MIT     | Icons             |

### State & Data

| Package                                  | License | Purpose          |
| ---------------------------------------- | ------- | ---------------- |
| [Zustand](https://zustand-demo.pmnd.rs/) | MIT     | State management |
| [Recharts](https://recharts.org/)        | MIT     | Charts           |
| [date-fns](https://date-fns.org/)        | MIT     | Date utilities   |

### Utilities

| Package                                                        | License    | Purpose             |
| -------------------------------------------------------------- | ---------- | ------------------- |
| [clsx](https://www.npmjs.com/package/clsx)                     | MIT        | Class names         |
| [tailwind-merge](https://www.npmjs.com/package/tailwind-merge) | MIT        | Tailwind utilities  |
| [class-variance-authority](https://cva.style/)                 | Apache 2.0 | Variant styles      |
| [cmdk](https://cmdk.paco.me/)                                  | MIT        | Command menu        |
| [sonner](https://sonner.emilkowal.ski/)                        | MIT        | Toast notifications |

### Development & Testing

| Package                                         | License    | Purpose           |
| ----------------------------------------------- | ---------- | ----------------- |
| [Vitest](https://vitest.dev/)                   | MIT        | Testing           |
| [Playwright](https://playwright.dev/)           | Apache 2.0 | E2E testing       |
| [ESLint](https://eslint.org/)                   | MIT        | Linting           |
| [Testing Library](https://testing-library.com/) | MIT        | Testing utilities |

---

## License Compatibility

All dependencies are compatible with Pytrix's MIT license:

| License    | Compatible | Notes                    |
| ---------- | ---------- | ------------------------ |
| MIT        | ✅ Yes     | Permissive               |
| Apache 2.0 | ✅ Yes     | Permissive, patent grant |
| MPL-2.0    | ✅ Yes     | File-level copyleft only |
| BSD-2/3    | ✅ Yes     | Permissive               |

---

## Attribution

### Required Attributions

When distributing Pytrix or derivative works:

1. **Include the MIT License** — Copy of the license text
2. **Preserve copyright notices** — In source files

### Recommended Attributions

While not required, we appreciate:

- Link back to [Pytrix GitHub](https://github.com/SH1SHANK/Pytrix)
- Credit in your application's about page

---

## Trademark Notice

"Pytrix" and the Pytrix logo (if any) are trademarks.

**You MAY NOT:**

- Use "Pytrix" to imply endorsement
- Use the logo without permission
- Create confusingly similar names

**You MAY:**

- Refer to Pytrix by name for compatibility statements
- State that your project is based on Pytrix

---

## Google Gemini API Terms

When using Pytrix with Google's Gemini API:

- You are responsible for your API key usage
- You must comply with [Google's Terms of Service](https://policies.google.com/terms)
- You must comply with [Generative AI Additional Terms](https://policies.google.com/terms/generative-ai)

Pytrix does not proxy, store, or monitor your Gemini API usage.

---

## Contributing and License

By contributing to Pytrix:

1. You agree that contributions are licensed under MIT
2. You certify you have the right to submit the contribution
3. You understand your contribution may be distributed publicly

See [CONTRIBUTING.md](./contribution-guide.md) for contribution guidelines.

---

## Questions

For licensing questions:

- Open an issue on GitHub
- Tag it with `licensing`

For commercial licensing or trademark inquiries, contact the maintainers.

---

## Full Dependency List

For a complete list of all dependencies and their licenses, run:

```bash
npx license-checker --summary
```

Or view `package.json` and `package-lock.json` for the complete dependency tree.
