import { describe, expect, it } from 'vitest';

import type { ConvertOptions } from './types';
import { jsonSchemaToTypeScript, typeScriptToJsonSchema, validateJsonSchema, validateTypeScript } from './utils';

const defaultOptions: ConvertOptions = {
  exportType: 'interface',
  addExport: true,
  optionalByDefault: false,
  schemaVersion: 'draft-07',
  includeRequired: true,
};

describe('jsonSchemaToTypeScript', () => {
  it('应该将简单 schema 转为 interface', () => {
    const schema = JSON.stringify({
      title: 'User',
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      required: ['name'],
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain('export interface User');
    expect(result).toContain('name: string');
    expect(result).toContain('age?: number');
  });

  it('应该将简单 schema 转为 type', () => {
    const schema = JSON.stringify({
      title: 'User',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    });

    const options: ConvertOptions = { ...defaultOptions, exportType: 'type' };
    const result = jsonSchemaToTypeScript(schema, options);
    expect(result).toContain('export type User =');
    expect(result).toContain('name: string');
  });

  it('应该处理无 export 的情况', () => {
    const schema = JSON.stringify({
      title: 'User',
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    });

    const options: ConvertOptions = { ...defaultOptions, addExport: false };
    const result = jsonSchemaToTypeScript(schema, options);
    expect(result).not.toContain('export');
    expect(result).toContain('interface User');
  });

  it('应该处理 enum 类型', () => {
    const schema = JSON.stringify({
      title: 'Status',
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain("'active' | 'inactive'");
  });

  it('应该处理数组类型', () => {
    const schema = JSON.stringify({
      title: 'List',
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'string' } },
      },
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain('string[]');
  });

  it('应该处理联合类型 (type: ["string", "null"])', () => {
    const schema = JSON.stringify({
      title: 'Data',
      type: 'object',
      properties: {
        value: { type: ['string', 'null'] },
      },
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain('string | null');
  });

  it('应该处理 $ref', () => {
    const schema = JSON.stringify({
      title: 'Wrapper',
      type: 'object',
      properties: {
        child: { $ref: '#/definitions/ChildItem' },
      },
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain('ChildItem');
  });

  it('应该处理 anyOf', () => {
    const schema = JSON.stringify({
      title: 'Mixed',
      type: 'object',
      properties: {
        value: { anyOf: [{ type: 'string' }, { type: 'number' }] },
      },
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain('string | number');
  });

  it('应该处理 allOf', () => {
    const schema = JSON.stringify({
      title: 'Combined',
      type: 'object',
      properties: {
        value: { allOf: [{ type: 'string' }, { type: 'number' }] },
      },
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain('string & number');
  });

  it('应该处理 const', () => {
    const schema = JSON.stringify({
      title: 'Config',
      type: 'object',
      properties: {
        version: { const: 'v1' },
        count: { const: 42 },
      },
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain("'v1'");
    expect(result).toContain('42');
  });

  it('应该处理 description 注释', () => {
    const schema = JSON.stringify({
      title: 'User',
      type: 'object',
      properties: {
        name: { type: 'string', description: '用户名' },
      },
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain('/** 用户名 */');
  });

  it('应该处理 additionalProperties', () => {
    const schema = JSON.stringify({
      title: 'Dict',
      type: 'object',
      additionalProperties: { type: 'string' },
    });

    const options: ConvertOptions = { ...defaultOptions, exportType: 'type' };
    const result = jsonSchemaToTypeScript(schema, options);
    expect(result).toContain('Record<string, string>');
  });

  it('应该处理无 title 的 schema，默认名称为 Root', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: { name: { type: 'string' } },
    });

    const result = jsonSchemaToTypeScript(schema, defaultOptions);
    expect(result).toContain('Root');
  });
});

describe('typeScriptToJsonSchema', () => {
  it('应该将简单 interface 转为 JSON Schema', () => {
    const tsCode = `interface User {
  name: string;
  age: number;
}`;

    const result = typeScriptToJsonSchema(tsCode, defaultOptions);
    const schema = JSON.parse(result);
    expect(schema.title).toBe('User');
    expect(schema.type).toBe('object');
    expect(schema.properties.name).toEqual({ type: 'string' });
    expect(schema.properties.age).toEqual({ type: 'number' });
  });

  it('应该处理可选属性', () => {
    const tsCode = `interface Config {
  name: string;
  value?: number;
}`;

    const result = typeScriptToJsonSchema(tsCode, defaultOptions);
    const schema = JSON.parse(result);
    expect(schema.required).toContain('name');
    expect(schema.required).not.toContain('value');
  });

  it('应该处理数组类型', () => {
    const tsCode = `interface List {
  items: string[];
}`;

    const result = typeScriptToJsonSchema(tsCode, defaultOptions);
    const schema = JSON.parse(result);
    expect(schema.properties.items.type).toBe('array');
    expect(schema.properties.items.items.type).toBe('string');
  });

  it('应该处理 boolean 类型', () => {
    const tsCode = `interface Flags {
  isActive: boolean;
}`;

    const result = typeScriptToJsonSchema(tsCode, defaultOptions);
    const schema = JSON.parse(result);
    expect(schema.properties.isActive.type).toBe('boolean');
  });

  it('应该处理字面量联合类型为 enum', () => {
    const tsCode = `interface Status {
  status: 'active' | 'inactive';
}`;

    const result = typeScriptToJsonSchema(tsCode, defaultOptions);
    const schema = JSON.parse(result);
    expect(schema.properties.status.enum).toEqual(['active', 'inactive']);
  });

  it('应该处理联合类型（非字面量）为 anyOf', () => {
    const tsCode = `interface Mixed {
  value: string | number;
}`;

    const result = typeScriptToJsonSchema(tsCode, defaultOptions);
    const schema = JSON.parse(result);
    expect(schema.properties.value.anyOf).toBeDefined();
    expect(schema.properties.value.anyOf).toHaveLength(2);
  });

  it('应该处理 Record 类型', () => {
    const tsCode = `interface Dict {
  data: Record<string, number>;
}`;

    const result = typeScriptToJsonSchema(tsCode, defaultOptions);
    const schema = JSON.parse(result);
    expect(schema.properties.data.type).toBe('object');
    expect(schema.properties.data.additionalProperties.type).toBe('number');
  });

  it('应该处理 draft-04 版本', () => {
    const tsCode = `interface Test { name: string; }`;
    const options: ConvertOptions = { ...defaultOptions, schemaVersion: 'draft-04' };
    const result = typeScriptToJsonSchema(tsCode, options);
    const schema = JSON.parse(result);
    expect(schema.$schema).toContain('draft-04');
  });

  it('应该在没有 interface/type 定义时抛出错误', () => {
    expect(() => typeScriptToJsonSchema('const x = 1;', defaultOptions)).toThrow('未找到有效的 interface 或 type 定义');
  });

  it('应该处理多个 interface（主 interface + definitions）', () => {
    const tsCode = `interface User {
  name: string;
  address: Address;
}
interface Address {
  city: string;
}`;

    const result = typeScriptToJsonSchema(tsCode, defaultOptions);
    const schema = JSON.parse(result);
    expect(schema.title).toBe('User');
    expect(schema.definitions).toBeDefined();
    expect(schema.definitions.Address).toBeDefined();
  });

  it('应该处理带注释的属性', () => {
    const tsCode = `interface User {
  // 用户名
  name: string;
}`;

    const result = typeScriptToJsonSchema(tsCode, defaultOptions);
    const schema = JSON.parse(result);
    expect(schema.properties.name.description).toBe('用户名');
  });

  it('应该处理不含 required 的选项', () => {
    const tsCode = `interface User {
  name: string;
}`;

    const options: ConvertOptions = { ...defaultOptions, includeRequired: false };
    const result = typeScriptToJsonSchema(tsCode, options);
    const schema = JSON.parse(result);
    expect(schema.required).toBeUndefined();
  });
});

describe('validateJsonSchema', () => {
  it('应该验证合法的 JSON Schema', () => {
    const result = validateJsonSchema('{"type": "object"}');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('应该拒绝非对象 JSON', () => {
    const result = validateJsonSchema('"string"');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('必须是一个对象');
  });

  it('应该拒绝无效 JSON', () => {
    const result = validateJsonSchema('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该拒绝 null', () => {
    const result = validateJsonSchema('null');
    expect(result.valid).toBe(false);
  });
});

describe('validateTypeScript', () => {
  it('应该验证合法的 TypeScript 代码', () => {
    const result = validateTypeScript('interface User { name: string; }');
    expect(result.valid).toBe(true);
  });

  it('应该拒绝空字符串', () => {
    const result = validateTypeScript('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('代码不能为空');
  });

  it('应该拒绝没有 interface/type 的代码', () => {
    const result = validateTypeScript('const x = 1;');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('未找到有效的');
  });

  it('应该接受 type 定义', () => {
    const result = validateTypeScript('type ID = string;');
    expect(result.valid).toBe(true);
  });
});
