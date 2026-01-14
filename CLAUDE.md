# CLAUDE.md

This file provides guidance for AI assistants working with this codebase.

## Project Overview

Folk CRM MCP is a Model Context Protocol server that wraps the Folk CRM REST API, enabling Claude Code and other MCP clients to manage contacts, companies, groups, and other CRM data.

## Architecture

**Single-file design**: All code lives in `src/index.ts`. This is intentional - it simplifies bundling, distribution, and maintenance. Do not split into multiple files without explicit discussion.

**Key patterns**:
- Tools are conditionally registered via `isToolFiltered()` for environment-based filtering
- All API calls go through `folkApi()` helper which handles auth and errors
- Zod schemas validate all tool parameters
- Responses follow MCP format: `{ isError: boolean, content: Array<{ type: "text", text: string }> }`

## Build & Development

```bash
# Install dependencies
npm install

# Build (compiles TypeScript and makes executable)
npm run build

# Run the server
npm start

# Development with MCP Inspector
FOLK_API_KEY=your_key npm run dev

# Watch mode for development
npm run watch
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FOLK_API_KEY` | Yes | Bearer token from Folk workspace settings |
| `FOLK_BASE_URL` | No | Override API base URL (default: https://api.folk.app/v1) |
| `FOLK_CRM_MCP_FILTERED_TOOLS` | No | Comma-separated tool names to exclude |

## Available Tools (37 total)

### People
- `list_people`, `get_person`, `create_person`, `update_person`, `delete_person`

### Companies
- `list_companies`, `get_company`, `create_company`, `update_company`, `delete_company`

### Groups
- `list_groups`, `list_group_custom_fields`

### Notes
- `list_notes`, `get_note`, `create_note`, `update_note`, `delete_note`

### Reminders
- `list_reminders`, `get_reminder`, `create_reminder`, `update_reminder`, `delete_reminder`

### Users
- `list_users`, `get_current_user`, `get_user`

### Interactions
- `create_interaction`

### Webhooks
- `list_webhooks`, `get_webhook`, `create_webhook`, `update_webhook`, `delete_webhook`

### Deals/Custom Objects
- `list_deals`, `get_deal`, `create_deal`, `update_deal`, `delete_deal`

## Security Considerations

1. **API Key**: Never log or expose `FOLK_API_KEY`. It's read from environment only.
2. **Error Messages**: Folk API errors are passed through but API key is never included.
3. **Input Validation**: All inputs validated via Zod before API calls.
4. **Rate Limits**: Folk has rate limits. 429 errors are handled with clear messages.

## Testing

Use MCP Inspector for manual testing:
```bash
FOLK_API_KEY=your_key npm run dev
```

Safe read-only tools to test first:
- `list_groups` - Lists groups without modifications
- `get_current_user` - Gets authenticated user info

## What NOT to do

- Do not split index.ts into multiple files without discussion
- Do not add new dependencies without justification
- Do not hard-code API keys or credentials
- Do not remove the tool filtering mechanism
- Do not change the MCP response format
