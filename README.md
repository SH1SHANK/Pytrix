# Pytrix

**Master Python with AI-Powered Practice**

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-orange)

---

## 🚀 What is Pytrix?

**Pytrix** is a modern, privacy-focused platform designed to help you master Python through adaptive, AI-generated challenges. Unlike traditional coding platforms with static problem sets, Pytrix uses Google's Gemini AI to generate infinite, unique exercises tailored to your skill level.

It combines a real in-browser Python runtime (Pyodide) with an intelligent AI tutor that provides instant feedback, hints, and code analysis—all without your data ever leaving your browser.

---

## ✨ Features

- **⚡ Auto Mode**: A rapid-fire practice loop where problems are generated instantly. Solve, get feedback, and move to the next challenge without friction.
- **🛠️ Manual Practice**: Create custom practice sessions based on specific topics (e.g., "List Comprehensions", "Recursion") and difficulty levels.
- **🐍 Local Python Runtime**: Code runs directly in your browser using **Pyodide**. No server-side execution, ensuring speed and privacy.
- **🧠 Adaptive Difficulty**: The AI analyzes your performance and adjusts the complexity of subsequent questions to keep you in the "flow state."
- **📊 Stats & Insights**: Track your progress with detailed visualization of your accuracy, speed, and topic mastery.
- **🤖 API Usage Dashboard**: Monitor your token usage and API costs in real-time.
- **⚙️ Deep Customization**: Full control over keybindings, themes, safety caps, and AI parameters.
- **⌨️ Command Palette**: Navigate the entire app with your keyboard (`Cmd+K`).

---

## 🛠️ Tech Stack

Built with the latest modern web technologies:

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Runtime**: [Pyodide](https://pyodide.org/) (WebAssembly Python)
- **AI Model**: [Google Gemini Pro](https://deepmind.google/technologies/gemini/)
- **State Management**: Zustand
- **Charts**: Recharts

---

## ⚡ Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/SH1SHANK/Pytrix.git
    cd Pytrix
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

4.  **Open in Browser:**
    Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🔑 Bring Your Own Key (BYOK)

Pytrix operates on a **Bring Your Own Key** model to ensure privacy and control. We do not proxy your requests or potential secrets through our servers.

### How to get a key:

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Create a new API key.
3.  In Pytrix, go to **Settings** → **API Keys**.
4.  Paste your key. It is saved to your browser's **localStorage** and is never sent to our servers.

### Security Model:

- **Client-Side Only**: Your key stays in your browser.
- **Direct Communication**: The app talks directly to the Gemini API from your client.
- **Usage Limits**: Configure safety caps in Settings to prevent accidental over-usage.

---

## 🧩 How It Works

### The Loop

1.  **Generation**: You request a question. The app sends a prompt to Gemini via `modelRouter`.
2.  **Coding**: You write code in the Monaco Editor.
3.  **Execution**: When you click "Run", your code is executed locally in WebAssembly via **Pyodide**. Standard output (stdout) and errors are captured.
4.  **Evaluation**: The execution result + your code is sent back to Gemini to verify correctness and provide feedback.

### Architecture Highlights

- **`modelRouter.ts`**: Centralized handler for AI calls, managing failovers and model selection.
- **`config.json`**: Runtime configuration for feature flags and defaults.
- **`statsStore.ts`**: Persists your progress and history locally.

---

## 🚀 Deployment

Pytrix is optimized for deployment on **Vercel**.

### Automatic Deployment

The repository is set up with **Continuous Deployment**:

- **Production**: Merges to `main` are automatically deployed.
- **Preview**: Pull Requests get a unique preview URL.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full details.

---

## 🤝 Contributing

We welcome contributions!

1.  Fork the repository.
2.  Create a feature branch: `git checkout -b feature/amazing-feature`.
3.  Commit your changes: `git commit -m 'Add amazing feature'`.
4.  Push to the branch: `git push origin feature/amazing-feature`.
5.  Open a Pull Request.

Please ensure `npm run lint` and `npm run build` pass before submitting.

---

## 📄 License

This project is licensed under the **MIT License**.
