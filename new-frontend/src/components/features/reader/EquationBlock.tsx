import React, { useMemo, useRef, useState } from 'react';
import { Calculator, Sparkles, Grid3x3 } from 'lucide-react';
import { parseEquation, nodeToString, EquationNode } from '../../../services/equations/parser';
import { EquationNodeView } from './EquationNodeView';
import { api } from '../../../services/api';

interface EquationBlockProps {
  id: string;
  latex: string;
  spokenMathText: string;
}

function findNode(node: EquationNode, id: string): EquationNode | null {
  if (node.id === id) return node;
  switch (node.kind) {
    case 'binary':
      return findNode(node.left, id) || findNode(node.right, id);
    case 'unary':
    case 'group':
    case 'sqrt':
      return findNode(node.operand, id);
    case 'power':
      return findNode(node.base, id) || findNode(node.exponent, id);
    default:
      return null;
  }
}

export const EquationBlock: React.FC<EquationBlockProps> = ({ id, latex, spokenMathText }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dyscalculiaMode, setDyscalculiaMode] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const tree = useMemo(() => {
    try {
      return parseEquation(latex);
    } catch {
      return null; // honest fallback below — never crash the reader on a bad equation
    }
  }, [latex]);

  const getNodeElements = (): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>('[data-eq-node]'));
  };

  const focusNode = (nodeId: string) => {
    setSelectedId(nodeId);
    setExplanation(null);
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-eq-node="${nodeId}"]`);
    el?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const elements = getNodeElements();
    if (elements.length === 0) return;
    const currentIdx = elements.findIndex((el) => el.dataset.eqNode === selectedId);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = elements[Math.min(elements.length - 1, currentIdx + 1)] ?? elements[0];
      if (next?.dataset.eqNode) focusNode(next.dataset.eqNode);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = elements[Math.max(0, currentIdx - 1)] ?? elements[0];
      if (prev?.dataset.eqNode) focusNode(prev.dataset.eqNode);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = elements[currentIdx];
      const ancestor = current?.parentElement?.closest<HTMLElement>('[data-eq-node]');
      if (ancestor?.dataset.eqNode) focusNode(ancestor.dataset.eqNode);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = elements[currentIdx];
      const child = current?.querySelector<HTMLElement>('[data-eq-node]');
      if (child?.dataset.eqNode) focusNode(child.dataset.eqNode);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleExplain();
    }
  };

  const handleExplain = async () => {
    if (!tree || !selectedId) return;
    const node = findNode(tree, selectedId);
    if (!node) return;
    setIsExplaining(true);
    const result = await api.explainEquationPart({ fullLatex: latex, selectedPart: nodeToString(node) });
    setExplanation(result.ok ? result.value.explanation : `Explanation unavailable: ${result.error.message}`);
    setIsExplaining(false);
  };

  return (
    <div
      id={id}
      role="region"
      aria-label={`Mathematical equation: ${spokenMathText}`}
      className="p-4 my-4 bg-surface-raised border border-border rounded-xl space-y-3 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-accent">
          <Calculator className="w-4 h-4" aria-hidden="true" />
          <span>Interactive Equation — Arrow keys navigate, Enter explains</span>
        </div>
        <button
          onClick={() => setDyscalculiaMode((v) => !v)}
          aria-pressed={dyscalculiaMode}
          className={`px-2.5 py-1 text-xs font-bold rounded border flex items-center gap-1 ${
            dyscalculiaMode ? 'bg-accent text-accent-fg border-accent' : 'bg-surface text-text-primary border-border'
          }`}
        >
          <Grid3x3 className="w-3.5 h-3.5" />
          Dyscalculia Assist
        </button>
      </div>

      {tree ? (
        <div
          ref={containerRef}
          onKeyDown={handleKeyDown}
          className="font-mono text-lg p-4 bg-surface rounded-lg border border-border overflow-x-auto"
        >
          <EquationNodeView node={tree} selectedId={selectedId} dyscalculiaMode={dyscalculiaMode} depth={0} />
        </div>
      ) : (
        <div className="font-mono text-base font-bold text-text-primary p-3 bg-surface rounded-lg border border-border">
          {latex}
          <p className="text-xs text-text-secondary italic mt-1">
            (Could not parse into a navigable structure — showing as plain text.)
          </p>
        </div>
      )}

      <div className="text-xs text-text-secondary italic">
        <strong>Screen Reader Audio Equivalent:</strong> "{spokenMathText}"
      </div>

      {(explanation || isExplaining) && (
        <div role="status" className="p-3 bg-accent/10 border border-accent rounded-lg text-xs flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <span>{isExplaining ? 'Asking Dost to explain...' : explanation}</span>
        </div>
      )}
    </div>
  );
};
