# CONTEXT.md

Reference links and documentation for developing this MCP server.

## Folk CRM

- **Developer Portal**: https://developer.folk.app
- **API Reference**: https://developer.folk.app/api-reference
- **Help Center**: https://help.folk.app
- **API Help Article**: https://help.folk.app/en/articles/11666479-folk-api

## Model Context Protocol (MCP)

- **MCP Specification**: https://modelcontextprotocol.io
- **MCP SDK (TypeScript)**: https://github.com/modelcontextprotocol/typescript-sdk
- **MCP Inspector**: https://github.com/modelcontextprotocol/inspector

## Claude Code

- **Claude Code Documentation**: https://docs.anthropic.com/en/docs/claude-code
- **Claude Code Skills**: https://github.com/anthropics/skills
- **MCP in Claude Code**: https://docs.anthropic.com/en/docs/claude-code/mcp

## Reference Implementation

- **ios-simulator-mcp**: ~/Code/ios-simulator-mcp
  - Reference MCP server showing patterns for tool definitions, error handling, and documentation structure
  - Key patterns: single-file architecture, Zod validation, conditional tool registration, CLAUDE.md guidance file

## Folk API Quick Reference

### Authentication
```
Authorization: Bearer <api_key>
```

### Base URL
```
https://api.folk.app/v1
```

### Pagination
All list endpoints support:
- `limit` - Number of results (max 100)
- `cursor` - Pagination cursor from previous response

### Rate Limits
Folk imposes rate limits. Handle 429 responses gracefully.

### Key Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /people | List people |
| POST | /people | Create person |
| GET | /people/{id} | Get person |
| PATCH | /people/{id} | Update person |
| DELETE | /people/{id} | Delete person |
| GET | /companies | List companies |
| POST | /companies | Create company |
| GET | /groups | List groups |
| GET | /users/me | Current user |
| POST | /notes | Create note |
| POST | /reminders | Create reminder |
| POST | /interactions | Log interaction |
