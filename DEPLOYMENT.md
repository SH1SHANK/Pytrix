# Deployment Documentation

Pytrix uses **Vercel** for automatic continuous deployment.

## Overview

The deployment pipeline is automated:

1.  **Production Deployment**: Merges to `main` are automatically deployed to production (e.g., `https://pytrix.vercel.app`).
2.  **Preview Deployment**: Every pull request and branch push triggers a unique preview URL for testing.

## Prerequisites

- **GitHub Repo**: Connected to a Vercel Project.
- **Node.js**: Version 20 or higher.

## Configuration

### Project Settings (`vercel.json`)

The project is configured as a Next.js application:

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Environment Variables

Pytrix uses a **Bring Your Own Key (BYOK)** model for the Gemini API.

- **Client-Side**: API keys are stored in the user's browser (`localStorage`) and are NEVER sent to our servers.
- **Server-Side**: No sensitive environment variables or secrets are required in the Vercel dashboard for basic operation.

> [!NOTE] > `NEXT_PUBLIC_*` variables are safe to commit if they contain non-sensitive configuration. Sensitive keys must strictly be kept out of the repository.

## CI/CD Pipeline

We use **GitHub Actions** for quality gates before deployment:

- **Workflows**: Located in `.github/workflows/ci.yml`
- **Checks**:
  - `npm run lint`: Ensures code quality and standard compliance.
  - `npm run build`: Verifies the application builds successfully.

Vercel will only promote a deployment to production if the build succeeds.

## How to Deploy

### Automatic (Recommended)

1.  Make changes and push to a feature branch.
2.  Open a Pull Request against `main`.
3.  Vercel bot will comment with a **Preview URL**.
4.  Once the PR is approved and merged, Vercel deploys to **Production**.

### Manual Redeploy

If you need to trigger a manual redeploy without code changes:

1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Select the Pytrix project.
3.  Go to **Deployments**.
4.  Click the three dots (`...`) on the latest deployment and select **Redeploy**.
