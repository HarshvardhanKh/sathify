import React from 'react';
import { EquationNode } from '../../../services/equations/parser';
import { nodeToString } from '../../../services/equations/parser';

interface Props {
  node: EquationNode;
  selectedId: string | null;
  dyscalculiaMode: boolean;
  depth: number;
}

// Distinct colors per token category (not color-alone: also spacing below) —
// Phase 17's explicit "do not rely only on color" requirement.
const OPERATOR_COLOR = 'text-blue-500 dark:text-blue-400 font-black';
const NUMBER_COLOR = 'text-emerald-600 dark:text-emerald-400';
const VARIABLE_COLOR = 'text-purple-600 dark:text-purple-400 italic';

function wrapperClasses(node: EquationNode, selectedId: string | null, dyscalculiaMode: boolean, depth: number): string {
  const isSelected = node.id === selectedId;
  const base = 'inline-flex items-center rounded outline-none';
  const selection = isSelected ? 'ring-2 ring-accent bg-accent/10' : '';
  // Dyscalculia assist: extra spacing + a subtle border per nesting depth so
  // parenthesis/grouping depth is visible via spacing/borders, not color alone.
  const spacing = dyscalculiaMode ? `mx-1 px-1.5 py-0.5 border border-border/60` : '';
  const depthStyle = dyscalculiaMode && depth > 0 ? `border-l-2` : '';
  return `${base} ${selection} ${spacing} ${depthStyle}`.trim();
}

export const EquationNodeView: React.FC<Props> = ({ node, selectedId, dyscalculiaMode, depth }) => {
  const common = {
    'data-eq-node': node.id,
    tabIndex: -1,
    role: 'group',
    'aria-label': nodeToString(node),
    className: wrapperClasses(node, selectedId, dyscalculiaMode, depth),
  } as const;

  switch (node.kind) {
    case 'number':
      return (
        <span {...common} className={`${common.className} ${NUMBER_COLOR}`}>
          {node.value}
        </span>
      );
    case 'variable':
      return (
        <span {...common} className={`${common.className} ${VARIABLE_COLOR}`}>
          {node.value}
        </span>
      );
    case 'unary':
      return (
        <span {...common}>
          <span className={OPERATOR_COLOR}>−</span>
          <EquationNodeView node={node.operand} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={depth + 1} />
        </span>
      );
    case 'binary':
      if (node.op === '/') {
        // Rendered as a stacked fraction, not inline "/", for clarity.
        return (
          <span {...common} className={`${common.className} flex-col items-center leading-none px-1.5`}>
            <span className="pb-0.5">
              <EquationNodeView node={node.left} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={depth + 1} />
            </span>
            <span className="w-full border-t-2 border-current" />
            <span className="pt-0.5">
              <EquationNodeView node={node.right} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={depth + 1} />
            </span>
          </span>
        );
      }
      return (
        <span {...common}>
          <EquationNodeView node={node.left} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={depth + 1} />
          <span className={`${OPERATOR_COLOR} mx-1`}>{node.op === '*' ? '×' : node.op}</span>
          <EquationNodeView node={node.right} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={depth + 1} />
        </span>
      );
    case 'power':
      return (
        <span {...common}>
          <EquationNodeView node={node.base} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={depth + 1} />
          <sup>
            <EquationNodeView node={node.exponent} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={depth + 1} />
          </sup>
        </span>
      );
    case 'sqrt':
      return (
        <span {...common}>
          <span className={OPERATOR_COLOR}>√</span>
          <span className="border-t-2 border-current pl-0.5">
            <EquationNodeView node={node.operand} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={depth + 1} />
          </span>
        </span>
      );
    case 'group':
      return (
        <span {...common}>
          <span className={OPERATOR_COLOR}>(</span>
          <EquationNodeView node={node.operand} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={depth + 1} />
          <span className={OPERATOR_COLOR}>)</span>
        </span>
      );
  }
};
