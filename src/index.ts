#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from "zod";
import { BikaService } from './bikaService.js';
import type {
  SpaceVO,
  ResponseVO,
  ToolSpaceVo,
  NodeVO,
  ToolNodeVo,
  FieldSchemaVO,
  GetRecordsResponeDataVO,
  FieldFormatJSONSchema,
  RecordV2VO,
  attachmentVO,
} from "./types.js";

// Create an MCP server
const server = new McpServer({
  name: "Bika MCP Server",
  version: "1.0.0"
});

if (!process.env.BIKA_API_KEY) {
  throw new Error("Please set the BIKA_API_KEY environment variable.");
}

const bikaService = new BikaService();

const formatToolResponse = (data: unknown, isError = false): CallToolResult => {
  return {
    content: [{
      type: 'text',
      mimeType: 'application/json',
      text: JSON.stringify(data),
    }],
    isError,
  };
};

server.tool("list_spaces",
  "Fetches all workspaces that the currently authenticated user has permission to access.",
  async () => {
    try {
      const result:ResponseVO<SpaceVO[]> = await bikaService.fetchFromAPI("/v1/spaces", {
        method: "GET",
      });

      if (!result.success) {
        console.error("Failed to fetch spaces:", result.message || "Unknown error");
        return formatToolResponse({
          success: false,
          message: result.message || "Failed to fetch spaces"
        }, true);
      }

      const spaces: ToolSpaceVo[] = result.data.map(space => ({
        space_id: space.id,
        space_name: space.name,
        create_by: space.createBy,
        created_at: space.createdAt,
        owner: space.owner
      }));
      
      return formatToolResponse({
        success: true,
        data: spaces
      });
    }
    catch (error) {
      console.error("Error in list_spaces:", error);
      return formatToolResponse({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }, true);
    }
  }
);

server.tool("list_nodes",
  "Retrieves all nodes contained within the specified workspace. Nodes in Bika can be of several types: databases (also known as sheets, datasheets, or spreadsheets), automations, documents, and folders.",
  { 
    space_id: z.string().describe('The ID of the workspace to fetch nodes from.'),
    node_type: z.string().optional().describe('Filter the node list to only include nodes of the specified type. Common types include: "DATABASE", "DOCUMENT", "AUTOMATION", "FOLDER", "MIRROR"')
  },
  async ({ space_id, node_type }) => {
    try {
      // Validate the space_id
      if (!space_id) {
        throw new Error("space_id is required");
      }
      
      const result: ResponseVO<NodeVO[]> = await bikaService.fetchFromAPI(`/v1/spaces/${space_id}/nodes`, {
        method: "GET",
      });

      if (!result.success) {
        console.error("Failed to fetch nodes:", result.message || "Unknown error");
        return formatToolResponse({
          success: false,
          message: result.message || "Failed to fetch nodes"
        }, true);
      }

      const nodes: ToolNodeVo[] = []
      
      result.data.forEach(node => {
        if (typeof node_type === "undefined" || node.type === node_type){
          nodes.push({
            node_id: node.id,
            name: node.name,
            description: node.description ?? '',
            node_type: node.type,
            parent_id: node.parentId,
            path: node.path
          })
        }  
      })
      
      return formatToolResponse({
        success: true,
        data: nodes
      });
    }
    catch (error) {
      console.error("Error in list_nodes:", error);
      return formatToolResponse({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }, true);
    }
  }
);

server.tool("get_records",
  "Read the records from a specified database with support for pagination, field filtering, and sorting options.",
  { 
    space_id: z.string().describe('The ID of the workspace to fetch records from. '),
    node_id: z.string().describe('The ID of the database to fetch records from.'),
    sort: z.array(z.object({
      field: z.string().describe("field name"),
      order: z.enum(["asc", "desc"]).describe("Sorting order, must be 'asc' or 'desc'"),
    })).optional().describe("Sort the returned records."),
    pageNum: z.string().default("1").optional().describe("Specifies the page number of the page, which is used in conjunction with the pageSize parameter."),
    pageSize: z.string().default("100").optional().describe("How many records are returned per page. The value range is an integer from 1 to 1000."),
    fields: z.string().optional().describe("The returned record results are limited to the specified fields. Multiple fields should be separated by commas without spaces (e.g. 'field1,field2,field3')."),
    viewId: z.string().optional().describe("When the viewId is explicitly specified, all records in the specified view will be returned in turn according to the sorting in the specified view.")
  },
  async ({ space_id, node_id, sort, pageNum, pageSize, fields, viewId }) => {
    try {
      // Validate the space_id
      if (!space_id || !node_id) {
        throw new Error("space_id and databaseId are required.");
      }
      
      const queryStr = bikaService.buildQueryString({sort, pageNum, pageSize, fields, viewId});
      const endpoint = `/v1/spaces/${space_id}/resources/databases/${node_id}/records${queryStr}`;
      
      const result:ResponseVO<GetRecordsResponeDataVO> = await bikaService.fetchFromAPI(endpoint, {
        method: "GET",
      });

      if (!result.success) {
        console.error("Failed to fetch records:", result.message || "Unknown error");
        return formatToolResponse({
          success: false,
          message: result.message || "Failed to fetch records"
        }, true);
      }

      return formatToolResponse({
        success: true,
        data: result.data
      });
    }
    catch (error) {
      console.error("Error in get_records:", error);
      return formatToolResponse({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }, true);
    }
  }
);

