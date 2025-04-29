export interface ResponseVO<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export type SpaceVO = {
  id: string,
  name: string,
  createBy?: string,
  createdAt?: string,
  slug?: string,
  logo: any,
  settings: any,
  owner: string
}

export type NodeVO = {
  id: string,
  name: string,
  description?: string,
  type: string,
  parentId: string,
  path: string
}

export type RecordVO = {
  recordId: string,
  fields: Record<string, any>,
  createdAt: number,
  updatedAt: number,
}

export type CellVO = {
  id: string,
  name: string,
  fieldType: string,
  value: any,
  data: any,
}

export type RecordV2VO = {
  id: string,
  databaseId: string,
  cells: Record<string, CellVO>,
}

export type GetRecordsResponeDataVO = {
  total: number,
  pageSize: number,
  pageNum: number,
  records: RecordVO[],
}

export type attachmentVO = {
  id: string,
  name: string,
  mimeType: string,
  bucket: string,
  path: string,
  size: number,
}

export type FieldSchemaVO = {
  id: string,
  name: string,
  description?: string,
  type: string,
  property?: any,
}

export type ToolSpaceVo = {
  space_id: string,
  space_name: string,
  create_by?: string,
  created_at?: string,
  owner: string
}

export type ToolNodeVo = {
  node_id: string,
  name: string,
  description?: string,
  node_type: string,
  parent_id: string,
  path: string
}

export type ToolRecordVo = {
  record_id: string,
  fields: Record<string, any>,
  created_at: number,
  updated_at: number,
}

export type SelectFieldOptionVO = {
  id: string,
  name: string,
  color: string,
}

export interface FieldFormatJSONSchema {
  json_schema: FieldFormatJSONSchema.JSONSchema;

  /**
   * The type of field format being defined: `json_schema`
   */
  type: 'json_schema';
}

export namespace FieldFormatJSONSchema {
  export interface JSONSchema {
    /**
     * The name of the database fields schema format. Must be a-z, A-Z, 0-9, or contain underscores
     * and dashes, with a maximum length of 64.
     */
    name: string;

    /**
     * A description of what the fields schema format is for, used by the model to determine
     * how to respond in the format.
     */
    description?: string;

    /**
     * The schema for the fields schema format, described as a JSON Schema object.
     */
    schema?: Record<string, unknown>;

    /**
     * Whether to enable strict schema adherence when generating the output. If set to
     * true, the model will always follow the exact schema defined in the `schema`
     * field. Only a subset of JSON Schema is supported when `strict` is `true`. To
     * learn more, read the
     * [Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs).
     */
    strict?: boolean | null;
  }
}