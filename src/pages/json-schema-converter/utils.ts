import { ConvertOptions } from './types';

/**
 * 将字符串首字母大写
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 将 kebab-case 或 snake_case 转为 PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => capitalize(word))
    .join('');
}

/**
 * 生成缩进
 */
function indent(level: number): string {
  return '  '.repeat(level);
}

/**
 * 将 JSON Schema 类型转换为 TypeScript 类型
 */
function schemaTypeToTs(schema: any, options: ConvertOptions, level: number = 0): string {
  if (!schema) return 'unknown';

  // 处理 $ref
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop() || 'unknown';
    return toPascalCase(refName);
  }

  // 处理 anyOf / oneOf / allOf
  if (schema.anyOf) {
    return schema.anyOf.map((s: any) => schemaTypeToTs(s, options, level)).join(' | ');
  }
  if (schema.oneOf) {
    return schema.oneOf.map((s: any) => schemaTypeToTs(s, options, level)).join(' | ');
  }
  if (schema.allOf) {
    return schema.allOf.map((s: any) => schemaTypeToTs(s, options, level)).join(' & ');
  }

  // 处理 enum
  if (schema.enum) {
    return schema.enum.map((v: any) => (typeof v === 'string' ? `'${v}'` : String(v))).join(' | ');
  }

  // 处理 const
  if (schema.const !== undefined) {
    return typeof schema.const === 'string' ? `'${schema.const}'` : String(schema.const);
  }

  const type = schema.type;

  // 处理联合类型 (type: ["string", "null"])
  if (Array.isArray(type)) {
    return type.map((t: string) => schemaTypeToTs({ type: t }, options, level)).join(' | ');
  }

  switch (type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array':
      if (schema.items) {
        const itemType = schemaTypeToTs(schema.items, options, level);
        return `${itemType}[]`;
      }
      return 'unknown[]';
    case 'object':
      return generateObjectType(schema, options, level);
    default:
      // 没有 type 但有 properties，当作 object 处理
      if (schema.properties) {
        return generateObjectType(schema, options, level);
      }
      return 'unknown';
  }
}

/**
 * 生成对象类型
 */
function generateObjectType(schema: any, options: ConvertOptions, level: number): string {
  const properties = schema.properties || {};
  const required: string[] = schema.required || [];
  const propNames = Object.keys(properties);

  if (propNames.length === 0) {
    // additionalProperties
    if (schema.additionalProperties) {
      const valueType = schemaTypeToTs(schema.additionalProperties, options, level);
      return `Record<string, ${valueType}>`;
    }
    return 'Record<string, unknown>';
  }

  const lines: string[] = ['{'];

  for (const propName of propNames) {
    const propSchema = properties[propName];
    const isRequired = required.includes(propName);
    // optionalByDefault=true 时，只有 required 数组中的字段才是必填的，其他都可选
    // optionalByDefault=false 时，不在 required 数组中的字段可选
    const isOptional = !isRequired;
    const optionalMark = isOptional ? '?' : '';
    const propType = schemaTypeToTs(propSchema, options, level + 1);

    // 添加注释
    if (propSchema.description) {
      lines.push(`${indent(level + 1)}/** ${propSchema.description} */`);
    }

    lines.push(`${indent(level + 1)}${propName}${optionalMark}: ${propType};`);
  }

  lines.push(`${indent(level)}}`);
  return lines.join('\n');
}

/**
 * JSON Schema → TypeScript
 */
export function jsonSchemaToTypeScript(schemaStr: string, options: ConvertOptions): string {
  const schema = JSON.parse(schemaStr);
  const typeName = toPascalCase(schema.title || 'Root');
  const exportKeyword = options.addExport ? 'export ' : '';
  const typeKeyword = options.exportType;

  if (typeKeyword === 'interface') {
    const bodyLines = generateInterfaceBody(schema, options, 0);
    return `${exportKeyword}interface ${typeName} ${bodyLines}`;
  } else {
    const typeBody = schemaTypeToTs(schema, options, 0);
    return `${exportKeyword}type ${typeName} = ${typeBody};`;
  }
}

