/**
 * 查询匹配器：把多条「包含/不包含」条件编译成一个 (text: string) => boolean 函数。
 *
 * 设计要点：
 *   - 输入框的内容**原样**作为关键词，不解析任何前缀语法（含空格、含 `-` 都按字面）
 *   - 多条件之间是 AND：所有 include 必须命中、所有 exclude 不能命中
 *   - 空内容的条件会被跳过，不影响结果
 *   - 大小写敏感、正则模式是全局开关
 *   - 正则模式下每个条件各自当作一条正则；非法正则不抛错，整体匹配恒为 false 并暴露 error
 */

export type ConditionOp = 'include' | 'exclude';

export interface FindCondition {
  /** 稳定的客户端 id（仅用于 React key） */
  id: string;
  /** 包含 / 不包含 */
  op: ConditionOp;
  /** 关键词文本，原样使用 */
  value: string;
}

export interface MatcherOptions {
  conditions: FindCondition[];
  caseSensitive: boolean;
  regexMode: boolean;
}

export interface CompiledMatcher {
  /** 匹配函数；条件全空时恒返回 true（表示"未在过滤"） */
  test: (text: string) => boolean;
  /** 是否处于"未搜索"状态（无任何有效条件） */
  isEmpty: boolean;
  /** 编译错误信息（首个非法正则的报错）；普通模式恒为 null */
  error: string | null;
}

const EMPTY_MATCHER: CompiledMatcher = {
  test: () => true,
  isEmpty: true,
  error: null,
};

/** 生成一个客户端唯一 id（足够避免 React key 冲突） */
export function createConditionId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 创建一个空的默认条件 */
export function createEmptyCondition(op: ConditionOp = 'include'): FindCondition {
  return { id: createConditionId(), op, value: '' };
}

/**
 * 把条件数组 + 全局选项编译为可执行 matcher。
 */
export function compileMatcher(options: MatcherOptions): CompiledMatcher {
  const { conditions, caseSensitive, regexMode } = options;

  // 过滤掉空 value 的条件
  const effective = conditions.filter((c) => c.value.length > 0);
  if (effective.length === 0) return EMPTY_MATCHER;

  if (regexMode) {
    const flags = caseSensitive ? '' : 'i';
    const compiled: { re: RegExp; exclude: boolean }[] = [];
    for (const c of effective) {
      try {
        compiled.push({ re: new RegExp(c.value, flags), exclude: c.op === 'exclude' });
      } catch (e) {
        return {
          test: () => false,
          isEmpty: false,
          error: `${c.value}: ${e instanceof Error ? e.message : 'Invalid regular expression'}`,
        };
      }
    }
    return {
      test: (text) => {
        for (const { re, exclude } of compiled) {
          const hit = re.test(text);
          if (exclude ? hit : !hit) return false;
        }
        return true;
      },
      isEmpty: false,
      error: null,
    };
  }

  // 普通模式：includes 匹配
  const normalize = caseSensitive ? (s: string) => s : (s: string) => s.toLowerCase();
  const compiled = effective.map((c) => ({
    needle: normalize(c.value),
    exclude: c.op === 'exclude',
  }));

  return {
    test: (text) => {
      const haystack = normalize(text);
      for (const { needle, exclude } of compiled) {
        const hit = haystack.includes(needle);
        if (exclude ? hit : !hit) return false;
      }
      return true;
    },
    isEmpty: false,
    error: null,
  };
}
