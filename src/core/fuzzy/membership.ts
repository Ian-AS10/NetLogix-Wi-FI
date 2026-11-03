/**
 * @file membership.ts
 * Funções de pertinência difusas triangulares e trapezoidais.
 */

import { TrapezoidPoints } from '../../domain/fuzzy.js';

/**
 * Calcula o grau de pertinência mu in [0, 1] para uma função trapezoidal [a, b, c, d].
 * Trata corretamente ombro esquerdo (a == b) e ombro direito (c == d).
 */
export function trapezoidalMembership(x: number, points: TrapezoidPoints): number {
  const [a, b, c, d] = points;

  if (x <= a) {
    return a === b ? 1.0 : 0.0;
  }
  if (x >= d) {
    return c === d ? 1.0 : 0.0;
  }
  if (x >= b && x <= c) {
    return 1.0;
  }
  if (x > a && x < b) {
    return (x - a) / (b - a);
  }
  if (x > c && x < d) {
    return (d - x) / (d - c);
  }
  return 0.0;
}

/**
 * Função triangular [a, b, c], equivalente a trapezoidal [a, b, b, c].
 */
export function triangularMembership(x: number, a: number, b: number, c: number): number {
  return trapezoidalMembership(x, [a, b, b, c]);
}
