# Troubleshooting

Common issues and solutions for the Folk CRM MCP server.

## Authentication Errors

### "Authentication failed. Please check your FOLK_API_KEY is valid."

**Cause**: The API key is missing, expired, or invalid.

**Solution**:
1. Verify your API key is set: `echo $FOLK_API_KEY`
2. Generate a new key from Folk workspace settings if needed
3. Ensure no extra whitespace in the key
4. Check that the key has appropriate permissions

### "Error: FOLK_API_KEY environment variable is required."

**Cause**: The server started without the API key environment variable.

**Solution**:
```bash
# Set the environment variable
export FOLK_API_KEY=your_api_key_here

# Or pass it directly when running
FOLK_API_KEY=your_key npm start
```

## Rate Limiting

### "Rate limit exceeded. Please wait before making more requests."

**Cause**: Too many API requests in a short period.

**Solution**:
1. Wait a few seconds before retrying
2. Reduce the frequency of requests
3. Use pagination with smaller `limit` values
4. Cache responses when appropriate

## Connection Issues

### "Folk API error (502): ..." or "Folk API error (503): ..."

**Cause**: Folk's servers are temporarily unavailable.

**Solution**:
1. Wait a few minutes and retry
2. Check https://status.folk.app for service status

### Network/DNS errors

**Cause**: Network connectivity issues.

**Solution**:
1. Verify internet connection
2. Check if `https://api.folk.app` is accessible
3. Verify no firewall blocking the connection

## MCP Integration Issues

### Server not appearing in Claude Code

**Cause**: Server not properly registered or not running.

**Solution**:
1. Check registration: `claude mcp list`
2. Verify the command path is correct
3. Try re-registering:
```bash
claude mcp remove folk-crm
claude mcp add --transport stdio -e FOLK_API_KEY=your_key folk-crm -- npx folk-crm-mcp
```

### Tools not showing up

**Cause**: Server error during tool registration.

**Solution**:
1. Check server logs for errors
2. Verify FOLK_API_KEY is set
3. Test with MCP Inspector: `FOLK_API_KEY=your_key npm run dev`

## Build Issues

### TypeScript compilation errors

**Solution**:
```bash
# Clean and rebuild
rm -rf build node_modules
npm install
npm run build
```

### "Cannot find module" errors

**Solution**:
```bash
npm install
```

## Data Issues

### "Either personId or companyId must be provided"

**Cause**: Creating a note/reminder/interaction requires a target.

**Solution**: Provide either `personId` or `companyId` parameter.

### Empty responses from list operations

**Cause**: No data matches the query, or wrong workspace.

**Solution**:
1. Verify you're connected to the correct Folk workspace
2. Check if data exists in the Folk web interface
3. Try without search/filter parameters first

## Getting Help

1. Check the [Folk Help Center](https://help.folk.app)
2. Check the [MCP Documentation](https://modelcontextprotocol.io)
3. Open an issue on GitHub
