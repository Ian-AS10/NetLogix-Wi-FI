# ADR-005: Algoritmo Genético Binário (BGA) e Baseline Guloso

## Status
Aceito

## Contexto
Quando o motor fuzzy detecta elevação no score de risco, o IDS deve recomendar um subconjunto de regras ativas a partir de um catálogo pré-configurado de contramedidas de rede. No entanto, habilitar todas as regras de segurança simultaneamente sobrecarregaria a CPU de um roteador/dispositivo de borda e elevaria inaceitavelmente a taxa agregada de falsos positivos (bloqueando conexões legítimas de usuários).

Trata-se de uma variante do problema da mochila multidimensional (0-1 Multidimensional Knapsack Problem), com objetivo multiobjetivo de maximização de cobertura de risco e minimização de custo de CPU e falso positivo.

## Decisão
Implementar dois algoritmos que operam sob a **mesma base de regras**, os **mesmos parâmetros de risco** e as **mesmas restrições operacionais**:

### 1. Representação e Restrições Globais
- **Cromossomo / Solução:** Vetor binário $\vec{x} \in \{0, 1\}^N$, onde $x_i = 1$ indica que a regra $i$ está ativada.
- **Restrição de CPU Total:** $\sum_{i=1}^N x_i \cdot \text{cpuCost}_i \le \text{MaxCPU}$ (padrão: 80% do orçamento do gateway).
- **Restrição de Falso Positivo Agregado:** Calculada sobre o conjunto selecionado:
  $$\text{FPAgregado} = 1 - \prod_{i \mid x_i=1} (1 - \text{fpRate}_i) \le \text{MaxFP}$$
  *(Em vez de soma ingênua que pode superar 100%, modela-se como probabilidade complementar de ao menos uma regra disparar falso positivo em tráfego limpo).*
- **Incompatibilidades e Pré-requisitos:** Se a regra $A$ exige a regra $B$, $x_A=1 \implies x_B=1$. Se $A$ conflita com $C$, $x_A + x_C \le 1$.

### 2. Algoritmo Genético Binário (BGA)
- **Função de Fitness:**
  $$\text{Fitness}(\vec{x}) = \text{CoberturaEfetiva}(\vec{x}) - \lambda_1 \cdot \frac{\text{CPU}(\vec{x})}{\text{MaxCPU}} - \lambda_2 \cdot \frac{\text{FP}(\vec{x})}{\text{MaxFP}} - \text{Penalidade}(\vec{x})$$
- **Tratamento de Sobreposição/Cobertura Duplicada:** A cobertura efetiva não é a soma cega das coberturas. Para cada tipo de ameaça coberta ($T \in \{\text{Flood}, \text{Scan}, \text{Deauth}, \text{Spoofing}\}$), a cobertura conjunta usa saturação de retornos decrescentes:
  $$\text{Cobertura}_T = 1 - \prod_{i \mid x_i=1, T \in \text{Threats}_i} (1 - \text{threatCoverage}_{i, T})$$
  Isso impede que selecionar 3 regras idênticas para a mesma ameaça infle artificialmente o fitness.
- **Operadores Genéticos:**
  - Seleção por Torneio (tamanho $k=3$).
  - Cruzamento de Ponto Único (taxa $p_c = 0.85$).
  - Mutação bit-flip adaptativa ($p_m = 1/N$).
  - Elitismo preservando os 2 melhores indivíduos.
  - Semente pseudoaleatória configurável (Linear Congruential Generator / Mulberry32) para garantir testes determinísticos e reprodutíveis.
  - Estratégia de Reparação/Penalidade para indivíduos que violam as restrições de CPU ou FP máximo.

### 3. Baseline Guloso (Greedy Heuristic)
- Algoritmo determinístico que calcula para cada regra não ativada o ganho marginal de aptidão dividido pelo seu custo marginal de CPU:
  $$\text{Ratio}_i = \frac{\Delta \text{CoberturaEfetiva}(i)}{\text{cpuCost}_i + \epsilon}$$
- Ordena as regras por essa razão e adiciona sequencialmente as regras enquanto as restrições globais de CPU e Falso Positivo Agregado não forem violadas.

### 4. Protocolo Justo de Comparação
Ambos os algoritmos recebem a mesma entrada exata (catálogo, orçamento de CPU, teto de FP, score de risco). O dashboard expõe métricas idênticas:
1. Cobertura efetiva (%)
2. Custo de CPU (%)
3. Falso positivo agregado (%)
4. Tempo de execução em milissegundos (medido com `performance.now()`)
5. Conjunto de IDs selecionados

## Consequências
- Fica explícito na documentação que o baseline guloso é extremamente rápido e pode atingir soluções ótimas em instâncias pequenas (ex.: $N \le 10$). O BGA demonstra vantagem em instâncias com restrições não lineares e incompatibilidades cruzadas, explorando combinações que o guloso descarta por avaliação míope.
