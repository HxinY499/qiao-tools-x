/**
 * 铁路图 SVG 可视化组件
 * 将正则 AST 渲染为可视化的流程图
 */

import { useMemo } from 'react';

import type { ASTNode, RegexNode } from './types';

// 渲染配置
const CONFIG = {
  // 节点尺寸
  nodeHeight: 28,
  nodePadding: 12,
  nodeRadius: 4,
  minNodeWidth: 40,

  // 间距
  horizontalGap: 16,
  verticalGap: 12,
  arcRadius: 10,

  // 字体
  fontSize: 13,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',

  // 颜色 (使用 CSS 变量)
  colors: {
    line: 'var(--railroad-line, hsl(var(--muted-foreground)))',
    text: 'var(--railroad-text, hsl(var(--foreground)))',
    // 节点类型颜色
    literal: 'var(--railroad-literal, hsl(210 40% 96%))',
    literalBorder: 'var(--railroad-literal-border, hsl(210 40% 80%))',
    meta: 'var(--railroad-meta, hsl(280 60% 95%))',
    metaBorder: 'var(--railroad-meta-border, hsl(280 60% 70%))',
    class: 'var(--railroad-class, hsl(150 40% 94%))',
    classBorder: 'var(--railroad-class-border, hsl(150 40% 65%))',
    group: 'var(--railroad-group, hsl(35 80% 95%))',
    groupBorder: 'var(--railroad-group-border, hsl(35 80% 70%))',
    anchor: 'var(--railroad-anchor, hsl(0 60% 95%))',
    anchorBorder: 'var(--railroad-anchor-border, hsl(0 60% 70%))',
    quantifier: 'var(--railroad-quantifier, hsl(200 60% 94%))',
    quantifierBorder: 'var(--railroad-quantifier-border, hsl(200 60% 65%))',
  },
};

// 渲染结果
interface RenderResult {
  svg: React.ReactNode;
  width: number;
  height: number;
}

// 测量文本宽度
function measureText(text: string): number {
  return text.length * CONFIG.fontSize * 0.6 + CONFIG.nodePadding * 2;
}

