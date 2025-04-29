# Bika.ai MCP Server

A Model Context Protocol server that provides read and write access to Bika.ai. This server enables LLMs to list spaces, list nodes, list records, create records and upload attachments in Bika.ai.

## Tools

| Tool Name                 | Availabe | Description                                                                                                   |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| list_spaces               | ✅        | Fetches all workspaces that the currently authenticated user has permission to access.                        |
| list_nodes                | ✅        | Retrieves all nodes contained within the specified workspace.                                                 |
| get_records               | ✅        | Read the records from a specified database with support for pagination, field filtering, and sorting options. |
| get_fields_schema         | ✅        | Returns the JSON schema of all fields within the specified database                                           |
| create_record             | ✅        | Create a new record in the database.                                                                          |
| upload_attachment_via_url | ✅        | Upload an attachment to the Bika server using its web URL.                                                    |
| update_record             | ❌        | TODO                                                                                                          |

## Usage

You can use this server in MCP client such as [Claude Desktop](https://claude.ai/download), [CherryStudio](https://www.cherry-ai.com/), etc.

**Claude Desktop**
In the case of Claude Desktop, you need to add the following configuration information to the "mcpServers" section of the `claude_desktop_config.json` file:

```json
// Linux, MacOS
{
  "mcpServers": {
    "bika": {
      "command": "npx",
      "args": [
        "-y",
        "/ABSOLUTE/PATH/TO/PARENT/FOLDER/bika-mcp-server"
      ],
      "env": {
        "BIKA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

```json
// Windows
{
  "mcpServers": {
    "bika": {
      "command": "npx",
      "args": [
        "-y",
        "D:\\ABSOLUTE\\PATH\\TO\\PARENT\\FOLDER\\bika-mcp-server"
      ],
      "env": {
        "BIKA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Replace `YOUR_API_KEY` with your Bika personal access token and `/ABSOLUTE/PATH/TO/PARENT/FOLDER/bika-mcp-server` with the absolute path to the parent folder of this repository.

**CherryStudio**
If you are using the CherryStudio as MCP client and Windows system, your configuration should look like this:

```json
{
  "mcpServers": {
    "bika": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "D:\\ABSOLUTE\\PATH\\TO\\PARENT\\FOLDER\\bika-mcp-server"
      ],
      "env": {
        "BIKA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Debug

The [MCP inspector](https://github.com/modelcontextprotocol/inspector) is a developer tool for testing and debugging MCP servers.

To inspect an MCP server implementation, there's no need to clone the MCP inspector repo. Instead, use `npx`. For example, Bika MCP server is built at `build/index.js`. Arguments are passed directly to your server, while environment variables can be set using the `-e` flag:

```bash
npx @modelcontextprotocol/inspector -e BIKA_API_KEY={YOUR_API_KEY} node build/index.js
```

The other way is to clone the MCP inspector repo and connect the Bika MCP server in the inspector interface.

```bash
cd path/to/inspector/
npm start -- -e BIKA_API_KEY={YOUR_API_KEY}
```
