# Nirmini Nova: Development Branch
### (C) Nirmini Development & Respective Authors
---
Nirmini Nova is a multi-purpose Discord bot and moderation system made to make it easy for groups and communities to manage their users, all in one place. 

Nova is made to handle tickets, modmail, Trello notifications, moderation, and more for servers to use without needing to add more bots and cluttering their server.

## About Nova

Nova was originally created in June of 2024 and was originally made to just be a games and social bot with a few moderation commands on the side for fun. During this time a large chunk of Nova's code was completely AI-Generated.

Ever since we've been slowly expanding and adding new features with the release of Nova V2 we overhauled the application architecture into a more sustainable format. And reducing the amount of AI code to zero.

Nirmini's goal with Nova is to be able to create a bot that's easy to setup and use as both a local/self-hosted bot and as a hosted bot.

## Features

Nova covers a wide range of functionality so servers don't need to pile on extra bots.

- **Moderation** — Ban, kick, mute, warn, lock channels, and manage cases all from one place.
- **Tickets & Modmail** — A full ticket system with panels and per-server configuration.
- **Modules** — Optional feature modules that can be enabled or disabled per server in operator settings.
- **User Management** — Role management, nickname overrides, and user data tracking.
- **Status & Monitoring** — Live shard status monitoring with Statuspage integration.
- **Roblox Integration** — Roblox-linked utilities via noblox.js.
- **Fun & Social** — Birthday reminders, coin flips, and other quality-of-life social commands.
- **Admin Tools** — Server info, guild configuration, premium management, and operator controls.

## Tech Stack

Nova is built on Node.js and makes use of several key libraries and services.

- **[Discord.js](https://discord.js.org/)** v14 — Primary Discord library used for all bot operations.
- **[Express](https://expressjs.com/)** — Powers the internal local API that handles cross-shard communication and external integrations.
- **[Cloudflare Workers KV](https://cloudflare.com/)** — Used for persistent guild and user data storage.
- **[Sentry](https://sentry.io/)** — Error tracking and performance monitoring in production.
- **[Axios](https://axios-http.com/)** — HTTP client used for API requests to external services.
- **[node-cron](https://github.com/node-cron/node-cron)** — Scheduled tasks such as birthday reminders and maintenance jobs.
- **Node.js v22+** — Required runtime. Older versions are not supported.

## Project Structure

Here's a high-level overview of how the repository is organized.

- `mainapp/` — Application entry point, shard manager, command publisher, and core startup logic.
- `commands/` — Slash commands organized by category (`admin`, `core`, `fun`, `moderation`, `roblox`, etc.).
- `ctxtmenu/` — Context menu commands.
- `modules/` — Optional feature modules loaded at runtime based on server settings.
- `services/` — Background services and scheduled tasks.
- `NovaAPI/` — The internal/local API server that Nova uses for cross-shard and dashboard communication.
- `core/` — Shared utilities, helpers, and the database abstraction layer.
- `DevDash2/` — The development dashboard frontend built with React.

## Future Changes

For organizational reasons Nova's planned features are stored in three total places.

- The first is the area where most concepts are, this is within the Nirmini Structural Engineering Team(NSET)'s Discord server in the "Nova" category.

- The second place where future changes are placed is on [GitHub issues](https://github.com/Nirmini/NovaBot-Dev/issues). Every bug is assigned an issue and so are most tasks/planned features. This is slowly being migrated to be the primary platform internally for planning.

- The third place is within [Nova's Trello board](https://trello.com/b/XawAdPV7/novabot-development) which currently serves as the official repository of what is being added to Nova and sometimes, when we're adding it to the app. This is slowly being replaced by GitHub.

## Websites

Nova's website is split into two distinct sections. 

Section one is https://nirmini.dev/Nova which serves as the main entrypoint as well as the centralized location for all of Nova's authentication-related operations.

Section two is https://nova.nirmini.dev which is one of the websites that is made using React.js which is used for the dashboard management system using the React Router.

## Moderation

Nirmini does not moderate any users for servers. The only moderation that we will ever take is the following steps under specific circumstances.

- If a technical error or misconfiguration occured we will try to reach out to you and likely have Nova leave the server. We try to do this as little as possible but sometimes when we change the data format we have to do this because we don't have enough information about a server to recreate its configuration data.

- If a user is spamming the bot in a way we can tell is intentional then we will blacklist that user from interacting with the bot and they will be unable to interact with the bot with an active ban. If a user wishes to appeal a ban then they must contact a member of Nova's development staff or Nirmini's Founder and explain their situation. "It was my brother" is not a valid excuse, it is your account and your responsability to keep it safe.

- If a guild is comprised of a large number of users who are spamming the bot in a way we can tell is intentional then we may also blacklist that server from interacting with the bot. We will not blacklist/moderate a guild unless at least 85% of the members of that server are spamming Nova intentionally for a prolonged period of time. Guilds that are blacklisted may appeal the moderation using the same method as listed above.

## Guides

Nova's guides for various things can be found as other Markdown(`.md`) files.
> [Setup](https://github.com/Nirmini/NovaBot-Dev/blob/master/SETUP.md) | [Contributing](https://github.com/Nirmini/NovaBot-Dev/blob/master/CONTRIBUTING.md) | [Code Of Conduct](https://github.com/Nirmini/NovaBot-Dev/blob/master/CODE_OF_CONDUCT.md) | [Security](https://github.com/Nirmini/NovaBot-Dev/blob/master/SECURITY.md)

## Notices

Please be aware that this is a development branch so there is a potential for broken changes to exist on this branch of Nova at any given time. If you need to test new features this is the place to do just that. If you need to test stability, use the production/public branch of Nova. Breaking changes may not be marked as such unless it is a severe change that is likely to require a large amount of reworking old code to work.

Nova is licensed under the Mozilla Public License Version 2.0. Please read the terms of the license for restrictions and other important information. Failure to abide by the license will result in action being taken including but not limited to DMCA takedown notices.

## Contact

As this is a development branch, if you need something just ping me or ask. Its not like I'm going to blow my lid because you asked a question or pointed out a bug. It's not my job to get angry if you point something out, my job is to correct it and ensure that end users don't experience it. You'll also likely be congratulated for the help if it's close to a release date.

---
#### Last Updated: March 7<sup>th</sup>, 2026.