server.tool("get_fields_schema",
  "Returns the JSON schema of all fields within the specified database, This schema will be sent to LLM to help the AI understand the expected structure of the data.",
  { 
    space_id: z.string().describe('The ID of the workspace to fetch records from.'),
    node_id: z.string().describe('The ID of the database to fetch records from.'),
  },
  async ({ space_id, node_id }) => {
    try {
      const result = await bikaService.getDatabaseFieldsSchema(space_id, node_id);

      if (!result.success) {
        return formatToolResponse({
          success: false,
          message: result.message || "Failed to fetch database fields"
        }, true);
      }

      const fieldsSchema: FieldFormatJSONSchema = bikaService.getFieldsJSONSchema(result.data);

      return formatToolResponse({
        success: true,
        data: fieldsSchema
      });
    }
    catch (error) {
      console.error("Error in list_database_fields:", error);
      return formatToolResponse({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }, true);
    }
  }
);

server.tool("create_record",
  "Create a new record in the database. Extract key information from user-provided text based on a predefined Fields JSON Schema and create a new record in the database as a JSON object.",
  { 
    space_id: z.string().describe('The ID of the workspace where the new record will be created.'),
    node_id: z.string().describe('The ID of the database where the new record will be created.'),
    fields: z.record(z.any()).describe('A JSON object containing non-Attachment type field data. Keys represent field names and values represent field values. The structure of field values must conform to the Fields JSON Schema provided by the "get_fields_schema" tool.'),
    attachments_fields: z.record(z.array(z.object({
      id: z.string(),
      name: z.string(),
      size: z.number(),
      mimeType: z.string(),
      bucket: z.string(),
      path: z.string(),
    }))).optional().describe('A JSON object containing Attachment type field data. Keys represent field names and values are arrays of attachment objects. The structure of attachment objects must conform to the Fields JSON Schema provided by the "get_fields_schema" tool. You need to use the "upload_file_via_url" tool to obtain the attachment objects.'),
  },
  async ({ space_id, node_id, fields, attachments_fields }) => {
    try {
      const getFieldsResult = await bikaService.getDatabaseFieldsSchema(space_id, node_id);

      if (!getFieldsResult.success) {
        return formatToolResponse({
          success: false,
          message: getFieldsResult.message || "Failed to fetch database fields"
        }, true);
      }

      const fieldsSchema = getFieldsResult.data;
      let cells: Record<string, any> = {};
      if (fields !== undefined) {
        cells = bikaService.convertFieldValuesToCellFormat(fieldsSchema, fields);
      }

      // validate the uploaded files
      let file_validation_msg = '';

      if (attachments_fields) {
        fieldsSchema.forEach((fieldschema) => {
          const fieldValue = attachments_fields[fieldschema.name];
          if (fieldValue !== undefined) {
            cells[fieldschema.name] = fieldValue;
          }
        });
      }

      const createRecordResult = await bikaService.createDatabaseRecord(space_id, node_id, cells);

      if (!createRecordResult.success) {
        return formatToolResponse({
          success: false,
          message: JSON.stringify(createRecordResult) || "Failed to fetch database fields",
          file_validation_msg
        }, true);
      }

      return formatToolResponse({
        success: true,
        data: createRecordResult.data.cells,
        file_validation_msg
      });
    }
    catch (error) {
      console.error("Error in create_record:", error);
      return formatToolResponse({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }, true);
    }
  }
);

server.tool("upload_attachment_via_url",
  "Upload an attachment to the Bika server using its web URL. Returns storage information that can be passed to create_record or update_record tools to associate with a specific records.",
  {
    space_id: z.string().describe('The ID of the workspace where the attachment will be attached after upload.'),
    attachment_url: z.string().describe('The complete web URL of the file to be uploaded.'),
    attachment_name: z.string().optional().describe('Optional custom name for the attachment after upload.'),
  },
  async ({ space_id, attachment_url, attachment_name }) => {
    try {
      const result: ResponseVO<attachmentVO[]> = await bikaService.uploadFileToSpace(space_id, attachment_url, attachment_name);
      
      if (!result.success) {
        return formatToolResponse({
          success: false,
          message: result.message || "Failed to upload attachment"
        }, true);
      }

      return formatToolResponse({
        success: true,
        data: result
      });
    }
    catch (error) {
      console.error("Error in upload_attachment_via_url:", error);
      return formatToolResponse({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }, true);
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bika MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});