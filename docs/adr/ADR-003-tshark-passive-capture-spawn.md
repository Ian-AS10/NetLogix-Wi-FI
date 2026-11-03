# ADR-003: Captura Passiva com TShark via Node.js Child Process `spawn`

## Status
Aceito

## Contexto
O IDS necessita de telemetria real de tráfego de rede para alimentar o motor de inferência. Ferramentas de captura exigem privilégios elevados (`libpcap`, `CAP_NET_RAW`, `CAP_NET_ADMIN` ou execução sob usuário com grupo `wireshark`). 

Executar chamadas de shell via interpolação de strings (ex.: `exec("tshark -i " + iface)`) abre vulnerabilidades críticas de Command Injection (CWE-78), além de risco de travamento de buffer (`stdout.maxBuffer`).

## Decisão
1. **Controle de Processo via `spawn`**: Utilizar exclusivamente `child_process.spawn('tshark', args)` passando argumentos em array sanitizado sem passar por shell intermediário (`shell: false`).
2. **Validação Estrita de Interface**: A interface informada deve passar por validação regex rígida (`^[a-zA-Z0-9_.-]{1,32}$`) antes de qualquer execução.
3. **Bufferização Contínua de Linhas**: Como o `stdout` do processo filho emite blocos (`chunks`) arbitrários de bytes, implementa-se um acumulador de buffer (`buffer += chunk; while ((idx = buffer.indexOf('\n')) !== -1) { processLine(buffer.slice(0, idx)); buffer = buffer.slice(idx + 1); }`), garantindo que campos cortados no meio não quebrem o parser.
4. **Captura Exclusivamente Passiva**: O TShark opera em modo passivo sem envio de pacotes ativos (sem escaneamento ARP ativo, sem injeção de quadros, sem desautenticação de clientes).
5. **Tratamento de Ciclo de Vida**: Registro de flags de estado (`idle`, `starting`, `capturing`, `error`), prevenção contra inicialização concorrente ou duplicada, e encerramento com `SIGTERM` seguido de `SIGKILL` em timeout caso o processo não finalize.
6. **Fallback Gracioso para Ambiente sem TShark**: Se o binário `tshark` não for encontrado (`ENOENT`), o serviço não entra em crash: registra um log de aviso informativo com instruções de instalação (`sudo apt-get install tshark`) e permite que o sistema opere em modo Simulado.

## Riscos Concretos e Mitigações
- **Permissões insuficientes no host:** TShark pode falhar com erro de captura se o usuário não pertencer ao grupo `wireshark` ou não tiver capacidade `CAP_NET_RAW`. O serviço intercepta `stderr`, formata a mensagem amigavelmente para o dashboard e evita loop de reconexão.
- **Processos órfãos (Zombies):** Tratados no evento `beforeExit`, `SIGINT` e `SIGTERM` do Node.js, matando explicitamente o PID do processo filho.
