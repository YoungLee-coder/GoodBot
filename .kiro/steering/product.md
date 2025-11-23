# Product Overview

GoodBot is a Telegram bot management system with a web-based admin interface. It enables bidirectional communication between bot administrators and Telegram users through a modern dashboard.

## Core Features

- **Message Forwarding**: User messages are forwarded to admin; admin can reply by responding to forwarded messages
- **User Management**: Track and manage users interacting with the bot
- **Group Management**: Monitor and manage Telegram groups where the bot is active
- **Setup Wizard**: First-run initialization flow for bot token and admin password configuration
- **Database-Driven Config**: Bot token and settings stored in PostgreSQL, reducing environment variable dependencies

## User Flow

1. Admin completes initial setup via `/setup` page (bot token + admin password)
2. Admin authenticates with bot using `/login <password>` command in Telegram
3. Users send messages to bot → forwarded to admin's Telegram chat
4. Admin replies to forwarded messages → sent back to original user
5. Admin monitors activity through web dashboard

## Language

Primary language is Chinese (Simplified). UI text, comments, and documentation use Chinese.
