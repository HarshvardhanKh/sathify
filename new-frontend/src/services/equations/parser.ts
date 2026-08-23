/**
 * A real (if deliberately small) recursive-descent parser for basic
 * algebraic expressions — NOT Gemini-dependent, per the master prompt's
 * explicit rule that equation STRUCTURE must come from a real parser, with
 * Gemini only used (optionally, via the backend) to EXPLAIN a selected
 * part. Supports: numbers, variables, + - * / ^, unary minus, ± , sqrt(...),
 * and parentheses. Not a full LaTeX engine — a pragmatic subset sufficient
 * for the quadratic-formula-style examples this feature targets.
 */

export type EquationNode =
  | { kind: 'number'; id: string; value: string }
  | { kind: 'variable'; id: string; value: string }
  | { kind: 'binary'; id: string; op: '+' | '-' | '*' | '/' | '±'; left: EquationNode; right: EquationNode }
  | { kind: 'unary'; id: string; op: '-'; operand: EquationNode }
  | { kind: 'power'; id: string; base: EquationNode; exponent: EquationNode }
  | { kind: 'sqrt'; id: string; operand: EquationNode }
  | { kind: 'group'; id: string; operand: EquationNode };

let nodeCounter = 0;
function nextId(): string {
  nodeCounter += 1;
  return `eq-node-${nodeCounter}`;
}

type Token = { type: 'num' | 'ident' | 'op' | 'lparen' | 'rparen' | 'sqrt'; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.replace(/√/g, 'sqrt ').replace(/\\pm|±/g, ' ± ');

  while (i < src.length) {
    const c = src[i];
    if (c === undefined) break;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j] ?? '')) j++;
      tokens.push({ type: 'num', value: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z]/.test(src[j] ?? '')) j++;
      const word = src.slice(i, j);
      if (word === 'sqrt') {
        tokens.push({ type: 'sqrt', value: word });
      } else {
        tokens.push({ type: 'ident', value: word });
      }
      i = j;
      continue;
    }
    if (c === '(') {
      tokens.push({ type: 'lparen', value: c });
      i++;
      continue;
    }
    if (c === ')') {
      tokens.push({ type: 'rparen', value: c });
      i++;
      continue;
    }
    if ('+-*/^±'.includes(c)) {
      tokens.push({ type: 'op', value: c });
      i++;
      continue;
    }
    // Unrecognized character — skip it rather than throw, keeps parsing resilient.
    i++;
  }
  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token | undefined {
    return this.tokens[this.pos++];
  }

  parseExpression(): EquationNode {
    let left = this.parseTerm();
    while (this.peek()?.type === 'op' && ['+', '-', '±'].includes(this.peek()!.value)) {
      const op = this.consume()!.value as '+' | '-' | '±';
      const right = this.parseTerm();
      left = { kind: 'binary', id: nextId(), op, left, right };
    }
    return left;
  }

  private parseTerm(): EquationNode {
    let left = this.parseFactor();
    while (this.peek()?.type === 'op' && ['*', '/'].includes(this.peek()!.value)) {
      const op = this.consume()!.value as '*' | '/';
      const right = this.parseFactor();
      left = { kind: 'binary', id: nextId(), op, left, right };
    }
    return left;
  }

  private parseFactor(): EquationNode {
    if (this.peek()?.type === 'op' && this.peek()!.value === '-') {
      this.consume();
      return { kind: 'unary', id: nextId(), op: '-', operand: this.parseFactor() };
    }
    return this.parsePower();
  }

  private parsePower(): EquationNode {
    const base = this.parseAtom();
    if (this.peek()?.type === 'op' && this.peek()!.value === '^') {
      this.consume();
      const exponent = this.parseFactor();
      return { kind: 'power', id: nextId(), base, exponent };
    }
    return base;
  }

  private parseAtom(): EquationNode {
    const token = this.peek();
    if (!token) return { kind: 'number', id: nextId(), value: '' };

    if (token.type === 'num') {
      this.consume();
      return { kind: 'number', id: nextId(), value: token.value };
    }
    if (token.type === 'ident') {
      this.consume();
      return { kind: 'variable', id: nextId(), value: token.value };
    }
    if (token.type === 'sqrt') {
      this.consume();
      return { kind: 'sqrt', id: nextId(), operand: this.parseFactor() };
    }
    if (token.type === 'lparen') {
      this.consume();
      const inner = this.parseExpression();
      if (this.peek()?.type === 'rparen') this.consume();
      return { kind: 'group', id: nextId(), operand: inner };
    }
    // Unexpected token — consume it and return a placeholder rather than throwing.
    this.consume();
    return { kind: 'variable', id: nextId(), value: token.value };
  }
}

export function parseEquation(input: string): EquationNode {
  nodeCounter = 0; // deterministic ids per parse call
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  return parser.parseExpression();
}

/** Render a node subtree back to a flat string — used for the "selected
 * part" text sent to the backend's explain endpoint. */
export function nodeToString(node: EquationNode): string {
  switch (node.kind) {
    case 'number':
    case 'variable':
      return node.value;
    case 'binary':
      return `${nodeToString(node.left)} ${node.op} ${nodeToString(node.right)}`;
    case 'unary':
      return `-${nodeToString(node.operand)}`;
    case 'power':
      return `${nodeToString(node.base)}^${nodeToString(node.exponent)}`;
    case 'sqrt':
      return `sqrt(${nodeToString(node.operand)})`;
    case 'group':
      return `(${nodeToString(node.operand)})`;
  }
}
