export type ConvertDirection = 'schema-to-ts' | 'ts-to-schema';

export interface ConvertOptions {
  // JSON Schema → TypeScript 选项
  exportType: 'interface' | 'type';
  addExport: boolean;
  optionalByDefault: boolean;

  // TypeScript → JSON Schema 选项
  schemaVersion: 'draft-07' | 'draft-04';
  includeRequired: boolean;
}

export const DEFAULT_OPTIONS: ConvertOptions = {
  exportType: 'interface',
  addExport: true,
  optionalByDefault: false,
  schemaVersion: 'draft-07',
  includeRequired: true,
};

export const EXAMPLE_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "description": "用户唯一标识"
    },
    "name": {
      "type": "string",
      "description": "用户名"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0
    },
    "isActive": {
      "type": "boolean",
      "default": true
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["admin", "user", "guest"]
      }
    },
    "profile": {
      "type": "object",
      "properties": {
        "avatar": {
          "type": "string"
        },
        "bio": {
          "type": ["string", "null"]
        }
      }
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": ["id", "name", "email"]
}`;

export const EXAMPLE_TYPESCRIPT = `export interface User {
  /** 用户唯一标识 */
  id: number;
  /** 用户名 */
  name: string;
  email: string;
  age?: number;
  isActive?: boolean;
  roles?: ('admin' | 'user' | 'guest')[];
  profile?: {
    avatar?: string;
    bio?: string | null;
  };
  tags?: string[];
}`;
