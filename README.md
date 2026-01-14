# Folk CRM MCP Server

An MCP (Model Context Protocol) server that enables Claude Code to interact with your Folk CRM workspace. Manage contacts, companies, groups, notes, reminders, and more directly from your AI assistant.

## Prerequisites

- **Folk Account**: You need a Folk CRM account with API access
- **API Key**: Generate an API key from your Folk workspace settings
- **Node.js**: Version 18 or higher
- **Claude Code**: Desktop or CLI with MCP support

## Installation

### Quick Start with npx

```bash
npx folk-crm-mcp
```

### Local Development

```bash
git clone https://github.com/joshuayoes/folk-crm-mcp.git
cd folk-crm-mcp
npm install
npm run build
```

## Configuration

Set your Folk API key as an environment variable:

```bash
export FOLK_API_KEY=your_api_key_here
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FOLK_API_KEY` | Yes | Your Folk CRM API key |
| `FOLK_BASE_URL` | No | Custom API base URL |
| `FOLK_CRM_MCP_FILTERED_TOOLS` | No | Comma-separated list of tools to disable |

## Registering with Claude Code

```bash
claude mcp add \
  --transport stdio \
  -e FOLK_API_KEY=your_api_key \
  folk-crm \
  -- npx folk-crm-mcp
```

Or for local development:

```bash
claude mcp add \
  --transport stdio \
  -e FOLK_API_KEY=your_api_key \
  folk-crm \
  -- node /path/to/folk-crm-mcp/build/index.js
```

## Available Tools

### People Management
| Tool | Description |
|------|-------------|
| `list_people` | List people with search and pagination |
| `get_person` | Get a person by ID |
| `create_person` | Create a new person |
| `update_person` | Update an existing person |
| `delete_person` | Delete a person |

### Company Management
| Tool | Description |
|------|-------------|
| `list_companies` | List companies with pagination |
| `get_company` | Get a company by ID |
| `create_company` | Create a new company |
| `update_company` | Update an existing company |
| `delete_company` | Delete a company |

### Groups
| Tool | Description |
|------|-------------|
| `list_groups` | List all groups in your workspace |
| `list_group_custom_fields` | Get custom fields for a group |

### Notes
| Tool | Description |
|------|-------------|
| `list_notes` | List notes with filtering |
| `get_note` | Get a note by ID |
| `create_note` | Create a note on a person or company |
| `update_note` | Update an existing note |
| `delete_note` | Delete a note |

### Reminders
| Tool | Description |
|------|-------------|
| `list_reminders` | List reminders with filtering |
| `get_reminder` | Get a reminder by ID |
| `create_reminder` | Create a reminder |
| `update_reminder` | Update a reminder |
| `delete_reminder` | Delete a reminder |

### Users
| Tool | Description |
|------|-------------|
| `list_users` | List workspace users |
| `get_current_user` | Get the authenticated user |
| `get_user` | Get a user by ID |

### Interactions
| Tool | Description |
|------|-------------|
| `create_interaction` | Log an interaction with a contact |

### Webhooks
| Tool | Description |
|------|-------------|
| `list_webhooks` | List all webhooks |
| `get_webhook` | Get a webhook by ID |
| `create_webhook` | Create a webhook subscription |
| `update_webhook` | Update a webhook |
| `delete_webhook` | Delete a webhook |

### Deals/Custom Objects
| Tool | Description |
|------|-------------|
| `list_deals` | List deals in a group |
| `get_deal` | Get a deal by ID |
| `create_deal` | Create a deal |
| `update_deal` | Update a deal |
| `delete_deal` | Delete a deal |

## Example Usage

Once registered with Claude Code, you can use natural language:

```
"List all my contacts in Folk"
"Create a new person named John Doe with email john@example.com"
"Add a note to the contact with ID xyz saying 'Follow up next week'"
"Show me all my groups"
"Create a reminder to call John Doe on Friday"
```

## Development

```bash
# Build the project
npm run build

# Run with MCP Inspector for testing
FOLK_API_KEY=your_key npm run dev

# Watch mode for development
npm run watch
```

## Filtering Tools

To disable specific tools, set the `FOLK_CRM_MCP_FILTERED_TOOLS` environment variable:

```bash
export FOLK_CRM_MCP_FILTERED_TOOLS=delete_person,delete_company,delete_note
```

## License

MIT