// 渲染单个节点框
function renderBox(
  x: number,
  y: number,
  text: string,
  type: string,
  key: string,
): { element: React.ReactNode; width: number } {
  const width = Math.max(measureText(text), CONFIG.minNodeWidth);
  const height = CONFIG.nodeHeight;

  let fill = CONFIG.colors.literal;
  let stroke = CONFIG.colors.literalBorder;

  switch (type) {
    case 'meta':
      fill = CONFIG.colors.meta;
      stroke = CONFIG.colors.metaBorder;
      break;
    case 'class':
      fill = CONFIG.colors.class;
      stroke = CONFIG.colors.classBorder;
      break;
    case 'group':
      fill = CONFIG.colors.group;
      stroke = CONFIG.colors.groupBorder;
      break;
    case 'anchor':
      fill = CONFIG.colors.anchor;
      stroke = CONFIG.colors.anchorBorder;
      break;
    case 'quantifier':
      fill = CONFIG.colors.quantifier;
      stroke = CONFIG.colors.quantifierBorder;
      break;
  }

  const element = (
    <g key={key}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={CONFIG.nodeRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={CONFIG.fontSize}
        fontFamily={CONFIG.fontFamily}
        fill={CONFIG.colors.text}
      >
        {text}
      </text>
    </g>
  );

  return { element, width };
}

// 渲染水平线
function renderLine(x1: number, y: number, x2: number, key: string): React.ReactNode {
  return <line key={key} x1={x1} y1={y} x2={x2} y2={y} stroke={CONFIG.colors.line} strokeWidth={1.5} />;
}

// 渲染起点/终点圆点
function renderDot(x: number, y: number, key: string): React.ReactNode {
  return <circle key={key} cx={x} cy={y} r={5} fill={CONFIG.colors.line} />;
}

// 渲染分支弧线
// function renderArc(
//   x: number,
//   y: number,
//   direction: 'down-right' | 'right-down' | 'up-right' | 'right-up',
//   key: string,
// ): React.ReactNode {
//   const r = CONFIG.arcRadius;
//   let d = '';

//   switch (direction) {
//     case 'down-right':
//       d = `M ${x} ${y} Q ${x} ${y + r} ${x + r} ${y + r}`;
//       break;
//     case 'right-down':
//       d = `M ${x} ${y} Q ${x + r} ${y} ${x + r} ${y + r}`;
//       break;
//     case 'up-right':
//       d = `M ${x} ${y} Q ${x} ${y - r} ${x + r} ${y - r}`;
//       break;
//     case 'right-up':
//       d = `M ${x} ${y} Q ${x + r} ${y} ${x + r} ${y - r}`;
//       break;
//   }

//   return <path key={key} d={d} fill="none" stroke={CONFIG.colors.line} strokeWidth={1.5} />;
// }

// 渲染 AST 节点
function renderNode(node: ASTNode, x: number, y: number, keyPrefix: string): RenderResult {
  const elements: React.ReactNode[] = [];
  const centerY = y + CONFIG.nodeHeight / 2;

  switch (node.type) {
    case 'Regex': {
      const regexNode = node as RegexNode;
      const bodyResult = renderNode(regexNode.body, x + 20, y, `${keyPrefix}-body`);

      // 起点
      elements.push(renderDot(x + 5, centerY, `${keyPrefix}-start`));
      elements.push(renderLine(x + 5, centerY, x + 20, `${keyPrefix}-start-line`));

      elements.push(bodyResult.svg);

      // 终点
      const endX = x + 20 + bodyResult.width + 15;
      elements.push(renderLine(x + 20 + bodyResult.width, centerY, endX, `${keyPrefix}-end-line`));
      elements.push(renderDot(endX + 5, centerY, `${keyPrefix}-end`));

      return {
        svg: <g key={keyPrefix}>{elements}</g>,
        width: bodyResult.width + 50,
        height: bodyResult.height,
      };
    }

    case 'Alternative': {
      let currentX = x;
      let maxHeight = CONFIG.nodeHeight;

      if ('elements' in node) {
        for (let i = 0; i < node.elements.length; i++) {
          const elem = node.elements[i];
          const result = renderNode(elem, currentX, y, `${keyPrefix}-${i}`);
          elements.push(result.svg);

          if (i < node.elements.length - 1) {
            elements.push(
              renderLine(
                currentX + result.width,
                centerY,
                currentX + result.width + CONFIG.horizontalGap,
                `${keyPrefix}-line-${i}`,
              ),
            );
          }

          currentX += result.width + CONFIG.horizontalGap;
          maxHeight = Math.max(maxHeight, result.height);
        }
      }

      return {
        svg: <g key={keyPrefix}>{elements}</g>,
        width: Math.max(currentX - x - CONFIG.horizontalGap, 0),
        height: maxHeight,
      };
    }

    case 'Disjunction': {
      if (!('alternatives' in node)) break;

      // 计算每个分支的尺寸
      const branchResults: RenderResult[] = [];
      let maxWidth = 0;

      for (let i = 0; i < node.alternatives.length; i++) {
        const result = renderNode(node.alternatives[i], 0, 0, `${keyPrefix}-alt-${i}`);
        branchResults.push(result);
        maxWidth = Math.max(maxWidth, result.width);
      }

      // 计算总高度
      const totalHeight =
        branchResults.reduce((sum, r) => sum + r.height, 0) + (branchResults.length - 1) * CONFIG.verticalGap;

      // 渲染分支
      let currentY = y;
      const branchX = x + CONFIG.arcRadius + CONFIG.horizontalGap;

      for (let i = 0; i < branchResults.length; i++) {
        const result = branchResults[i];
        const branchCenterY = currentY + CONFIG.nodeHeight / 2;

        // 左侧连接
        if (i === 0) {
          elements.push(renderLine(x, branchCenterY, branchX, `${keyPrefix}-left-${i}`));
        } else {
          // 绘制弧线连接
          elements.push(
            <path
              key={`${keyPrefix}-left-arc-${i}`}
              d={`M ${x} ${centerY} L ${x} ${branchCenterY - CONFIG.arcRadius} Q ${x} ${branchCenterY} ${x + CONFIG.arcRadius} ${branchCenterY} L ${branchX} ${branchCenterY}`}
              fill="none"
              stroke={CONFIG.colors.line}
              strokeWidth={1.5}
            />,
          );
        }

        // 渲染分支内容
        const branchElement = renderNode(node.alternatives[i], branchX, currentY, `${keyPrefix}-branch-${i}`);
        elements.push(branchElement.svg);

        // 右侧连接
        const rightX = branchX + maxWidth + CONFIG.horizontalGap;
        elements.push(renderLine(branchX + result.width, branchCenterY, rightX, `${keyPrefix}-right-${i}`));

        if (i === 0) {
          elements.push(renderLine(rightX, branchCenterY, rightX + CONFIG.arcRadius, `${keyPrefix}-right-end-${i}`));
        } else {
          elements.push(
            <path
              key={`${keyPrefix}-right-arc-${i}`}
              d={`M ${rightX} ${branchCenterY} Q ${rightX + CONFIG.arcRadius} ${branchCenterY} ${rightX + CONFIG.arcRadius} ${branchCenterY - CONFIG.arcRadius} L ${rightX + CONFIG.arcRadius} ${centerY}`}
              fill="none"
              stroke={CONFIG.colors.line}
              strokeWidth={1.5}
            />,
          );
        }

        currentY += result.height + CONFIG.verticalGap;
      }

      return {
        svg: <g key={keyPrefix}>{elements}</g>,
        width: maxWidth + CONFIG.arcRadius * 2 + CONFIG.horizontalGap * 2,
        height: totalHeight,
      };
    }

    case 'Group': {
      if (!('body' in node)) break;

      const groupNode = node;
      const bodyResult = renderNode(groupNode.body, x + 10, y, `${keyPrefix}-body`);

      // 分组边框
      elements.push(
        <rect
          key={`${keyPrefix}-border`}
          x={x}
          y={y - 4}
          width={bodyResult.width + 20}
          height={bodyResult.height + 8}
          rx={6}
          fill="none"
          stroke={CONFIG.colors.groupBorder}
          strokeWidth={1}
          strokeDasharray="4 2"
          opacity={0.6}
        />,
      );

      // 分组标签
      let label = '';
      if ('capturing' in groupNode) {
        if (groupNode.name) {
          label = `<${groupNode.name}>`;
        } else if (groupNode.capturing && groupNode.number) {
          label = `#${groupNode.number}`;
        } else if (!groupNode.capturing) {
          label = '(?:)';
        }
      }

      if (label) {
        elements.push(
          <text
            key={`${keyPrefix}-label`}
            x={x + 4}
            y={y - 8}
            fontSize={10}
            fontFamily={CONFIG.fontFamily}
            fill={CONFIG.colors.groupBorder}
          >
            {label}
          </text>,
        );
      }

      elements.push(bodyResult.svg);

      return {
        svg: <g key={keyPrefix}>{elements}</g>,
        width: bodyResult.width + 20,
        height: bodyResult.height + 8,
      };
    }

    case 'Repetition': {
      if (!('body' in node && 'quantifier' in node)) break;

      const repNode = node;
      const bodyResult = renderNode(repNode.body, x, y, `${keyPrefix}-body`);

      elements.push(bodyResult.svg);

      // 量词标签
      const { min, max, greedy } = repNode.quantifier;
      let quantLabel = '';

      if (min === 0 && max === null) {
        quantLabel = '*';
      } else if (min === 1 && max === null) {
        quantLabel = '+';
      } else if (min === 0 && max === 1) {
        quantLabel = '?';
      } else if (max === null) {
        quantLabel = `{${min},}`;
      } else if (min === max) {
        quantLabel = `{${min}}`;
      } else {
        quantLabel = `{${min},${max}}`;
      }

      if (!greedy) {
        quantLabel += '?';
      }

      // 绘制循环箭头（如果是 + 或 *）
      if (max === null || max > 1) {
        const loopY = y + CONFIG.nodeHeight + 8;
        elements.push(
          <path
            key={`${keyPrefix}-loop`}
            d={`M ${x + bodyResult.width - 5} ${centerY} 
                Q ${x + bodyResult.width + 5} ${centerY} ${x + bodyResult.width + 5} ${centerY + 10}
                L ${x + bodyResult.width + 5} ${loopY - 5}
                Q ${x + bodyResult.width + 5} ${loopY} ${x + bodyResult.width - 5} ${loopY}
                L ${x + 5} ${loopY}
                Q ${x - 5} ${loopY} ${x - 5} ${loopY - 5}
                L ${x - 5} ${centerY + 10}
                Q ${x - 5} ${centerY} ${x + 5} ${centerY}`}
            fill="none"
            stroke={CONFIG.colors.quantifierBorder}
            strokeWidth={1.5}
            markerEnd="url(#arrowhead)"
          />,
        );
      }

      // 量词标签
      elements.push(
        <text
          key={`${keyPrefix}-quant`}
          x={x + bodyResult.width / 2}
          y={y + CONFIG.nodeHeight + 22}
          textAnchor="middle"
          fontSize={11}
          fontFamily={CONFIG.fontFamily}
          fill={CONFIG.colors.quantifierBorder}
          fontWeight="500"
        >
          {quantLabel}
        </text>,
      );

      return {
        svg: <g key={keyPrefix}>{elements}</g>,
        width: bodyResult.width + 10,
        height: bodyResult.height + 30,
      };
    }

    case 'Char': {
      let displayText = node.raw;
      let type = 'literal';

      if ('kind' in node) {
        if (node.kind === 'meta') {
          type = 'meta';
          // 显示更友好的名称
          const metaNames: Record<string, string> = {
            '\\d': '数字',
            '\\D': '非数字',
            '\\w': '单词',
            '\\W': '非单词',
            '\\s': '空白',
            '\\S': '非空白',
            '.': '任意',
          };
          displayText = metaNames[node.raw] || node.raw;
        }
      }

      const box = renderBox(x, y, displayText, type, keyPrefix);
      return {
        svg: box.element,
        width: box.width,
        height: CONFIG.nodeHeight,
      };
    }

    case 'CharacterClass': {
      const displayText = node.raw;
      const box = renderBox(x, y, displayText, 'class', keyPrefix);
      return {
        svg: box.element,
        width: box.width,
        height: CONFIG.nodeHeight,
      };
    }

    case 'Anchor': {
      let displayText = node.raw;
      if ('kind' in node) {
        const anchorNames: Record<string, string> = {
          'start': '开头 ^',
          'end': '结尾 $',
          'boundary': '边界 \\b',
          'non-boundary': '非边界 \\B',
        };
        displayText = anchorNames[node.kind] || node.raw;
      }

      const box = renderBox(x, y, displayText, 'anchor', keyPrefix);
      return {
        svg: box.element,
        width: box.width,
        height: CONFIG.nodeHeight,
      };
    }

    case 'Backreference': {
      let displayText = node.raw;
      if ('number' in node && node.number) {
        displayText = `\\${node.number}`;
      }

      const box = renderBox(x, y, displayText, 'group', keyPrefix);
      return {
        svg: box.element,
        width: box.width,
        height: CONFIG.nodeHeight,
      };
    }
  }

  // 默认：渲染原始文本
  const box = renderBox(x, y, node.raw || '?', 'literal', keyPrefix);
  return {
    svg: box.element,
    width: box.width,
    height: CONFIG.nodeHeight,
  };
}

interface RailroadDiagramProps {
  ast: RegexNode | null;
  className?: string;
}

export function RailroadDiagram({ ast, className = '' }: RailroadDiagramProps) {
  const { svg, width, height } = useMemo(() => {
    if (!ast) {
      return { svg: null, width: 0, height: 0 };
    }

    return renderNode(ast, 20, 30, 'root');
  }, [ast]);

  if (!ast) {
    return (
      <div className={`flex items-center justify-center h-32 text-muted-foreground ${className}`}>
        输入正则表达式以查看可视化
      </div>
    );
  }

  const svgWidth = Math.max(width + 60, 200);
  const svgHeight = Math.max(height + 60, 80);

  return (
    <div className={`overflow-auto custom-scrollbar ${className}`}>
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="min-w-full">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill={CONFIG.colors.quantifierBorder} />
          </marker>
        </defs>
        <style>
          {`
            :root {
              --railroad-line: hsl(var(--muted-foreground));
              --railroad-text: hsl(var(--foreground));
              --railroad-literal: hsl(210 40% 96%);
              --railroad-literal-border: hsl(210 40% 80%);
              --railroad-meta: hsl(280 60% 95%);
              --railroad-meta-border: hsl(280 60% 70%);
              --railroad-class: hsl(150 40% 94%);
              --railroad-class-border: hsl(150 40% 65%);
              --railroad-group: hsl(35 80% 95%);
              --railroad-group-border: hsl(35 80% 70%);
              --railroad-anchor: hsl(0 60% 95%);
              --railroad-anchor-border: hsl(0 60% 70%);
              --railroad-quantifier: hsl(200 60% 94%);
              --railroad-quantifier-border: hsl(200 60% 65%);
            }
            .dark {
              --railroad-line: hsl(var(--muted-foreground));
              --railroad-text: hsl(var(--foreground));
              --railroad-literal: hsl(210 30% 25%);
              --railroad-literal-border: hsl(210 40% 50%);
              --railroad-meta: hsl(280 40% 25%);
              --railroad-meta-border: hsl(280 50% 55%);
              --railroad-class: hsl(150 30% 22%);
              --railroad-class-border: hsl(150 40% 45%);
              --railroad-group: hsl(35 50% 25%);
              --railroad-group-border: hsl(35 60% 55%);
              --railroad-anchor: hsl(0 40% 25%);
              --railroad-anchor-border: hsl(0 50% 55%);
              --railroad-quantifier: hsl(200 40% 25%);
              --railroad-quantifier-border: hsl(200 50% 55%);
            }
          `}
        </style>
        {svg}
      </svg>
    </div>
  );
}

export default RailroadDiagram;
