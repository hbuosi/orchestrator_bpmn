# DGE Service Orchestrator — Guia do Especialista

> Guia em português para entender e explicar o sistema como especialista em design de serviços públicos.

---

## O que é o DGE Service Orchestrator?

É uma plataforma que transforma a descrição de um serviço público (em texto simples ou planilha) em documentação técnica completa — automaticamente, usando Inteligência Artificial (Claude da Anthropic).

O sistema segue o **Business Service Design Framework v2.6** do Abu Dhabi DGE (Departamento de Governo e Transformação Digital), que é a metodologia oficial para desenhar, documentar e preparar serviços públicos para automação.

---

## Os três modos de geração

### Modo 1 — Service Card + BPMN
> Modo legado, mantido para uso rápido.

Gera dois documentos combinados em um único visualizador:
- **Service Card**: ficha técnica do serviço no padrão UAE TDRA (código, nome em inglês e árabe, critérios de elegibilidade, documentos exigidos, taxas, SLA, base legal etc.)
- **Diagrama BPMN 2.0**: fluxo do processo com cores semânticas (verde = fluxo feliz, laranja = exceção, vermelho = cancelamento, roxo = tarefa humana, azul = gateway de decisão)

**Quando usar**: demonstrações rápidas, prototipagem inicial, quando não precisa do framework completo.

---

### Modo 2 — Full Manifest — Single Pass
### Modo 3 — Full Manifest — Stage by Stage

Ambos geram o **Service Manifest completo** seguindo o Business Service Design Framework v2.6.  
A diferença está em *como* a IA gera e *como* o usuário interage com o resultado.

---

## O que é o Service Manifest v2.6?

O Service Manifest é o **documento-mestre de um serviço público**. Ele substitui 4 a 7 documentos separados que antes existiam no framework v2.5 por um único artefato com **27 seções numeradas**, divididas em 4 estágios.

Cada estágio tem um objetivo claro e um gate de revisão antes de avançar para o próximo.

```
Stage 0 → Stage 1 → Stage 2 → Stage 3
  §1–7     §8–13    §14–22    §23–27
Definir   Desenhar  Modelar   Construir
```

---

## Os 4 Estágios em detalhe

### Stage 0 — Service Definition (§1–7)
**Cor**: Verde (`#2E7D32`)  
**Objetivo**: Definir o quê o serviço é antes de qualquer decisão de design.

| Seção | Conteúdo |
|-------|----------|
| §1 | **Service Identification** — Código do serviço (ex: `DGE-BL-001`), nome em inglês e árabe, categoria, entidade responsável, gatilho de entrada, resultado esperado, escopo (o que está dentro e fora) |
| §2 | **Customer Journey Context** — Em qual fase da jornada do cidadão esse serviço se encaixa, serviço anterior e posterior, pontos de contato (touchpoints), pontos de dor (pain points) |
| §3 | **Capability Reuse Search** — Pesquisa se já existe uma capacidade parecida no portfólio do governo (para evitar duplicar serviços). Decisão: consumir existente, fazer fork ou criar novo |
| §4 | **Demand & Capacity Profile** — Volume anual estimado, períodos de pico, canais de entrega (online, app, presencial, call center), capacidade atual |
| §6 | **Data Inventory** — Inventário de dados: quais elementos de dado o serviço cria, lê, atualiza ou exclui (CRUD), classificação de sensibilidade e tempo de retenção |
| §7 | **Stakeholder & Persona Map** — Mapa de papéis: quem aprova, quem revisa, quem é informado, quem opera o serviço e em qual organização |

**Gate de revisão Stage 0**: "O serviço está bem definido? Temos clareza de escopo, demanda e partes interessadas?"

---

### Stage 1 — Service Design (§8–13)
**Cor**: Azul (`#1565C0`)  
**Objetivo**: Decidir a arquitetura do serviço e definir as metas de desempenho.