/**
 * 生成 interface body
 */
function generateInterfaceBody(schema: any, options: ConvertOptions, level: number): string {
  const properties = schema.properties || {};
  const required: string[] = schema.required || [];
  const propNames = Object.keys(properties);

  if (propNames.length === 0) {
    return '{}';
  }

  const lines: string[] = ['{'];

  for (const propName of propNames) {
    const propSchema = properties[propName];
    const isRequired = required.includes(propName);
    // optionalByDefault=true 时，只有 required 数组中的字段才是必填的，其他都可选
    // optionalByDefault=false 时，不在 required 数组中的字段可选
    const isOptional = !isRequired;
    const optionalMark = isOptional ? '?' : '';
    const propType = schemaTypeToTs(propSchema, options, level + 1);

    // 添加注释
    if (propSchema.description) {
      lines.push(`${indent(level + 1)}/** ${propSchema.description} */`);
    }

    lines.push(`${indent(level + 1)}${propName}${optionalMark}: ${propType};`);
  }

  lines.push(`${indent(level)}}`);
  return lines.join('\n');
}

// ============ TypeScript → JSON Schema ============

interface ParsedProperty {
  name: string;
  type: string;
  optional: boolean;
  comment?: string;
}

interface ParsedInterface {
  name: string;
  properties: ParsedProperty[];
}

/**
 * 简易 TypeScript 解析器
 * 支持 interface 和 type 定义
 */
function parseTypeScript(code: string): ParsedInterface[] {
  const interfaces: ParsedInterface[] = [];

  // 移除多行注释
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');

  // 匹配 interface 或 type
  const interfaceRegex = /(?:export\s+)?(?:interface|type)\s+(\w+)\s*(?:=\s*)?\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;

  while ((match = interfaceRegex.exec(code)) !== null) {
    const name = match[1];
    const body = match[2];
    const properties = parseProperties(body);
    interfaces.push({ name, properties });
  }

  return interfaces;
}

/**
 * 解析属性列表
 */
function parseProperties(body: string): ParsedProperty[] {
  const properties: ParsedProperty[] = [];
  const lines = body.split('\n');

  let currentComment = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行
    if (!trimmed) continue;

    // 捕获单行注释
    const commentMatch = trimmed.match(/^\/\/\s*(.*)$/);
    if (commentMatch) {
      currentComment = commentMatch[1];
      continue;
    }

    // 捕获 JSDoc 注释
    const jsdocMatch = trimmed.match(/^\/\*\*\s*(.*?)\s*\*\/$/);
    if (jsdocMatch) {
      currentComment = jsdocMatch[1];
      continue;
    }

    // 解析属性
    const propMatch = trimmed.match(/^(\w+)(\?)?:\s*(.+?);?\s*$/);
    if (propMatch) {
      properties.push({
        name: propMatch[1],
        optional: propMatch[2] === '?',
        type: propMatch[3].replace(/;$/, '').trim(),
        comment: currentComment || undefined,
      });
      currentComment = '';
    }
  }

  return properties;
}

/**
 * 将 TypeScript 类型转换为 JSON Schema 类型
 */
