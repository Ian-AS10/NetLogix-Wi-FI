🛡️ NetLogix Wi-Fi

O NetLogix Wi-Fi é um Sistema de Detecção e Prevenção de Intrusão (IDS/IPS) construído como Prova de Conceito (PoC). O projeto é focado em proteger roteadores de borda (dispositivos com pouca memória e CPU) utilizando técnicas avançadas de Inteligência Computacional.

Ao invés de ligar todas as regras de firewall de uma vez e derrubar a rede, o sistema combina Lógica Fuzzy para análise de risco em tempo real e um Algoritmo Genético Binário (BGA) para escolher o melhor conjunto de regras defensivas sem estourar os limites de hardware.

✨ Principais Funcionalidades

Captura de Rede Real (TShark): Integração via Node.js com o Wireshark/TShark para inspecionar pacotes em tempo real, calculando taxa de conexões, falhas de autenticação (TCP Reset) e detectando novos MAC Addresses.

Motor de Inferência Fuzzy: Avalia as métricas de rede e gera um Score de Risco (0 a 100) simulando o raciocínio humano.

Otimização Metaheurística: Utiliza um Algoritmo Genético Binário em comparação com um Baseline Guloso para resolver o problema da mochila (Knapsack Problem) na ativação de regras de segurança sob restrição de CPU.

Dashboard Analítico Web: Interface rica construída com Express.js e Chart.js contendo:

Gráficos de risco em tempo real.

Terminal interativo de logs de captura de pacotes.

Simulador manual para injeção de ataques (DoS, Brute Force, MAC Spoofing).

Gerador de tráfego "fantasma" automático para testes sem necessidade de tráfego real.

🧩 Arquitetura

O projeto foi estruturado em um Monolito Modular utilizando Node.js e TypeScript, aplicando padrões de projeto como Strategy e Observer.

graph TD;
    A[Tráfego de Rede / TShark] -->|Métricas| B(Módulo Fuzzy)
    B -->|Score de Risco| C{Defense Manager}
    C -->|Aciona| D[Otimizador Genético / Guloso]
    D -->|Filtra Regras por CPU| C
    C -->|Ativa Defesa| E[Painel Web / API]
    F[Simulador Manual] -->|Injeta Ataque| C


🚀 Como Executar o Projeto

Pré-requisitos

Node.js instalado (v18 ou superior).

Wireshark / TShark instalados na sua máquina.

Importante para Windows: Certifique-se de que a pasta de instalação do Wireshark (ex: C:\Program Files\Wireshark) está adicionada às Variáveis de Ambiente (PATH) do seu sistema.

Instalação

Clone este repositório ou extraia os arquivos.

Abra o terminal na pasta raiz do projeto.

Instale as dependências:

npm install


Iniciando a Aplicação

Como a aplicação precisa interagir com a placa de rede física, é necessário rodar o terminal com privilégios de Administrador (Windows) ou utilizando sudo (Linux/Mac).

No terminal como Administrador, inicie o modo de desenvolvimento:

npm run dev


Abra o seu navegador e acesse: http://localhost:3000

Usando a Captura de Rede Real

Antes de ligar a captura no Dashboard, descubra o número da sua placa de rede executando no terminal:

tshark -D


Identifique a sua placa (ex: Wi-Fi ou número 1, 4, etc.).

Insira esse valor no campo Interface do Dashboard e ligue o interruptor de captura.

🛠️ Tecnologias Utilizadas

Backend: Node.js, TypeScript, Express.js

Frontend: HTML5, CSS3, Chart.js

Segurança & Redes: TShark (Wireshark CLI)

Engenharia de Software: Jest (Testes), GitHub Actions (CI/CD)

👥 Contribuições

Consulte o arquivo CONTRIBUTING.md para as diretrizes.
Liderado e mantido por Ian Araújo dos Santos.

📄 Licença: MIT