| Seção | Conteúdo |
|-------|----------|
| §8 | **Decomposition Decision** — Qual é o arquétipo do serviço? **Capability** (faz uma coisa do início ao fim), **Composite** (agrupa múltiplas capacidades em sequência) ou **Orchestrating** (chama outros serviços, nunca executa trabalho direto). Inclui smell tests (testes de fronteira) e log de decisões |
| §9 | **Service Boundary & Interfaces** — Entradas (inputs), saídas (outputs) e serviços que são chamados (com padrão de cascata: sequencial, paralelo ou pré-existente) |
| §10 | **Value Stream & Customer Journey** — Fases da cadeia de valor do ponto de vista do cliente e do serviço (3 a 7 fases) |
| §11 | **Experience & Outcome Targets** — SLA declarado vs. SLA calculado (com aritmética de cascata de OLAs), variância e justificativa se houver desvio |
| §12 | **Audit & Regulatory Drivers** — Quais etapas do processo exigem evidência para auditoria, qual regulação ou política se aplica e por quanto tempo reter |
| §13 | **Service Lifecycle Stage** — Em qual fase do ciclo de vida o serviço está agora: Designing, Implementing, Operating ou Retiring |

**Gate de revisão Stage 1**: "A arquitetura está correta? Os SLAs são atingíveis? As fronteiras do serviço estão claras?"

---

### Stage 2 — Task Model & Workflow (§14–22)
**Cor**: Laranja (`#E65100`)  
**Objetivo**: Decompor o serviço em módulos e tarefas, e gerar o fluxo BPMN.

| Seção | Conteúdo |
|-------|----------|
| §14 | **Module Register** — Lista de módulos (ex: `MOD-01`, `MOD-02`): cada módulo é um grupo lógico de tarefas com seu próprio OLA e nível de maturidade do subfluxo |
| §15 | **Task Register** — Lista detalhada de tarefas (ex: `T01`, `T02`): tipo, modo de digitalização (automated / assisted / manual), OLA, pressupostos de capacidade, caminho de exceção e se é candidata à automação |
| §16 | **Loop Governance** — Regras para processos iterativos (retrabalho, reenvio, negociação): quantas vezes pode repetir, qual o timeout, como escalar |
| §20 | **Workflow Diagram (BPMN 2.0)** — Diagrama interativo com: viewer embutido, botão para baixar PDF do BPMN, SVG e XML. Cores semânticas: verde = fluxo feliz, roxo = tarefa humana, azul = gateway, laranja = exceção |
| §21 | **Subflow Alignment Summary** — Mapeamento de cada módulo para um padrão WCP (Workflow Control Pattern), ex: `WCP-01` Sequence, `WCP-04` Exclusive Choice, com registro de desvios |

**Gate de revisão Stage 2**: "O modelo de tarefas está completo? O diagrama BPMN representa fielmente o processo?"

---

### Stage 3 — Build-Ready Requirements (§23–27)
**Cor**: Roxo (`#6A1B9A`)  
**Objetivo**: Entregar especificações prontas para a equipe de desenvolvimento construir.

| Seção | Conteúdo |
|-------|----------|
| §23 | **Build-Ready Handoff** — Três sub-seções: (1) **Data Contracts**: contratos de dados com campos obrigatórios/opcionais, estratégia de versionamento; (2) **Integration Points**: sistemas externos, protocolo, frequência, autenticação, comportamento de fallback; (3) **Automation Candidates**: quais tarefas serão automatizadas em qual fase (Phase 1 ou Phase 2) |
| §24 | **KPI Inheritance** — Indicadores-chave de performance com definição, tarefas-fonte, KPI pai/filho, frequência de medição, baseline atual e meta |
| §25 | **Operating Model** — (1) **RACI Matrix**: para cada atividade, quem é Responsável, Accountable, Consultado e Informado; (2) **Governance Cadence**: cadência de reuniões (forum, frequência, participantes, propósito) |
| §26 | **Acceptance Criteria & Test Approach** — Critérios de aceite com abordagem de teste, threshold de aprovação e dono do teste |
| §27 | **Risks & Open Questions** — Registro de riscos, issues, decisões pendentes e perguntas em aberto com dono e data de resolução |

