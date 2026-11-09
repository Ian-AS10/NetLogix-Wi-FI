# Guia de Contribuição - NetLogix-Wi-Fi

Obrigado por dedicar seu tempo para contribuir com o projeto **NetLogix-Wi-Fi**! 

Este documento estabelece as diretrizes de desenvolvimento, arquitetura e organização para que a equipe mantenha o código limpo, padronizado e funcional.

## 👥 Equipe de Desenvolvimento (Colaboradores)

Este projeto é desenvolvido e mantido pelo seguinte time:

| Nome | Função / Papel | RA |
| :--- | :--- | :--- |
| **Ian Araujo dos Santos** | 92094 |
| **Leonardo Bezerra Gomes Pereira** | 94343 |
| **Davi Kazussuke Pontes Ashihata** | 90613 |
| **Victor Ferreira** | 55915 |
| **Estéfany Ferreira Ramos de Cunha** | 60057 |

---

## 💻 Ambiente de Desenvolvimento

Para garantir que todos da equipe estejam no mesmo ambiente, siga os passos abaixo ao configurar sua máquina:

1. **Pré-requisitos:**
   - Node.js (v18+ recomendado).
   - Wireshark / TShark instalado e mapeado no `PATH` do Windows.
   - Terminal rodando com **privilégios de Administrador** (necessário para o TShark e para as integrações com o Windows Firewall via PowerShell).

2. **Instalação:**
   ```bash
   # Clone o repositório
   git clone [URL_DO_REPOSITORIO]
   cd NetLogix-Wi-FI-main
   
   # Instale as dependências (utilize o npm padrão, as correções do esbuild já estão no package.json)
   npm install
   ```

3. **Execução:**
   ```bash
   npm run dev
   ```

## 🌿 Fluxo de Trabalho e Branches

Para manter a organização do repositório, adotamos o seguinte fluxo de ramificação (Branching):

* **`main`**: Contém o código de produção estável. NUNCA faça commits diretos aqui.
* **`develop`**: Branch de integração. Todo código novo vai para cá antes da `main`.
* **Branches de Feature/Fix**: Para criar uma nova funcionalidade ou corrigir um bug, crie uma branch a partir da `develop`:
  * `feature/nome-da-feature` (ex: `feature/ajuste-motor-fuzzy`)
  * `fix/nome-do-bug` (ex: `fix/erro-esbuild`)

## 📝 Padrão de Commits

Siga o padrão de **Commits Semânticos** para facilitar a leitura do histórico do projeto:

* `feat:` - Para uma nova funcionalidade (ex: `feat: adicionado simulador automático`).
* `fix:` - Para a correção de um bug (ex: `fix: corrigido travamento do TShark`).
* `docs:` - Para alterações na documentação (ex: `docs: atualizado README e ADRs`).
* `refactor:` - Para refatoração de código que não altera o comportamento (ex: `refactor: otimizado BGA`).
* `test:` - Para adição ou alteração de testes automatizados.

## 📐 Padrões de Código (TypeScript)

* **Tipagem:** Tente evitar o uso de `any` a menos que seja estritamente necessário. Crie interfaces em `src/domain/` para estruturar os dados.
* **Arquitetura:** Mantenha a lógica de negócios separada das rotas (Express) e da interface visual (React). Utilize a pasta `src/core/` para algoritmos e `src/services/` para integrações.
* **Idioma:** O código (variáveis, funções, classes) pode ser escrito em Inglês para manter o padrão de mercado, mas comentários e documentações devem ser feitos em Português-BR para alinhamento da equipe.

---
*Documento gerado para a equipe acadêmica do projeto NetLogix-Wi-Fi.*
