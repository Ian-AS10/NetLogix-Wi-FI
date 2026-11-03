# ADR-007: Estratégia de Métricas e Janelas de Coleta

## Status
Aceito

## Contexto
O cálculo de métricas em IDS exige definições precisas de unidades, base temporal e aproximações físicas. Tratar pacotes indistintamente como "conexões estabelecidas" ou assumir que pacotes TCP RST sempre significam "falha de autenticação" são erros conceituais graves de engenharia de segurança que desacreditam o sistema.

## Decisão
Padronizar a telemetria sob uma janela temporal deslizante de **5 segundos** (configurável via `SAMPLING_WINDOW_SEC` no arquivo `.env` / `config`).

### Tabela Formal de Métricas

| Métrica | Identificador | Unidade | Período | Origem no TShark / Simulação | Regra de Cálculo | Limitações Conhecidas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Taxa de Tráfego** | `trafficRate` | Pacotes por segundo (pps) | Janela de 5s | Contador de quadros IP/Ethernet (`frame.number`, `frame.len`) | $\frac{\text{Total de Pacotes na Janela}}{\text{Duração da Janela (s)}}$ | Não diferencia tráfego volumétrico legítimo (backup, streaming de vídeo 4K) de ataques de negação de serviço (DoS/DDoS) sem inspeção L4/L7. |
| **Taxa de Anomalia/Resets** | `anomalyRate` | Eventos por segundo (eps) | Janela de 5s | Flags TCP RST (`tcp.flags.reset == 1`) e quadros 802.11 Deauth/Disassoc (`wlan.fc.type_subtype in [10, 12]`) | $\frac{\text{Contagem de (TCP RST + Deauth)}}{\text{Duração da Janela (s)}}$ | TCP RST pode decorrer de encerramento abrupto legítimo de socket ou portas fechadas em conexões comuns; quadros 802.11 Deauth exigem placa em modo monitor (`monitor mode`) para captura passiva real no ar. |
| **Novos Endereços MAC** | `newMacs` | Quantidade de MACs únicos | Janela de 5s | Endereço MAC de origem (`eth.src` ou `wlan.sa`) comparado contra cache LRU de dispositivos conhecidos (TTL 10 min) | $|\text{MACs novos na janela}| - |\text{MACs previamente registrados}|$ | Dispositivos modernos usam MAC Randomization (iOS/Android/Windows) ao escanear redes; não indica necessariamente invasão sem análise de OUI ou beacon. |

### Justificativas Técnicas e Evitação de Erros
1. **Pacotes vs. Conexões:** Um único fluxo TCP gera múltiplos pacotes (SYN, SYN-ACK, ACK, dados, FIN, RST). A métrica é explicitamente denominada **Taxa de Pacotes (pps)** e nunca tratada como "sessões ativas".
2. **TCP Reset vs. Falha de Autenticação:** A métrica é formalmente categorizada como **Indicador de Anomalia / Reset Rate (eps)**. Em tráfego passivo padrão Ethernet/Wi-Fi não criptografado ou em nível de enlace, a aplicação não tem acesso ao payload de credenciais (WPA2/3 4-way handshake ou TLS ClientHello/Alerts) sem decifração prévia. Portanto, nomear a métrica como taxa de anomalias/resets reflete com fidelidade o dado real observado.
