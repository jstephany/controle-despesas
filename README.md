# Controle de Despesas (Offline-First)

Aplicativo mobile desenvolvido em **React Native + Expo** para controle de despesas pessoais **100% offline**, com persistência local em **SQLite** e arquitetura modular orientada a testes.

---

## Arquitetura Adotada

O projeto segue uma **Arquitetura Limpa Pragmática**, separando claramente as responsabilidades em três camadas independentes:

- **Domínio (`src/domain/`):** entidades, contratos de repositório (`IExpenseRepository`), regras de validação, cálculo mensal em centavos inteiros e utilitários de data timezone-safe (`YYYY-MM-DD`). Zero dependências de React Native ou Expo.
- **Dados (`src/data/`):** cliente `expo-sqlite`, migrações versionadas via `PRAGMA user_version`, mapeadores e implementação concreta do repositório (`SqliteExpenseRepository`).
- **Apresentação (`app/` e `src/presentation/`):** rotas finas no Expo Router (`app/`), gerenciamento de estado com Context API e componentes/telas desacoplados das regras de negócio.

### Justificativa Técnica
- **Valores monetários em centavos (`INTEGER`):** evita erros de arredondamento de ponto flutuante em somas mensais.
- **Datas em ISO local (`YYYY-MM-DD`):** evita deslocamentos de fuso horário que alteram o mês de referência de uma despesa.
- **SQLite direto (`expo-sqlite`):** atende o modelo offline de tabela única com máxima confiabilidade e zero overhead de ORM.
- **Path alias (`@/*` → `src/*`):** mantém imports limpos e facilita a leitura entre camadas.

---

## Stack e Versões Utilizadas

| Tecnologia / Biblioteca | Versão | Papel no Projeto |
| :--- | :--- | :--- |
| **Expo SDK** | `~58.0.26` | Plataforma e toolchain React Native |
| **React Native** | `0.88.1` | Framework mobile cross-platform |
| **React** | `19.3.0` | Biblioteca de interface |
| **TypeScript** | `~6.0.3` | Tipagem estática (`strict: true`) |
| **Expo Router** | `~58.0.32` | Navegação baseada em arquivos (`app/`) |
| **expo-sqlite** | `~58.0.18` | Banco de dados relacional local offline |
| **Jest** | `~30.5.2` | Runner de testes unitários |
| **jest-expo** | `~58.0.15` | Preset oficial de testes para Expo |
| **eslint-config-expo** | `~58.0.4` | Lint oficial do ecossistema Expo (Flat Config) |

---

## Como Instalar, Rodar e Testar

### Pré-requisitos
- Node.js 20+ (testado com Node `v24.18.0`) e npm.
- Aplicativo **Expo Go** no dispositivo físico ou emulador Android/iOS.

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar o aplicativo
```bash
npm start
```
*(Ou diretamente com `npm run android`, `npm run ios` ou `npm run web`.)*

### 3. Verificações técnicas (TypeScript, Lint e Testes)
```bash
npm run typecheck
npm run lint
npm test
```

---

## Checklist de Requisitos do MVP

- [ ] **RF01 — Cadastro:** Registrar despesa com descrição obrigatória, valor numérico estritamente > 0, data e categoria.
- [ ] **RF02 — Listagem:** Exibir despesas com descrição, valor, data e categoria ordenadas cronologicamente.
- [ ] **RF03 — Resumo Mensal:** Calcular e exibir o total gasto no mês selecionado com base na data de cada lançamento.
- [ ] **RF04 — Filtros:** Alternar entre meses/anos atualizando listagem e resumo imediatamente.
- [ ] **RF05 — Exclusão:** Excluir despesa com confirmação e recálculo imediato do total mensal.
- [ ] **RF06 — Persistência e Navegação:** Persistência 100% offline em SQLite com navegação funcional entre telas.
- [ ] **RF07 — Validação:** Bloquear valores inválidos e campos obrigatórios ausentes com feedback visual claro.

---

## Transparência sobre o Uso de IA

Este projeto foi desenvolvido com apoio de inteligência artificial como ferramenta de engenharia assistida — atuando na revisão arquitetural, planejamento em fases incrementais, geração guiada de código, criação de testes automatizados e documentação técnica, com validação contínua em terminal (checagem de tipos, lint e execução de testes) a cada entrega.
