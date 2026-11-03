# ADR-001: Adoção de TypeScript e Node.js em Modo Estrito

## Status
Aceito

## Contexto
O projeto NetLogix Wi-Fi é uma Prova de Conceito (PoC) de um Sistema de Detecção de Intrusão (IDS) com motor de inferência fuzzy e otimização combinatória via Algoritmo Genético Binário (BGA). O sistema manipula contratos complexos de telemetria de rede (endereços MAC, contadores de pacotes, flags TCP/802.11), matrizes de regras difusas e vetores binários de decisão.

O uso de JavaScript sem tipagem estática expõe o sistema a falhas silenciosas durante a execução de algoritmos matemáticos (ex.: conversões implícitas de `NaN`, acessos a campos inexistentes de pacotes incompletos e erros de limite em vetores binários).

## Decisão
Adotar **Node.js** como runtime de execução no backend e **TypeScript** com o compilador configurado em modo estrito (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`). 

Todos os modelos de domínio (métricas, regras de segurança, indivíduos genéticos, variáveis fuzzy) devem possuir interfaces e tipos nominais exportados em `src/domain/`.

## Alternativas Consideradas
1. **JavaScript Puro (ES2022+):** Reduziria a complexidade de build, mas eliminaria a verificação estática de tipos nos cromossomos do BGA e na matriz de regras fuzzy, aumentando drasticamente o custo de depuração de bugs lógicos.
2. **Python:** Tradicionalmente forte em computação científica e lógica fuzzy (ex.: `scikit-fuzzy`), porém introduziria arquitetura multilíngue, dificultando a distribuição de binário único e o servidor web unificado com o dashboard.

## Consequências
- **Positivas:** Detecção de erros em tempo de compilação; auto-documentação dos contratos de dados; segurança ao refatorar estruturas de regras e telemetria.
- **Negativas:** Exige etapa de compilação/transpilação via `tsc` e execução assistida por `tsx` no ambiente de desenvolvimento.
