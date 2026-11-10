# 🛡️ NetLogix-Wi-Fi 

O **NetLogix-Wi-Fi** é um Sistema de Detecção e Prevenção de Intrusões (IDS/IPS) focado em redes sem fio para ambientes Windows. O projeto combina captura passiva de tráfego de rede via **TShark** com Inteligência Computacional — utilizando **Lógica Fuzzy (Mamdani)** para cálculo de risco em tempo real e **Algoritmos Genéticos Binários (BGA)** para seleção otimizada de regras defensivas —, além de integração ativa ao **Windows Defender Firewall** via PowerShell.

## 📌 Principais Funcionalidades

* 📡 **Captura Passiva de Tráfego:** Escuta de tráfego de rede Wi-Fi/Ethernet sem degradação ou injeção de pacotes via TShark.

* 🧠 **Motor de Inferência Fuzzy (Mamdani):** Avaliação dinâmica do nível de risco (0% a 100%) baseada em volume de tráfego, taxa de anomalias (RST/Deauth) e descobrimento de novos MACs.

* 🧬 **Otimização por Algoritmo Genético Binário (BGA):** Seleção inteligente do subconjunto ideal de regras defensivas que maximiza a proteção da rede sem ultrapassar o limite estipulado de recursos de CPU.

* 📊 **Baseline Guloso (Greedy):** Algoritmo comparativo para benchmarking da eficiência e tempo de resposta do BGA.

* 🧱 **Mitigação Ativa no SO (IPS):** Aplicação automática de regras no Windows Defender Firewall (`New-NetFirewallRule`) quando o risco excede o limiar seguro (40%).

* 🔄 **Expurgo Autônomo (Rollback):** Remoção automática de bloqueios de firewall (`Remove-NetFirewallRule`) assim que o risco da rede normaliza.

* ⚡ **Simulador Autônomo em Background:** Gerador de tráfego sintético alternado (80% seguro / 20% ataques) controlável via API/Dashboard para testes da suíte algorítmica.

* 🖥️ **Dashboard NOC Reativo:** Painel web interativo em React + Tailwind CSS para monitoramento de métricas, indicadores de risco, regras ativas e terminal de auditoria.

## 🛠️ Tecnologias Utilizadas

* **Backend & Servidor:** Node.js, TypeScript, Express.js.

* **Segurança & Monitoramento:** TShark (Wireshark CLI), Windows Defender Firewall, PowerShell (`child_process`).

* **Inteligência Computacional:** Lógica Fuzzy Mamdani (nativa), Algoritmo Genético Binário (BGA), Busca Gulosa (Greedy).

* **Frontend & Dashboard:** React, Vite, Tailwind CSS, Chart.js.

* **Build & Ferramentas:** ESBuild (fixado na v0.28.2), TSX (`tsx watch`).

## 🏗️ Arquitetura do Sistema

O fluxo de dados do NetLogix-Wi-Fi opera em janelas amostradoras contínuas de 5 segundos:

```
  ┌────────────────────────┐
  │ Placa de Rede / Wi-Fi  │
  └───────────┬────────────┘
              │ (Captura Passiva / TShark)
              ▼
  ┌────────────────────────┐
  │ Sniffer (Métricas 5s)  │ ──► [trafficRate, anomalyRate, newMacs]
  └───────────┬────────────┘
              ▼
  ┌────────────────────────┐
  │  Fuzzy Engine (Mamdani)│ ──► [Calcula Score de Risco 0-100%]
  └───────────┬────────────┘
              │
              ├── Risco <= 40% ──► [Tráfego Normal / Expulsa Regras do Firewall]
              │
              └── Risco > 40%
                      ▼
        ┌───────────────────────────┐
        │ BGA Optimizer (Knapsack)  │ ──► [Seleciona Regras no limite de CPU]
        └─────────────┬─────────────┘
                      ▼
        ┌───────────────────────────┐
        │ Firewall Manager          │ ──► [Executa PowerShell: New-NetFirewallRule]
        └───────────────────────────┘

```

