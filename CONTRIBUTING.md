# Contributing to Simple Cold Email

Thank you for your interest in contributing to `simple-cold-email`! We welcome contributions ranging from bug fixes and documentation enhancements to new features and performance optimizations.

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

---

## Development Setup

### Prerequisites
- **Node.js**: >= 20.0.0
- **Package Manager**: `pnpm` >= 10.0.0 (`corepack enable pnpm` or `npm install -g pnpm`)
- **Git**

### Step-by-Step Instructions

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/<your-username>/simple-cold-email.git
   cd simple-cold-email
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   *(By default, `.env.example` comes configured in Simulation Mode so you can develop immediately without an active Resend API key).*

4. **Start the Development Server**
   ```bash
   pnpm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. Default login credentials:
   - Email: `demo@client.com`
   - Password: `password123`

---

## Branching & Commit Guidelines

### Branch Naming
- `feat/feature-name` for new capabilities
- `fix/bug-description` for bug repairs
- `docs/documentation-update` for documentation changes
- `refactor/component-name` for code refactoring without functional alterations

### Conventional Commits
Please follow the [Conventional Commits](https://www.conventionalcommits.org/) convention:
```
feat(composer): add support for email attachments
fix(contacts): prevent duplicate email registration
docs(readme): add docker compose deployment instructions
refactor(storage): streamline serverless fallback handling
```

---

## Quality Checks & Verification

Before submitting a pull request, ensure all local checks pass:

```bash
# Run ESLint validation
pnpm run lint

# Run TypeScript static type check
pnpm run typecheck

# Run production build
pnpm run build
```

---

## Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of the upstream repository.
3. Fill out the PR template completely with a clear description, related issue numbers, and verification notes.
4. Ensure all GitHub Actions CI checks pass.
5. Address any review comments or feedback promptly.
