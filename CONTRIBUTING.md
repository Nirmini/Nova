# Contributing to Nova

## This file outlines general requirements for contributing to Nova
#### These are basic requirements for contributing. Even if you follow these, your contribution may still be excluded from the main branch.
---

# Code Requirements

- Code may **not** be obfuscated in any way. (Commits from Nirmini aim to be deobfuscated but we may miss areas.)
- Code must not leave the app in a broken state. (Breaking changes must also adapt everything to avoid the app breaking.)
- The addition of packages requires a specific reason for the addition.
- Code must be written in **plain JavaScript**. TypeScript or other transpiled languages are not used in this project.
- Do **not** use unreviewed AI-generated code. One of Nova's core goals is to be the best that it can be and when AI-generated code is contributed without any oversight, it has the potential to cause breaking changes. Nirmini internally uses Claude to automate some bug testing under supervision for example.

---

# Submitting a Contribution

#### The general flow for getting your changes into Nova is outlined below.

- **Fork** the repository and create your branch from the `master` branch unless otherwise specified.
- Make your changes, then open a **Pull Request** back into `master` (or the target branch if told otherwise). Include a clear description of what you changed and why.
- Pull Requests that do not have a clear description of what was changed may be held or rejected until one is provided.
- Once submitted, your PR will be reviewed. Feedback may be left and changes may be requested before it is merged.

## Branch Naming

When creating a branch for your contribution, use the following format where possible.

- `fix/<short-description>` — For bug fixes. (e.g. `fix/ticket-close-crash`)
- `feat/<short-description>` — For new features or additions. (e.g. `feat/roblox-group-rank`)
- `chore/<short-description>` — For non-code changes like docs, config, or cleanup. (e.g. `chore/update-readme`)

## Commit Messages

Keep commit messages short and to the point. A good commit message describes *what* changed, not *how* it changed.

- ✅ `Fix ticket close throwing an unhandled error`
- ✅ `Add roblox group rank command`
- ❌ `fixed stuff`
- ❌ `changes`

---

# Code Style

#### There is no formal linter config enforced at this time, but the following conventions are expected.

- Use **camelCase** for variable and function names.
- Use **PascalCase** for class names.
- Keep functions short and focused. If a function is doing too many things, split it up.
- Avoid leaving commented-out code in your final submission. Clean it up before opening the PR.
- Error handling should be present for any operation that can throw. Unhandled promise rejections or crashes are not acceptable.
- If you're adding a new command, follow the structure of an existing command in the same category as closely as possible.

---

# Reporting Bugs

#### Found something broken? Great, that's genuinely helpful.

- Check the [GitHub Issues](https://github.com/Nirmini/Nova/issues) page first to see if it's already been reported.
- If it hasn't, open a new issue. Include:
  - A clear description of what is happening vs. what you expected to happen.
  - Steps to reproduce it if possible.
  - Any relevant error messages or logs.
- If it's a **security vulnerability**, do **not** open a public issue. Refer to the [Security Policy](https://github.com/Nirmini/Nova/blob/master/SECURITY.md) for how to report it privately.

---

# Requesting Features

#### Have an idea for something Nova should do?

- Open a [GitHub Issue](https://github.com/Nirmini/Nova/issues) with a clear description of what you want and why it would be useful.
- Keep in mind that Nova is designed to be a self-contained moderation and community bot. Feature requests that fall outside of that scope are less likely to be accepted.
- Feature requests are not guaranteed to be implemented. If your idea is good, it will be considered.

---

# What Kinds of Contributions Are Welcome?

- Bug fixes — Always welcome.
- Performance improvements — Welcome, but must come with context on what was improved and why.
- New commands or modules — Accepted on a case-by-case basis. Check the existing issues and to-do list before building something from scratch, as it may already be planned.
- Dependency updates — Only if there is a clear reason such as a security patch. Do not update packages speculatively.
- Documentation improvements — Always welcome as long as the writing style is consistent with what's already there.
