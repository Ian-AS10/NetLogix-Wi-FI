# ADR-006: Segurança Local e Ausência de Bloqueio Automático

## Status
Aceito

## Contexto
O NetLogix Wi-Fi é uma Prova de Conceito (PoC) de IDS e otimizador de políticas defensivas. Executar alterações ativas em regras de firewall de sistema operacional (ex.: `iptables`, `nftables`, `pf` ou comandos SSH em roteadores OpenWrt) sem mecanismos maduros de consenso, rollback atômico e autenticação mútua apresenta riscos severos:
1. Interrupção acidental do acesso de rede do próprio operador (Self-Denial of Service).
2. Elevação desnecessária de privilégios (`root`/`sudo`) para a aplicação Express inteira.
3. Risco de segurança no caso de vulnerabilidades na API web permitirem a um invasor reconfigurar o firewall do host.

## Decisão
1. **Modo Exclusivamente de Monitoramento e Recomendação (Advisory/Passive Mode):** O sistema não executa comandos de bloqueio no sistema operacional ou em roteadores. O painel e a API deixam explícito que as regras estão selecionadas apenas para auditoria e recomendação analítica.
2. **Escuta Restrita em Loopback (`127.0.0.1`):** Por padrão, o Express faz bind em `127.0.0.1` (ou na variável de ambiente controlada `HOST`), impedindo que outros dispositivos na rede local acessem os endpoints de controle sem autorização.
3. **Ausência de Segredos e Sanitização de Respostas:** Mensagens de erro nunca expõem stack traces, caminhos absolutos do sistema operacional ou dumps de memória em produção.
4. **Trilhas para Futura Expansão em Rede Aberta:** Caso o sistema seja futuramente implantado em rede corporativa para acesso remoto:
   - Deverá ser implementado mTLS ou camada de autenticação robusta (OAuth2 / JWT com tokens com expiração curta).
   - Implementação de Rate Limiting via middleware (`express-rate-limit`).
   - Módulo de isolamento com privilégios reduzidos (daemon separado de controle de firewall com permissão de rollback automático após heartbeat expirado).

## Consequências
- **Positivas:** Operação segura em qualquer ambiente de desenvolvimento ou laboratório; sem risco de corte de conectividade; aderência a princípios de menor privilégio.
- **Negativas:** Não atua como IPS (Intrusion Prevention System) ativo nesta versão.
