# NetLogix Wi-Fi — Monitoramento Passivo & Otimização de Defesas

Prova de Conceito (PoC) de um Sistema de Detecção de Intrusão (IDS) para monitoramento de rede sem fio com análise de risco difusa (Fuzzy Logic Mamdani) e otimização multiobjetivo de regras de defesa via Algoritmo Genético Binário (BGA) comparado a um Baseline Guloso determinístico.

---

## 1. Visão Geral da Arquitetura

O sistema opera de forma desacoplada em três camadas:

1. **Camada de Coleta & Telemetria:**
   - **TShark Passivo (`spawn`):** Coleta em tempo real de quadros de rede via processo filho sem shell (`shell: false`). Extrai timestamps, comprimentos de quadro, flags TCP (RST, SYN), subtipos de controle/gerenciamento 802.11 (Deauth/Disassoc) e endereços MAC.
   - **Modo Simulado Integrado:** Gerador sintético de tráfego com 4 cenários predefinidos (*Normal*, *SYN Flood / DoS*, *802.11 Deauth Burst*, *MAC Spoofing*) para testes completos mesmo sem o binário do TShark instalado.

2. **Camada de Inteligência & Algoritmos:**
   - **Motor de Inferência Difuso Mamdani:** Avalia 3 variáveis de entrada (`trafficRate` em pps, `anomalyRate` em eps e `newMacs` em qtd), aplicando uma base de 27 regras e defuzzificação contínua via Centro de Gravidade (Centróide) para calcular o Score de Risco de 0 a 100.
   - **Otimizador BGA (Algoritmo Genético Binário):** Seleciona um subconjunto ótimo de regras defensivas considerando cobertura de risco com retornos decrescentes, restrição orçamentária rígida de CPU e teto máximo de falso positivo.
   - **Baseline Guloso Determinístico:** Avalia marginalmente a melhor relação benefício/custo ($\Delta \text{Aptidão} / \text{Custo CPU}$) para permitir comparação direta de tempo de execução e qualidade de solução frente ao BGA.

3. **Camada de Apresentação & API:**
   - **API Express.js:** Endpoints REST estruturados para controle de ciclo de vida (`/api/status`, `/api/capture/*`, `/api/simulate/*`, `/api/metrics/*`, `/api/optimizer/*`, `/api/rules`, `/api/interfaces`, `/api/logs`).
   - **Dashboard NOC Reativo:** Desenvolvido em React + Tailwind CSS + Chart.js, com gauge SVG dinâmico, gráficos temporais de risco e tráfego, terminal de logs de auditoria e deck de controle.

---

## 2. Requisitos e Permissões do TShark

Para executar a captura real no ambiente local de produção:
- **TShark** (versão 3.x ou 4.x do Wireshark CLI).
- No Linux (Debian/Ubuntu):
  ```bash
  sudo apt-get update && sudo apt-get install -y tshark
  ```
- **Permissões de Captura Passiva:**
  Para capturar sem necessidade de rodar a aplicação web como `root`:
  ```bash
  sudo usermod -a -G wireshark $USER
  sudo setcap cap_net_raw,cap_net_admin+eip $(which tshark)
  ```
- Caso o TShark não esteja instalado, o sistema automaticamente sinaliza no painel e opera no **Modo Simulado**, permitindo validar todos os algoritmos sem dependências externas de sistema operacional.

---

## 3. Instalação e Execução

### Instalação de Dependências
```bash
npm install
```

### Modo de Desenvolvimento (Full-Stack)
Inicia o servidor Express integrado ao Vite middleware na porta 3000:
```bash
npm run dev
```
Acesse o dashboard em: `http://localhost:3000`

### Execução de Testes Automatizados
Executa a suíte de testes unitários e de integração com o executor nativo do Node.js (`node:test` e `tsx`):
```bash
npm test
```

### Build de Produção
```bash
npm run build
npm start
```

---

## 4. Tabela de Métricas e Unidades

| Métrica | Unidade | Janela Amostral | Origem | Cálculo |
| :--- | :--- | :--- | :--- | :--- |
| **Taxa de Tráfego** (`trafficRate`) | Pacotes/segundo (pps) | 5s | Quadros Ethernet/IP | $\text{Total Pacotes na Janela} / 5$ |
| **Taxa de Anomalias/Resets** (`anomalyRate`) | Eventos/segundo (eps) | 5s | TCP RST + 802.11 Deauth/Disassoc | $\text{Contagem Eventos} / 5$ |
| **Novos Endereços MAC** (`newMacs`) | Quantidade (disp) | 5s | `eth.src` e `wlan.sa` | MACs novos comparados ao cache LRU |

*Nota: Em conformidade com o ADR-007, a métrica de TCP Resets é categorizada estritamente como Anomalia/Resets e não como "falha de autenticação", refletindo a física real do dado observado.*

---

## 5. Limites da Prova de Conceito (PoC)

- **Modo Exclusivamente Consultivo (Advisory Mode):** O NetLogix PoC recomenda contramedidas ideais calculadas pelo BGA, mas **não aplica bloqueios ativos no firewall do sistema operacional** (sem alterações em `iptables`, `nftables` ou roteadores).
- **Estimativas de CPU e Falsos Positivos:** Os valores atribuídos às 10 regras de segurança do catálogo são estimativas heurísticas de projeto acadêmico/laboratorial para validação do algoritmo combinatório e não constituem medições de bancada em hardware de telecomunicações.

---

## 6. Registro de Decisões Arquiteturais (ADRs)

Documentação completa das decisões disponível em `docs/adr/`:
- `ADR-001`: Adoção de TypeScript e Node.js em Modo Estrito
- `ADR-002`: Express.js para API REST e Entrega do Dashboard
- `ADR-003`: Captura Passiva com TShark via Node.js Child Process `spawn`
- `ADR-004`: Arquitetura do Motor de Inferência Fuzzy Mamdani
- `ADR-005`: Algoritmo Genético Binário (BGA) e Baseline Guloso
- `ADR-006`: Segurança Local e Ausência de Bloqueio Automático
- `ADR-007`: Estratégia de Métricas e Janelas de Coleta
