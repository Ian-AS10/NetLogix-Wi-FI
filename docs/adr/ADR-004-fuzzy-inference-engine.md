# ADR-004: Arquitetura do Motor de Inferência Fuzzy Mamdani

## Status
Aceito

## Contexto
A avaliação do estado de risco de uma rede sem fio não pode depender apenas de limiares booleanos rígidos (ex.: `tráfego > 1000 pps = ataque`), pois variações naturais de carga geram falsos alarmes ou omissões em situações limítrofes. A lógica difusa (fuzzy logic) permite modelar a incerteza inerente à telemetria de tráfego, graduando a pertinência de cada indicador.

## Decisão
Implementar um motor de inferência difuso Mamdani puro e desacoplado em `src/core/fuzzy/`, sem dependências externas de bibliotecas, garantindo controle total sobre o modelo matemático:

### 1. Variáveis Linguísticas de Entrada (Universos de Discurso)
- **Taxa de Tráfego (`trafficRate` - pacotes por segundo - pps):**
  - Universo: $[0, 5000]$ pps.
  - Conjuntos: *Baixo* (Trapézio $[0, 0, 100, 400]$), *Médio* (Triângulo $[200, 600, 1500]$), *Alto* (Trapézio $[1000, 2500, 5000, 5000]$).
- **Indicador de Anomalia/Resets (`anomalyRate` - eventos por segundo):**
  - Universo: $[0, 200]$ eps (combinação de pacotes TCP RST + 802.11 Deauth/Disassoc frames observados).
  - Conjuntos: *Normal* (Trapézio $[0, 0, 5, 20]$), *Suspeito* (Triângulo $[10, 30, 80]$), *Crítico* (Trapézio $[50, 100, 200, 200]$).
- **Novos Endereços MAC (`newMacs` - quantidade na janela de 5s):**
  - Universo: $[0, 50]$ novos dispositivos.
  - Conjuntos: *Estável* (Trapézio $[0, 0, 1, 3]$), *Moderado* (Triângulo $[2, 5, 12]$), *Elevado* (Trapézio $[8, 20, 50, 50]$).

### 2. Variável Linguística de Saída
- **Score de Risco (`riskScore`):**
  - Universo: $[0, 100]$ pontos.
  - Conjuntos: *Muito Baixo* ($[0, 0, 15, 25]$), *Baixo* ($[15, 30, 45]$), *Médio* ($[35, 50, 65]$), *Alto* ($[55, 70, 85]$), *Crítico* ($[75, 88, 100, 100]$).

### 3. Operadores e Inferência
- **T-norma (Conjunção AND):** Mínimo ($\min(\mu_A, \mu_B, \mu_C)$).
- **Implicação:** Mamdani clipping (corte do topo do conjunto de saída pelo firing strength $\alpha$).
- **S-norma (Agregação de Regras):** Máximo ($\max_i(\mu_{R_i}(y))$).
- **Defuzzificação:** Centro de Gravidade / Centróide contínuo discretizado em 100 pontos:
  $$y^* = \frac{\sum_{i=1}^N y_i \cdot \mu(y_i)}{\sum_{i=1}^N \mu(y_i)}$$
  Caso nenhuma regra ative ($\sum \mu = 0$), o sistema assume de forma segura o valor padrão de risco basal ($0$).

## Alternativas Consideradas
- **Sugeno (TSK):** Gera saídas lineares ou constantes com menor custo de defuzzificação, mas o modelo Mamdani oferece interpretabilidade intuitiva para operadores de segurança de rede (classificação qualitativa de risco com curvas sobrepostas).
- **Lógica Booleana Ponderada:** Não trata transições graduais entre normalidade e ataque, gerando oscilações espúrias no dashboard.

## Consequências
- **Positivas:** Saída contínua e suave de 0 a 100; facilidade de auditoria e ajuste dos conjuntos fuzzy; cobertura total de casos limítrofes e entradas clamped.
- **Negativas:** Exige testes unitários exaustivos cobrindo as 27 combinações da matriz de regras e valores fora de escala.
