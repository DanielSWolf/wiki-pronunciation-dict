import { ReactNode } from 'react';

export function joinNodes(nodes: ReactNode[], separator: ReactNode): ReactNode {
  const result: ReactNode[] = [];
  for (const node of nodes) {
    if (result.length > 0) result.push(separator);
    result.push(node);
  }
  return result;
}