**Gate de revisão Stage 3**: "O time de desenvolvimento tem tudo que precisa para construir? Os riscos estão mapeados? Os critérios de aceite estão claros?"

---

## Single Pass vs. Stage by Stage — Diferença técnica e estratégica

### Full Manifest — Single Pass

```
Entrada (texto ou planilha)
         │
         ▼
   [Uma única chamada à IA]
   Claude gera JSON completo
   com todos os 4 estágios
   e o diagrama BPMN de uma vez
         │
         ▼
   Sistema renderiza 5 HTMLs
   separados em paralelo
         │
         ▼
5 links aparecem juntos:
  ● Stage 0 PDF  (verde)
  ● Stage 1 PDF  (azul)
  ● Stage 2 PDF  (laranja)
  ● Stage 3 PDF  (roxo)
  ● Complete Manifest §1–27  (preto)
```

**Como funciona tecnicamente:**
- 1 chamada à API do Claude (Opus primeiro, Sonnet como fallback)
- O modelo recebe as instruções de todos os 4 estágios ao mesmo tempo e gera um único JSON com a estrutura completa `ServiceManifest v2.6`
- O sistema valida o JSON contra o schema Zod, verifica a integridade estrutural do BPMN, gera o XML e renderiza todos os 5 documentos

**Vantagens:**
- Mais rápido no total (uma única chamada vs. quatro)
- Garante consistência interna (o Stage 3 já conhece os dados do Stage 0 porque estão no mesmo prompt)
- Ideal para protótipos, demonstrações e quando o serviço já está bem descrito

**Limitações:**
- Requer um token budget maior (o JSON completo é extenso)
- Menos controle sobre cada estágio individualmente
- Se a geração falhar, recomeça do zero

---

### Full Manifest — Stage by Stage

```
Entrada (texto ou planilha)
         │
         ▼
   [Chamada 1: Stage 0]
   Gera apenas §1–7
         │
   ┌─────▼──────┐
   │  Gate 0    │ ← usuário revisa o PDF do Stage 0
   │  Revisar   │   e decide se avança
   └─────┬──────┘
         │
   [Chamada 2: Stage 1]
   Gera §8–13 com Stage 0 como contexto
         │
   ┌─────▼──────┐
   │  Gate 1    │ ← usuário revisa o PDF do Stage 1
   └─────┬──────┘
         │
   [Chamada 3: Stage 2]
   Gera §14–22 + BPMN com Stages 0+1 como contexto
         │
   ┌─────▼──────┐
   │  Gate 2    │ ← usuário revisa o PDF do Stage 2
   └─────┬──────┘
         │
   [Chamada 4: Stage 3]
   Gera §23–27 com Stages 0+1+2 como contexto
   + renderiza o Complete Manifest automaticamente
         │
         ▼
   4 PDFs individuais + 1 Complete Manifest
```

**Como funciona tecnicamente:**
- 4 chamadas separadas à API, cada uma enviando os dados dos estágios anteriores como contexto
- Após cada chamada, o sistema armazena o JSON do estágio no estado da aplicação (memória do navegador)
- Na próxima chamada, o JSON acumulado é enviado junto com o prompt do próximo estágio
- O Complete Manifest final é gerado automaticamente após o Stage 3

**Vantagens:**
- **Controle granular**: o usuário pode revisar e aprovar cada estágio antes de avançar
- **Rastreabilidade**: cada estágio é um documento independente com sua própria aprovação
- **Alinhado ao framework**: reflete o processo real do BSD Framework v2.6 com gates formais
- **Menor risco de falha total**: se uma etapa falhar, apenas ela é retentada