## 📂 Estrutura de Diretórios

```
netlogix-firewall/
├── docs/adr/              # Architectural Decision Records (ADRs)
├── src/
│   ├── components/        # Componentes do Dashboard em React
│   ├── core/              # Motor do IDS e orquestração do pipeline
│   ├── domain/            # Tipos e interfaces de domínio
│   ├── fuzzy/             # Motor de Lógica Fuzzy nativo (Mamdani)
│   ├── optimization/      # Algoritmo Genético Binário (BGA) e Catalogo de Regras
│   ├── security/          # Módulos de TShark (Sniffer), Firewall (PowerShell) e Simulador
│   ├── web/               # Servidor Express, endpoints da API e public SPA
│   ├── app.ts & index.ts  # Pontos de entrada da aplicação
├── tests/                 # Suíte de testes unitários e de integração
├── package.json           # Dependências e scripts de execução
└── tsconfig.json          # Configurações do compilador TypeScript

```

## ⚙️ Requisitos do Sistema

1. **Node.js** v18 ou superior.

2. **Wireshark / TShark** instalado no Windows (geralmente localizado em `C:\Program Files\Wireshark\tshark.exe`).

3. **Privilégios de Administrador:** O terminal (Prompt de Comando ou PowerShell) **deve ser executado como Administrador** para permitir a execução de comandos `powershell` que alteram regras no Windows Defender Firewall.

## 🚀 Instalação e Execução

1. **Clone o repositório:**

   ```
   git clone https://github.com/seu-usuario/netlogix-wifi.git
   cd netlogix-wifi
   
   ```

2. **Instale as dependências:**

   ```
   npm install
   
   ```

3. **Inicie em Modo de Desenvolvimento:**
   *(Lembre-se de abrir o terminal como Administrador)*

   ```
   npm run dev
   
   ```

4. **Acesse o Dashboard:**
   Abra o navegador em `http://localhost:3000`.

5. **Executar Suíte de Testes:**

   ```
   npm test
   
   ```

## 📊 Métricas Monitoradas

| Métrica | Unidade | Janela | Descrição | 
| ----- | ----- | ----- | ----- | 
| **`trafficRate`** | Pacotes/s (pps) | 5s | Volume bruto de tráfego capturado na interface. | 
| **`anomalyRate`** | Eventos/s (eps) | 5s | Frequência de flags TCP RST ou subtipos de desautenticação 802.11. | 
| **`newMacs`** | Quantidade | 5s | Contagem de endereços MAC não vistos no histórico baseline. | 

## 📄 Decisões Arquiteturais (ADRs)

O projeto conta com documentação formal de arquitetura localizada em `docs/adr/`:

* **ADR-001:** TypeScript e Node.js em Modo Estrito

* **ADR-002:** Express.js para API REST e Servidor Web

* **ADR-003:** Captura Passiva com TShark via Processo Filho (`spawn`)

* **ADR-004:** Inferência Difusa Mamdani para Quantificação de Risco

* **ADR-005:** Algoritmo Genético Binário (BGA) e Baseline Guloso

* **ADR-006:** Aplicação Dinâmica de Regras no Windows Defender Firewall via PowerShell

* **ADR-007:** Estratégia de Janelas Amostradoras (5s) para Métrica em Tempo Real

## 👥 Colaboradores do Projeto

| Nome |  | RA | 
| ----- | ----- | ----- | 
| **Ian Araujo dos Santos** |  | 92094 | 
| **Leonardo Bezerra Gomes Pereira** |  | 94343 | 
| **Davi Kazussuke Pontes Ashihata** |  | 90613 | 
| **Victor Ferreira** |  | 55915 | 
| **Estéfany Ferreira Ramos de Cunha** |  | 60057 | 

*Projeto desenvolvido para fins acadêmicos e de pesquisa em Segurança da Informação e Inteligência Computacional.*