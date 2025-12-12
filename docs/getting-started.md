# Getting Started with Pytrix

This guide will walk you through setting up Pytrix for local development and solving your first practice question.

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version            | How to Check     |
| ----------- | ------------------ | ---------------- |
| **Node.js** | 20.x or higher     | `node --version` |
| **npm**     | 10.x or higher     | `npm --version`  |
| **Git**     | Any recent version | `git --version`  |

> [!TIP]
> We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/SH1SHANK/Pytrix.git
cd Pytrix
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including:

- Next.js 16 and React 19
- Pyodide for Python execution
- Monaco Editor for the code editor
- shadcn/ui components
- Testing frameworks (Vitest, Playwright)

### 3. Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

> [!NOTE]
> The first load may take a few seconds as Next.js compiles the application.

---

## First-Time Setup

When you first access Pytrix, you'll be guided through an onboarding flow:

### Step 1: Welcome Screen

You'll see a brief introduction to Pytrix and its features.

### Step 2: API Key Configuration

Pytrix uses a **Bring Your Own Key (BYOK)** model. You'll need a Google Gemini API key for AI features.

#### How to Get a Gemini API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key

#### Entering Your Key:

1. Paste your API key in the input field
2. Click **"Test Connection"** to verify it works
3. Your key is saved to your browser's localStorage

> [!IMPORTANT]
> Your API key is **never sent to Pytrix servers**. It's stored locally and used to communicate directly with Google's Gemini API.

### Step 3: Complete Onboarding

After configuring your key, the onboarding is complete. You'll be redirected to the Dashboard.

---

## Your First Practice Session

### Using Manual Practice

1. From the Dashboard, click **"Manual Practice"** or press `Cmd/Ctrl+K` and type "manual"
2. Select a **Module** (e.g., "String Manipulation")
3. Choose a **Subtopic** (e.g., "Basic String Operations")
4. Pick a **Difficulty** (Beginner recommended for first run)
5. Click **"Generate Question"**

### Solving the Question

1. Read the problem description in the **Question Panel**
2. Write your Python solution in the **Code Editor**
3. Click **"Run"** to execute your code and see output
4. Click **"Submit"** to have the AI evaluate your solution

### Getting Help

If you're stuck:

- Click **"Get Hint"** for progressive hints (up to 2)
- After using hints, **"Reveal Solution"** becomes available
- The AI provides feedback explaining what went wrong

### Using Auto Mode

For a more dynamic experience:

1. From the Dashboard, click **"Start Auto Mode"**
2. Questions are generated automatically
3. Solve each question and get instant feedback
4. Your streak and difficulty adjust based on performance

---

## Project Structure

After cloning, your project structure looks like this:

```
pytrix/
├── src/
│   ├── app/           # Next.js pages and routes
│   ├── components/    # React components
│   ├── lib/           # Core services and utilities
│   ├── hooks/         # Custom React hooks
│   ├── data/          # Static data (topics.json)
│   └── types/         # TypeScript definitions
├── tests/             # Test suites
├── docs/              # Documentation (you are here)
├── public/            # Static assets
└── ...config files
```

For detailed architecture, see [Architecture](./architecture.md).

---

## Available Scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `npm run dev`           | Start development server |
| `npm run build`         | Build for production     |
| `npm run start`         | Start production server  |
| `npm run lint`          | Run ESLint               |
| `npm run test`          | Run all tests            |
| `npm run test:watch`    | Run tests in watch mode  |
| `npm run test:e2e`      | Run Playwright E2E tests |
| `npm run test:coverage` | Generate coverage report |

---

## Environment Variables

Pytrix uses a BYOK model and requires **no server-side environment variables** for normal operation.

### For Development (Optional)

If you're a maintainer running real API integration tests:

1. Copy the template:

   ```bash
   cp tests/env.test.local.example .env.test.local
   ```

2. Edit `.env.test.local`:
   ```bash
   INTERNAL_GEMINI_KEY="your-test-api-key"
   ```

> [!CAUTION]
> Never commit `.env.test.local` to version control. It's already in `.gitignore`.

---

## Troubleshooting

### "SharedArrayBuffer is not defined"

This occurs when the required security headers are missing. Pytrix needs:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

These are configured in `next.config.ts` and should work automatically in development.

**If using a custom server:** Ensure your server sends these headers.

### "API key is invalid"

1. Verify your key at [Google AI Studio](https://aistudio.google.com/)
2. Check that you copied the complete key (no trailing spaces)
3. Ensure your key has the Gemini API enabled

### Pyodide Takes Long to Load

The first load downloads the Pyodide runtime (~15MB). Subsequent loads use the browser cache. This is normal behavior.

### Tests Fail Locally

1. Ensure you're on Node.js 20+
2. Clear test cache: `npx vitest --clearCache`
3. Check that all dependencies are installed: `npm ci`

### Port 3000 Already in Use

```bash
# Find the process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

---

## Next Steps

Now that you're set up:

1. **Explore the Dashboard** — See your stats and module progress
2. **Try Auto Mode** — Experience adaptive difficulty
3. **Browse Modules** — Explore the curriculum at `/modules`
4. **Customize Settings** — Adjust preferences at `/support/settings`

### Learn More

- [Architecture](./architecture.md) — How Pytrix works under the hood
- [API Reference](./api-reference.md) — For developers extending Pytrix
- [Contributing](./contribution-guide.md) — Help improve Pytrix

---

## Deployment

Pytrix is optimized for deployment on Vercel. See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete deployment documentation including:

- Automatic CI/CD setup
- Preview deployments for PRs
- Production deployment workflow
