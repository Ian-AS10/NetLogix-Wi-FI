/**
 * @file prng.ts
 * Gerador de números pseudoaleatórios determinístico (Mulberry32)
 * Permite reproduzir com precisão testes de algoritmos genéticos e simulação.
 */

export class PRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
  }

  /**
   * Retorna um número pseudoaleatório entre 0 (inclusive) e 1 (exclusive).
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Retorna um inteiro no intervalo [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Retorna um booleano de acordo com a probabilidade informada.
   */
  public chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Reinicia a semente interna.
   */
  public reset(seed: number): void {
    this.state = seed >>> 0;
  }
}
