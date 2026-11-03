# ADR-002: Express.js para API REST e Entrega do Dashboard

## Status
Aceito

## Contexto
O NetLogix Wi-Fi precisa expor endpoints para controle do ciclo de vida da captura (iniciar, parar, consultar estado), injeção de telemetria simulada, consulta de regras recomendadas e entrega dos assets do frontend (dashboard NOC).

A PoC precisa de um servidor HTTP estável, leve, com baixo overhead e suporte consolidado a middlewares de tratamento de erros, validação de payload e integração com o Vite em modo desenvolvimento e distribuição de arquivos estáticos em produção.

## Decisão
Utilizar **Express.js (v4.x)** estruturado de forma desacoplada:
- `src/app.ts`: Configuração declarativa de middlewares (JSON body parser com limite de 100kb, CORS local restrito, tratamento de erros 404 e 500 sem stack trace em respostas).
- `src/server.ts`: Inicialização do listener HTTP, integração com Vite middleware em desenvolvimento e orquestração de graceful shutdown (SIGINT/SIGTERM) para encerrar processos filhos e timers.

O Express atua estritamente como camada de transporte HTTP, delegando toda lógica de negócio aos serviços em `src/services/` e motores em `src/core/`.

## Alternativas Consideradas
1. **Fastify:** Oferece maior throughput e validação JSON Schema nativa, porém a maturidade do ecossistema Express e a integração direta com Vite middleware tornam o Express mais direto para o escopo desta PoC.
2. **WebSocket dedicado (ws / socket.io):** Ideal para streaming contínuo a 60Hz, porém a janela de amostragem do IDS é de 5 segundos. O padrão REST com polling regular (1s a 3s) atende plenamente ao requisito do dashboard sem complexidade de reconexão e handshake WS.

## Consequências
- **Positivas:** Arquitetura desacoplada e facilmente testável com mocks HTTP; facilidade na adição de rotas; graceful shutdown direto.
- **Negativas:** Requer disciplina estrita na separação entre controladores e serviços para evitar que regras de negócio vazem para o Express.