function tsTypeToSchema(tsType: string, options: ConvertOptions): any {
  tsType = tsType.trim();

  // 处理括号包裹的类型，如 (string | number)[]
  if (tsType.startsWith('(') && tsType.includes(')')) {
    const closeParenIndex = tsType.lastIndexOf(')');
    const suffix = tsType.slice(closeParenIndex + 1);
    if (suffix === '[]') {
      const innerType = tsType.slice(1, closeParenIndex);
      return {
        type: 'array',
        items: tsTypeToSchema(innerType, options),
      };
    }
  }

  // 处理联合类型
  if (tsType.includes(' | ')) {
    const types = tsType.split(' | ').map((t) => t.trim());

    // 检查是否是字面量联合类型 (enum)
    const allLiterals = types.every((t) => t.startsWith("'") || t.startsWith('"') || !isNaN(Number(t)));
    if (allLiterals) {
      return {
        type: 'string',
        enum: types.map((t) => t.replace(/^['"]|['"]$/g, '')),
      };
    }

    // 检查是否包含 null
    if (types.includes('null')) {
      const nonNullTypes = types.filter((t) => t !== 'null');
      if (nonNullTypes.length === 1) {
        const baseSchema = tsTypeToSchema(nonNullTypes[0], options);
        return {
          ...baseSchema,
          type: [baseSchema.type, 'null'],
        };
      }
    }

    return {
      anyOf: types.map((t) => tsTypeToSchema(t, options)),
    };
  }

  // 处理数组类型
  if (tsType.endsWith('[]')) {
    const itemType = tsType.slice(0, -2);
    return {
      type: 'array',
      items: tsTypeToSchema(itemType, options),
    };
  }

  // 处理 Array<T>
  const arrayMatch = tsType.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    return {
      type: 'array',
      items: tsTypeToSchema(arrayMatch[1], options),
    };
  }

  // 处理内联对象类型
  if (tsType.startsWith('{') && tsType.endsWith('}')) {
    const innerBody = tsType.slice(1, -1);
    const props = parseProperties(innerBody);
    return propsToSchema(props, options);
  }

  // 处理 Record<K, V>
  const recordMatch = tsType.match(/^Record<\s*string\s*,\s*(.+)\s*>$/);
  if (recordMatch) {
    return {
      type: 'object',
      additionalProperties: tsTypeToSchema(recordMatch[1], options),
    };
  }

  // 基本类型映射
  switch (tsType) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'null':
      return { type: 'null' };
    case 'any':
    case 'unknown':
      return {};
    default:
      // 可能是引用类型
      return { $ref: `#/definitions/${tsType}` };
  }
}

/**
 * 将解析的属性转换为 JSON Schema
 */
function propsToSchema(properties: ParsedProperty[], options: ConvertOptions): any {
  const schema: any = {
    type: 'object',
    properties: {},
  };

  const required: string[] = [];

  for (const prop of properties) {
    const propSchema = tsTypeToSchema(prop.type, options);

    if (prop.comment) {
      propSchema.description = prop.comment;
    }

    schema.properties[prop.name] = propSchema;

    if (!prop.optional && options.includeRequired) {
      required.push(prop.name);
    }
  }

  if (required.length > 0 && options.includeRequired) {
    schema.required = required;
  }

  return schema;
}

/**
 * TypeScript → JSON Schema
 */
export function typeScriptToJsonSchema(tsCode: string, options: ConvertOptions): string {
  const interfaces = parseTypeScript(tsCode);

  if (interfaces.length === 0) {
    throw new Error('未找到有效的 interface 或 type 定义');
  }

  const mainInterface = interfaces[0];
  const schema: any = {
    $schema:
      options.schemaVersion === 'draft-07'
        ? 'http://json-schema.org/draft-07/schema#'
        : 'http://json-schema.org/draft-04/schema#',
    title: mainInterface.name,
    ...propsToSchema(mainInterface.properties, options),
  };

  // 如果有多个 interface，添加 definitions
  if (interfaces.length > 1) {
    schema.definitions = {};
    for (let i = 1; i < interfaces.length; i++) {
      const iface = interfaces[i];
      schema.definitions[iface.name] = propsToSchema(iface.properties, options);
    }
  }

  return JSON.stringify(schema, null, 2);
}

/**
 * 验证 JSON Schema 格式
 */
export function validateJsonSchema(schemaStr: string): { valid: boolean; error?: string } {
  try {
    const schema = JSON.parse(schemaStr);
    if (typeof schema !== 'object' || schema === null) {
      return { valid: false, error: 'Schema 必须是一个对象' };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * 验证 TypeScript 代码格式（简单检查）
 */
export function validateTypeScript(code: string): { valid: boolean; error?: string } {
  const trimmed = code.trim();
  if (!trimmed) {
    return { valid: false, error: '代码不能为空' };
  }

  // 检查是否包含 interface 或 type 定义
  if (!/(interface|type)\s+\w+/.test(trimmed)) {
    return { valid: false, error: '未找到有效的 interface 或 type 定义' };
  }

  return { valid: true };
}
