#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuration
const FOLK_API_KEY = process.env.FOLK_API_KEY;
const FOLK_BASE_URL = process.env.FOLK_BASE_URL || "https://api.folk.app/v1";
const FILTERED_TOOLS =
  process.env.FOLK_CRM_MCP_FILTERED_TOOLS?.split(",").map((t) => t.trim()) ||
  [];

if (!FOLK_API_KEY) {
  console.error(
    "Error: FOLK_API_KEY environment variable is required.\n" +
      "Get your API key from your Folk workspace settings.\n" +
      "Set it with: export FOLK_API_KEY=your_key_here"
  );
  process.exit(1);
}

// Helper to check if a tool is filtered
function isToolFiltered(toolName: string): boolean {
  return FILTERED_TOOLS.includes(toolName);
}

// Helper to convert unknown errors to Error objects
function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

// Folk API client
async function folkApi<T = unknown>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const url = `${FOLK_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${FOLK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      throw new Error(
        `Rate limit exceeded. Please wait before making more requests. Details: ${errorText}`
      );
    }
    if (response.status === 401) {
      throw new Error(
        "Authentication failed. Please check your FOLK_API_KEY is valid."
      );
    }
    throw new Error(`Folk API error (${response.status}): ${errorText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// Build query string from params
function buildQuery(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

// Initialize MCP server
const server = new McpServer({
  name: "folk-crm",
  version: "0.1.0",
});

// ============================================================================
// PEOPLE TOOLS
// ============================================================================

if (!isToolFiltered("list_people")) {
  server.tool(
    "list_people",
    "List people in your Folk CRM workspace with optional search and pagination",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results (1-100, default 50)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
      search: z.string().optional().describe("Search query to filter people"),
    },
    { title: "List People", readOnlyHint: true, openWorldHint: true },
    async ({ limit, cursor, search }) => {
      try {
        const query = buildQuery({ limit, cursor, search });
        const data = await folkApi("GET", `/people${query}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("get_person")) {
  server.tool(
    "get_person",
    "Get a person by their ID from Folk CRM",
    {
      personId: z.string().describe("The ID of the person to retrieve"),
    },
    { title: "Get Person", readOnlyHint: true, openWorldHint: true },
    async ({ personId }) => {
      try {
        const data = await folkApi("GET", `/people/${personId}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("create_person")) {
  server.tool(
    "create_person",
    "Create a new person in Folk CRM",
    {
      firstName: z.string().describe("First name of the person"),
      lastName: z.string().describe("Last name of the person"),
      emails: z
        .array(z.string().email())
        .describe("Array of email addresses"),
      groups: z
        .array(z.string())
        .optional()
        .describe("Array of group IDs to add the person to"),
      phones: z
        .array(z.string())
        .optional()
        .describe("Array of phone numbers"),
      jobTitle: z.string().optional().describe("Job title of the person"),
      companyId: z
        .string()
        .optional()
        .describe("ID of the company this person works at"),
    },
    { title: "Create Person", readOnlyHint: false, openWorldHint: true },
    async ({ firstName, lastName, emails, groups, phones, jobTitle, companyId }) => {
      try {
        const body: Record<string, unknown> = {
          firstName,
          lastName,
          emails,
        };
        if (groups) body.groups = groups.map((id) => ({ id }));
        if (phones) body.phones = phones;
        if (jobTitle) body.jobTitle = jobTitle;
        if (companyId) body.companyId = companyId;

        const data = await folkApi("POST", "/people", body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("update_person")) {
  server.tool(
    "update_person",
    "Update an existing person in Folk CRM",
    {
      personId: z.string().describe("The ID of the person to update"),
      firstName: z.string().optional().describe("First name of the person"),
      lastName: z.string().optional().describe("Last name of the person"),
      emails: z
        .array(z.string().email())
        .optional()
        .describe("Array of email addresses"),
      groups: z
        .array(z.string())
        .optional()
        .describe("Array of group IDs"),
      phones: z
        .array(z.string())
        .optional()
        .describe("Array of phone numbers"),
      jobTitle: z.string().optional().describe("Job title of the person"),
      companyId: z
        .string()
        .optional()
        .describe("ID of the company this person works at"),
    },
    { title: "Update Person", readOnlyHint: false, openWorldHint: true },
    async ({ personId, firstName, lastName, emails, groups, phones, jobTitle, companyId }) => {
      try {
        const body: Record<string, unknown> = {};
        if (firstName !== undefined) body.firstName = firstName;
        if (lastName !== undefined) body.lastName = lastName;
        if (emails !== undefined) body.emails = emails;
        if (groups !== undefined) body.groups = groups.map((id) => ({ id }));
        if (phones !== undefined) body.phones = phones;
        if (jobTitle !== undefined) body.jobTitle = jobTitle;
        if (companyId !== undefined) body.companyId = companyId;

        const data = await folkApi("PATCH", `/people/${personId}`, body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("delete_person")) {
  server.tool(
    "delete_person",
    "Delete a person from Folk CRM",
    {
      personId: z.string().describe("The ID of the person to delete"),
    },
    { title: "Delete Person", readOnlyHint: false, openWorldHint: true },
    async ({ personId }) => {
      try {
        await folkApi("DELETE", `/people/${personId}`);
        return {
          isError: false,
          content: [{ type: "text", text: `Person ${personId} deleted successfully.` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

// ============================================================================
// COMPANY TOOLS
// ============================================================================

if (!isToolFiltered("list_companies")) {
  server.tool(
    "list_companies",
    "List companies in your Folk CRM workspace with optional pagination",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results (1-100, default 50)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
    },
    { title: "List Companies", readOnlyHint: true, openWorldHint: true },
    async ({ limit, cursor }) => {
      try {
        const query = buildQuery({ limit, cursor });
        const data = await folkApi("GET", `/companies${query}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("get_company")) {
  server.tool(
    "get_company",
    "Get a company by its ID from Folk CRM",
    {
      companyId: z.string().describe("The ID of the company to retrieve"),
    },
    { title: "Get Company", readOnlyHint: true, openWorldHint: true },
    async ({ companyId }) => {
      try {
        const data = await folkApi("GET", `/companies/${companyId}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("create_company")) {
  server.tool(
    "create_company",
    "Create a new company in Folk CRM",
    {
      name: z.string().describe("Name of the company"),
      domain: z.string().optional().describe("Website domain of the company"),
      groups: z
        .array(z.string())
        .optional()
        .describe("Array of group IDs to add the company to"),
    },
    { title: "Create Company", readOnlyHint: false, openWorldHint: true },
    async ({ name, domain, groups }) => {
      try {
        const body: Record<string, unknown> = { name };
        if (domain) body.domain = domain;
        if (groups) body.groups = groups.map((id) => ({ id }));

        const data = await folkApi("POST", "/companies", body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("update_company")) {
  server.tool(
    "update_company",
    "Update an existing company in Folk CRM",
    {
      companyId: z.string().describe("The ID of the company to update"),
      name: z.string().optional().describe("Name of the company"),
      domain: z.string().optional().describe("Website domain of the company"),
      groups: z
        .array(z.string())
        .optional()
        .describe("Array of group IDs"),
    },
    { title: "Update Company", readOnlyHint: false, openWorldHint: true },
    async ({ companyId, name, domain, groups }) => {
      try {
        const body: Record<string, unknown> = {};
        if (name !== undefined) body.name = name;
        if (domain !== undefined) body.domain = domain;
        if (groups !== undefined) body.groups = groups.map((id) => ({ id }));

        const data = await folkApi("PATCH", `/companies/${companyId}`, body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("delete_company")) {
  server.tool(
    "delete_company",
    "Delete a company from Folk CRM",
    {
      companyId: z.string().describe("The ID of the company to delete"),
    },
    { title: "Delete Company", readOnlyHint: false, openWorldHint: true },
    async ({ companyId }) => {
      try {
        await folkApi("DELETE", `/companies/${companyId}`);
        return {
          isError: false,
          content: [{ type: "text", text: `Company ${companyId} deleted successfully.` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

// ============================================================================
// GROUP TOOLS
// ============================================================================

if (!isToolFiltered("list_groups")) {
  server.tool(
    "list_groups",
    "List all groups in your Folk CRM workspace",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results (1-100, default 50)"),
    },
    { title: "List Groups", readOnlyHint: true, openWorldHint: true },
    async ({ limit }) => {
      try {
        const query = buildQuery({ limit });
        const data = await folkApi("GET", `/groups${query}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("list_group_custom_fields")) {
  server.tool(
    "list_group_custom_fields",
    "List custom fields for a specific group and entity type",
    {
      groupId: z.string().describe("The ID of the group"),
      entityType: z
        .enum(["person", "company"])
        .describe("The entity type (person or company)"),
    },
    { title: "List Group Custom Fields", readOnlyHint: true, openWorldHint: true },
    async ({ groupId, entityType }) => {
      try {
        const data = await folkApi(
          "GET",
          `/groups/${groupId}/custom-fields/${entityType}`
        );
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

// ============================================================================
// NOTE TOOLS
// ============================================================================

if (!isToolFiltered("list_notes")) {
  server.tool(
    "list_notes",
    "List notes in Folk CRM with optional filtering",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results (1-100, default 50)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
      personId: z.string().optional().describe("Filter by person ID"),
      companyId: z.string().optional().describe("Filter by company ID"),
    },
    { title: "List Notes", readOnlyHint: true, openWorldHint: true },
    async ({ limit, cursor, personId, companyId }) => {
      try {
        const query = buildQuery({ limit, cursor, personId, companyId });
        const data = await folkApi("GET", `/notes${query}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("get_note")) {
  server.tool(
    "get_note",
    "Get a note by its ID from Folk CRM",
    {
      noteId: z.string().describe("The ID of the note to retrieve"),
    },
    { title: "Get Note", readOnlyHint: true, openWorldHint: true },
    async ({ noteId }) => {
      try {
        const data = await folkApi("GET", `/notes/${noteId}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("create_note")) {
  server.tool(
    "create_note",
    "Create a new note attached to a person or company",
    {
      content: z.string().describe("The content of the note"),
      personId: z.string().optional().describe("ID of the person to attach the note to"),
      companyId: z.string().optional().describe("ID of the company to attach the note to"),
    },
    { title: "Create Note", readOnlyHint: false, openWorldHint: true },
    async ({ content, personId, companyId }) => {
      try {
        if (!personId && !companyId) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Either personId or companyId must be provided",
              },
            ],
          };
        }

        const body: Record<string, unknown> = { content };
        if (personId) body.personId = personId;
        if (companyId) body.companyId = companyId;

        const data = await folkApi("POST", "/notes", body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("update_note")) {
  server.tool(
    "update_note",
    "Update an existing note in Folk CRM",
    {
      noteId: z.string().describe("The ID of the note to update"),
      content: z.string().describe("The new content of the note"),
    },
    { title: "Update Note", readOnlyHint: false, openWorldHint: true },
    async ({ noteId, content }) => {
      try {
        const data = await folkApi("PATCH", `/notes/${noteId}`, { content });
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("delete_note")) {
  server.tool(
    "delete_note",
    "Delete a note from Folk CRM",
    {
      noteId: z.string().describe("The ID of the note to delete"),
    },
    { title: "Delete Note", readOnlyHint: false, openWorldHint: true },
    async ({ noteId }) => {
      try {
        await folkApi("DELETE", `/notes/${noteId}`);
        return {
          isError: false,
          content: [{ type: "text", text: `Note ${noteId} deleted successfully.` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

// ============================================================================
// REMINDER TOOLS
// ============================================================================

if (!isToolFiltered("list_reminders")) {
  server.tool(
    "list_reminders",
    "List reminders in Folk CRM with optional filtering",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results (1-100, default 50)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
      personId: z.string().optional().describe("Filter by person ID"),
      companyId: z.string().optional().describe("Filter by company ID"),
    },
    { title: "List Reminders", readOnlyHint: true, openWorldHint: true },
    async ({ limit, cursor, personId, companyId }) => {
      try {
        const query = buildQuery({ limit, cursor, personId, companyId });
        const data = await folkApi("GET", `/reminders${query}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("get_reminder")) {
  server.tool(
    "get_reminder",
    "Get a reminder by its ID from Folk CRM",
    {
      reminderId: z.string().describe("The ID of the reminder to retrieve"),
    },
    { title: "Get Reminder", readOnlyHint: true, openWorldHint: true },
    async ({ reminderId }) => {
      try {
        const data = await folkApi("GET", `/reminders/${reminderId}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("create_reminder")) {
  server.tool(
    "create_reminder",
    "Create a new reminder attached to a person or company",
    {
      title: z.string().describe("The title of the reminder"),
      dueDate: z
        .string()
        .describe("Due date in ISO 8601 format (e.g., 2024-01-15T10:00:00Z)"),
      personId: z
        .string()
        .optional()
        .describe("ID of the person to attach the reminder to"),
      companyId: z
        .string()
        .optional()
        .describe("ID of the company to attach the reminder to"),
      description: z.string().optional().describe("Additional description"),
    },
    { title: "Create Reminder", readOnlyHint: false, openWorldHint: true },
    async ({ title, dueDate, personId, companyId, description }) => {
      try {
        if (!personId && !companyId) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Either personId or companyId must be provided",
              },
            ],
          };
        }

        const body: Record<string, unknown> = { title, dueDate };
        if (personId) body.personId = personId;
        if (companyId) body.companyId = companyId;
        if (description) body.description = description;

        const data = await folkApi("POST", "/reminders", body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("update_reminder")) {
  server.tool(
    "update_reminder",
    "Update an existing reminder in Folk CRM",
    {
      reminderId: z.string().describe("The ID of the reminder to update"),
      title: z.string().optional().describe("The title of the reminder"),
      dueDate: z
        .string()
        .optional()
        .describe("Due date in ISO 8601 format"),
      description: z.string().optional().describe("Additional description"),
      completed: z.boolean().optional().describe("Mark reminder as completed"),
    },
    { title: "Update Reminder", readOnlyHint: false, openWorldHint: true },
    async ({ reminderId, title, dueDate, description, completed }) => {
      try {
        const body: Record<string, unknown> = {};
        if (title !== undefined) body.title = title;
        if (dueDate !== undefined) body.dueDate = dueDate;
        if (description !== undefined) body.description = description;
        if (completed !== undefined) body.completed = completed;

        const data = await folkApi("PATCH", `/reminders/${reminderId}`, body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("delete_reminder")) {
  server.tool(
    "delete_reminder",
    "Delete a reminder from Folk CRM",
    {
      reminderId: z.string().describe("The ID of the reminder to delete"),
    },
    { title: "Delete Reminder", readOnlyHint: false, openWorldHint: true },
    async ({ reminderId }) => {
      try {
        await folkApi("DELETE", `/reminders/${reminderId}`);
        return {
          isError: false,
          content: [
            { type: "text", text: `Reminder ${reminderId} deleted successfully.` },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

// ============================================================================
// USER TOOLS
// ============================================================================

if (!isToolFiltered("list_users")) {
  server.tool(
    "list_users",
    "List all users in your Folk CRM workspace",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results (1-100, default 50)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
    },
    { title: "List Users", readOnlyHint: true, openWorldHint: true },
    async ({ limit, cursor }) => {
      try {
        const query = buildQuery({ limit, cursor });
        const data = await folkApi("GET", `/users${query}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("get_current_user")) {
  server.tool(
    "get_current_user",
    "Get the currently authenticated user",
    {},
    { title: "Get Current User", readOnlyHint: true, openWorldHint: true },
    async () => {
      try {
        const data = await folkApi("GET", "/users/me");
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("get_user")) {
  server.tool(
    "get_user",
    "Get a user by their ID from Folk CRM",
    {
      userId: z.string().describe("The ID of the user to retrieve"),
    },
    { title: "Get User", readOnlyHint: true, openWorldHint: true },
    async ({ userId }) => {
      try {
        const data = await folkApi("GET", `/users/${userId}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

// ============================================================================
// INTERACTION TOOLS
// ============================================================================

if (!isToolFiltered("create_interaction")) {
  server.tool(
    "create_interaction",
    "Log an interaction with a person or company in Folk CRM",
    {
      type: z
        .enum(["call", "email", "meeting", "note", "other"])
        .describe("Type of interaction"),
      personId: z
        .string()
        .optional()
        .describe("ID of the person the interaction was with"),
      companyId: z
        .string()
        .optional()
        .describe("ID of the company the interaction was with"),
      date: z
        .string()
        .optional()
        .describe("Date of interaction in ISO 8601 format (defaults to now)"),
      notes: z.string().optional().describe("Notes about the interaction"),
    },
    { title: "Create Interaction", readOnlyHint: false, openWorldHint: true },
    async ({ type, personId, companyId, date, notes }) => {
      try {
        if (!personId && !companyId) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Either personId or companyId must be provided",
              },
            ],
          };
        }

        const body: Record<string, unknown> = { type };
        if (personId) body.personId = personId;
        if (companyId) body.companyId = companyId;
        if (date) body.date = date;
        if (notes) body.notes = notes;

        const data = await folkApi("POST", "/interactions", body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

// ============================================================================
// WEBHOOK TOOLS
// ============================================================================

if (!isToolFiltered("list_webhooks")) {
  server.tool(
    "list_webhooks",
    "List all webhooks in your Folk CRM workspace",
    {
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results (1-100, default 50)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
    },
    { title: "List Webhooks", readOnlyHint: true, openWorldHint: true },
    async ({ limit, cursor }) => {
      try {
        const query = buildQuery({ limit, cursor });
        const data = await folkApi("GET", `/webhooks${query}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("get_webhook")) {
  server.tool(
    "get_webhook",
    "Get a webhook by its ID from Folk CRM",
    {
      webhookId: z.string().describe("The ID of the webhook to retrieve"),
    },
    { title: "Get Webhook", readOnlyHint: true, openWorldHint: true },
    async ({ webhookId }) => {
      try {
        const data = await folkApi("GET", `/webhooks/${webhookId}`);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("create_webhook")) {
  server.tool(
    "create_webhook",
    "Create a new webhook subscription in Folk CRM",
    {
      url: z.string().url().describe("The URL to send webhook events to"),
      events: z
        .array(z.string())
        .describe("Array of event types to subscribe to (e.g., person.created, company.updated)"),
      secret: z
        .string()
        .optional()
        .describe("Secret for webhook signature verification"),
    },
    { title: "Create Webhook", readOnlyHint: false, openWorldHint: true },
    async ({ url, events, secret }) => {
      try {
        const body: Record<string, unknown> = { url, events };
        if (secret) body.secret = secret;

        const data = await folkApi("POST", "/webhooks", body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("update_webhook")) {
  server.tool(
    "update_webhook",
    "Update an existing webhook in Folk CRM",
    {
      webhookId: z.string().describe("The ID of the webhook to update"),
      url: z.string().url().optional().describe("The URL to send webhook events to"),
      events: z
        .array(z.string())
        .optional()
        .describe("Array of event types to subscribe to"),
      enabled: z.boolean().optional().describe("Enable or disable the webhook"),
    },
    { title: "Update Webhook", readOnlyHint: false, openWorldHint: true },
    async ({ webhookId, url, events, enabled }) => {
      try {
        const body: Record<string, unknown> = {};
        if (url !== undefined) body.url = url;
        if (events !== undefined) body.events = events;
        if (enabled !== undefined) body.enabled = enabled;

        const data = await folkApi("PATCH", `/webhooks/${webhookId}`, body);
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("delete_webhook")) {
  server.tool(
    "delete_webhook",
    "Delete a webhook from Folk CRM",
    {
      webhookId: z.string().describe("The ID of the webhook to delete"),
    },
    { title: "Delete Webhook", readOnlyHint: false, openWorldHint: true },
    async ({ webhookId }) => {
      try {
        await folkApi("DELETE", `/webhooks/${webhookId}`);
        return {
          isError: false,
          content: [
            { type: "text", text: `Webhook ${webhookId} deleted successfully.` },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

// ============================================================================
// DEAL/CUSTOM OBJECT TOOLS
// ============================================================================

if (!isToolFiltered("list_deals")) {
  server.tool(
    "list_deals",
    "List deals (or custom objects) in a specific group",
    {
      groupId: z.string().describe("The ID of the group"),
      objectType: z
        .string()
        .default("deal")
        .describe("The type of object (default: deal)"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results (1-100, default 50)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from previous response"),
    },
    { title: "List Deals", readOnlyHint: true, openWorldHint: true },
    async ({ groupId, objectType, limit, cursor }) => {
      try {
        const query = buildQuery({ limit, cursor });
        const data = await folkApi(
          "GET",
          `/groups/${groupId}/${objectType}${query}`
        );
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("get_deal")) {
  server.tool(
    "get_deal",
    "Get a specific deal (or custom object) by ID",
    {
      groupId: z.string().describe("The ID of the group"),
      objectType: z
        .string()
        .default("deal")
        .describe("The type of object (default: deal)"),
      objectId: z.string().describe("The ID of the deal/object"),
    },
    { title: "Get Deal", readOnlyHint: true, openWorldHint: true },
    async ({ groupId, objectType, objectId }) => {
      try {
        const data = await folkApi(
          "GET",
          `/groups/${groupId}/${objectType}/${objectId}`
        );
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("create_deal")) {
  server.tool(
    "create_deal",
    "Create a new deal (or custom object) in a group",
    {
      groupId: z.string().describe("The ID of the group"),
      objectType: z
        .string()
        .default("deal")
        .describe("The type of object (default: deal)"),
      name: z.string().describe("Name of the deal"),
      value: z.number().optional().describe("Monetary value of the deal"),
      personId: z.string().optional().describe("ID of the associated person"),
      companyId: z.string().optional().describe("ID of the associated company"),
      customFields: z
        .record(z.unknown())
        .optional()
        .describe("Custom field values as key-value pairs"),
    },
    { title: "Create Deal", readOnlyHint: false, openWorldHint: true },
    async ({ groupId, objectType, name, value, personId, companyId, customFields }) => {
      try {
        const body: Record<string, unknown> = { name };
        if (value !== undefined) body.value = value;
        if (personId) body.personId = personId;
        if (companyId) body.companyId = companyId;
        if (customFields) body.customFields = customFields;

        const data = await folkApi(
          "POST",
          `/groups/${groupId}/${objectType}`,
          body
        );
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("update_deal")) {
  server.tool(
    "update_deal",
    "Update an existing deal (or custom object)",
    {
      groupId: z.string().describe("The ID of the group"),
      objectType: z
        .string()
        .default("deal")
        .describe("The type of object (default: deal)"),
      objectId: z.string().describe("The ID of the deal/object to update"),
      name: z.string().optional().describe("Name of the deal"),
      value: z.number().optional().describe("Monetary value of the deal"),
      personId: z.string().optional().describe("ID of the associated person"),
      companyId: z.string().optional().describe("ID of the associated company"),
      customFields: z
        .record(z.unknown())
        .optional()
        .describe("Custom field values as key-value pairs"),
    },
    { title: "Update Deal", readOnlyHint: false, openWorldHint: true },
    async ({ groupId, objectType, objectId, name, value, personId, companyId, customFields }) => {
      try {
        const body: Record<string, unknown> = {};
        if (name !== undefined) body.name = name;
        if (value !== undefined) body.value = value;
        if (personId !== undefined) body.personId = personId;
        if (companyId !== undefined) body.companyId = companyId;
        if (customFields !== undefined) body.customFields = customFields;

        const data = await folkApi(
          "PATCH",
          `/groups/${groupId}/${objectType}/${objectId}`,
          body
        );
        return {
          isError: false,
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

if (!isToolFiltered("delete_deal")) {
  server.tool(
    "delete_deal",
    "Delete a deal (or custom object) from Folk CRM",
    {
      groupId: z.string().describe("The ID of the group"),
      objectType: z
        .string()
        .default("deal")
        .describe("The type of object (default: deal)"),
      objectId: z.string().describe("The ID of the deal/object to delete"),
    },
    { title: "Delete Deal", readOnlyHint: false, openWorldHint: true },
    async ({ groupId, objectType, objectId }) => {
      try {
        await folkApi("DELETE", `/groups/${groupId}/${objectType}/${objectId}`);
        return {
          isError: false,
          content: [
            {
              type: "text",
              text: `${objectType} ${objectId} deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: toError(error).message }],
        };
      }
    }
  );
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