**Limitações:**
- Mais lento no total (4 chamadas sequenciais)
- Requer que o usuário esteja disponível para avançar cada gate
- O contexto enviado para os stages tardios (3 e 4) é truncado para caber no prompt

---

## Quando usar cada modo — Guia de decisão

| Cenário | Modo recomendado |
|---------|-----------------|
| Demonstração rápida para stakeholders | Service Card + BPMN |
| Primeiro rascunho completo de um serviço novo | Full Manifest — Single Pass |
| Processo formal de design com aprovações por etapa | Full Manifest — Stage by Stage |
| Reunião de Stage Gate com cliente/gestor | Full Manifest — Stage by Stage |
| Input é uma planilha complexa de intake | Full Manifest — Single Pass ou Stage by Stage |
| Quer validar o BPMN antes de avançar para §23–27 | Full Manifest — Stage by Stage |
| Precisa de documentação rápida para apresentação | Full Manifest — Single Pass |

---

## Arquitetura dos documentos gerados

Cada estágio gera um HTML independente com:
- **Cabeçalho padronizado** com código do serviço, data, badge de estágio e seções cobertas
- **Tabelas e seções numeradas** exatamente conforme o framework v2.6
- **Botão "Export PDF"** que usa `window.print()` do navegador para gerar PDF sem dependências externas
- **BPMN interativo** (apenas Stage 2): viewer bpmn-js embutido com download de SVG, XML e PDF separados

O **Complete Manifest** adiciona:
- Barra lateral de navegação fixa com links para todas as 27 seções
- Divisores coloridos entre estágios
- Scroll suave ao clicar nas seções

---

## Fluxo de dados resumido

```
Usuário digita descrição do serviço
              │
              ▼
     [Next.js — API Route]
     POST /api/generate
     { mode, text, stage?, previousStages? }
              │
              ▼
     [Claude API via SSE]
     Streaming com heartbeat a cada 4s
     (evita timeout + mantém UI responsiva)
              │
              ▼
     JSON validado pelo Zod Schema
     (4 tentativas: Haiku x2, Sonnet x2)
              │
              ▼
     BPMN XML gerado + cores aplicadas
              │
              ▼
     HTML templates renderizados
     (um por estágio)
              │
              ▼
     SSE event: { type: 'manifest_complete', outputs: {...} }
     ou { type: 'stage_complete', stage: N, html: '...' }
              │
              ▼
     Blob URLs criados no navegador
     Links abertos em nova aba pelo usuário
```

---

## Glossário rápido para apresentações

| Termo | Significado |
|-------|-------------|
| **Service Manifest** | Documento-mestre com todas as 27 seções do framework |
| **Stage Gate** | Ponto de revisão e aprovação entre estágios |
| **BPMN 2.0** | Business Process Model and Notation — padrão internacional de diagramas de processo |
| **OLA** | Operational Level Agreement — prazo interno entre equipes |
| **SLA** | Service Level Agreement — prazo acordado com o cidadão/cliente |
| **RACI** | Responsible, Accountable, Consulted, Informed — matriz de responsabilidades |
| **KPI** | Key Performance Indicator — indicador de desempenho |
| **WCP** | Workflow Control Pattern — padrão de controle de fluxo (ex: sequência, escolha exclusiva, paralelismo) |
| **Capability** | Serviço atômico que faz uma coisa do início ao fim |
| **Composite** | Serviço que agrupa múltiplas capabilities em sequência |
| **Orchestrating** | Serviço que coordena outros serviços, nunca executando trabalho diretamente |
| **SSE** | Server-Sent Events — protocolo de streaming do servidor para o navegador em tempo real |
| **Opus / Sonnet** | Modelos do Claude: Opus 4.7 é o mais capaz e é usado como modelo primário; Sonnet 4.6 é o fallback caso o Opus falhe |

---

*Documento gerado para uso interno — DGE Service Orchestrator v2.6*
