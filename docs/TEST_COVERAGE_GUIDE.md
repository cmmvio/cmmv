# Test Coverage Guide - CMMV

**Framework:** Vitest  
**Coverage Provider:** V8  
**Target Coverage:** 95%+

---

## 🚀 Como Executar os Testes

### 1. Rodar Todos os Testes
```bash
pnpm test
```

### 2. Rodar com Cobertura
```bash
pnpm test:coverage
```

**Resultado:**
- Gera relatório no terminal
- Cria pasta `coverage/` com relatórios HTML, JSON, LCOV
- Mostra % de cobertura por arquivo

### 3. Rodar com UI Interativa
```bash
pnpm test:ui
```

**Resultado:**
- Abre interface web no navegador
- Permite executar testes individuais
- Visualizar cobertura interativamente
- Debug de testes

### 4. Rodar em Modo Watch
```bash
pnpm test:watch
```

**Resultado:**
- Re-executa testes quando arquivos mudam
- Ideal para desenvolvimento
- Feedback instantâneo

### 5. Rodar Uma Vez (CI Mode)
```bash
pnpm test:run
```

**Resultado:**
- Executa todos os testes uma vez
- Sai após conclusão
- Ideal para CI/CD

---

## 📊 Configuração de Coverage

### Thresholds Configurados

```typescript
coverage: {
    lines: 80,      // 80% das linhas executadas
    functions: 80,  // 80% das funções chamadas
    branches: 70,   // 70% dos branches testados
    statements: 80  // 80% dos statements executados
}
```

**Nota:** Estes são os valores mínimos atuais. Meta é 95%+.

### Arquivos Excluídos da Cobertura

- ❌ `node_modules/`
- ❌ `dist/`
- ❌ `.generated/`
- ❌ `**/*.spec.ts` (arquivos de teste)
- ❌ `**/*.mock.ts` (mocks)
- ❌ `**/test/**` (pastas de teste)
- ❌ `**/*.config.ts` (configurações)

---

## 📈 Como Ver os Relatórios

### 1. Relatório no Terminal

Após `pnpm test:coverage`, você verá:

```
 COVERAGE  v2.1.9

 ✓ packages/core/lib/config.ts          85.71%  │  60/70
 ✓ packages/auth/services/login.ts      92.31%  │  120/130
 ✗ packages/vault/lib/vault.service.ts   0.00%  │  0/85
 
 All files                               53.45%  │  2450/4580
```

### 2. Relatório HTML

```bash
# Após executar test:coverage, abra:
open coverage/index.html

# Ou no Windows:
start coverage/index.html

# Ou no WSL:
explorer.exe coverage/index.html
```

**Navegação:**
- Visualize cobertura por arquivo
- Veja linhas não cobertas em vermelho
- Veja linhas cobertas em verde
- Identifique branches não testados

### 3. Relatório JSON

```bash
cat coverage/coverage-final.json | jq
```

**Uso:**
- Integração com ferramentas
- Análise programática
- Tracking de cobertura ao longo do tempo

### 4. Relatório LCOV

```
coverage/lcov.info
```

**Uso:**
- Upload para Codecov
- Integração com IDEs (VSCode, WebStorm)
- Visualização de cobertura inline

---

## 🎯 Interpretando os Resultados

### Exemplo de Saída:

```
File                              % Stmts   % Branch   % Funcs   % Lines   Uncovered Lines
----------------------------------|---------|----------|---------|---------|------------------
All files                         |   53.45 |    45.23 |   61.87 |   53.45 |
 packages/auth                    |   68.92 |    52.14 |   75.32 |   68.92 |
  auth.service.ts                 |   92.31 |    85.71 |   90.00 |   92.31 | 23-25,45
  oauth.service.ts                |    0.00 |     0.00 |    0.00 |    0.00 | 1-150
 packages/vault                   |    0.00 |     0.00 |    0.00 |    0.00 |
  vault.service.ts                |    0.00 |     0.00 |    0.00 |    0.00 | 1-85
```

### O Que Significa:

- **% Stmts (Statements):** Porcentagem de statements executados
- **% Branch:** Porcentagem de branches (if/else) testados
- **% Funcs (Functions):** Porcentagem de funções chamadas
- **% Lines:** Porcentagem de linhas executadas
- **Uncovered Lines:** Números das linhas não cobertas

### Prioridade:

🔴 **0% coverage** = SEM TESTES (CRÍTICO)
- `packages/vault/` - CRÍTICO (segurança)
- `packages/throttler/` - CRÍTICO (segurança)

🟡 **<50% coverage** = INSUFICIENTE
- Adicionar testes urgentemente

🟢 **50-80% coverage** = RAZOÁVEL
- Melhorar cobertura gradualmente

✅ **80%+ coverage** = BOM
- Manter e melhorar para 95%+

---

## 📋 Como Melhorar a Cobertura

### Passo 1: Identificar Arquivos Não Cobertos

```bash
pnpm test:coverage 2>&1 | grep "0.00%"
```

### Passo 2: Abrir Relatório HTML

```bash
# Windows
start coverage/index.html

# WSL
explorer.exe coverage/index.html
```

### Passo 3: Para Cada Arquivo com Baixa Cobertura

1. Abra o arquivo no relatório HTML
2. Veja linhas em vermelho (não executadas)
3. Crie testes para cobrir essas linhas
4. Execute `pnpm test:coverage` novamente
5. Verifique melhoria

### Exemplo: Testar vault.service.ts

```typescript
// packages/vault/tests/vault.service.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { VaultService } from '../lib/vault.service';

describe('VaultService', () => {
    let service: VaultService;

    beforeEach(() => {
        service = new VaultService();
    });

    describe('encrypt', () => {
        it('should encrypt data with AES-256-GCM', () => {
            const plaintext = 'secret data';
            const encrypted = service.encrypt(plaintext);
            
            expect(encrypted).toBeDefined();
            expect(encrypted).not.toBe(plaintext);
            expect(encrypted.iv).toBeDefined();
            expect(encrypted.authTag).toBeDefined();
        });

        it('should decrypt back to original data', () => {
            const plaintext = 'secret data';
            const encrypted = service.encrypt(plaintext);
            const decrypted = service.decrypt(encrypted);
            
            expect(decrypted).toBe(plaintext);
        });
    });
});
```

Após adicionar teste:
```bash
pnpm test:coverage
# vault.service.ts agora mostra 85% ao invés de 0%
```

---

## 🔧 Configuração Avançada

### Ignorar Arquivos Específicos

Edite `vitest.config.ts`:

```typescript
coverage: {
    exclude: [
        'node_modules/',
        '**/*.mock.ts',
        '**/sandbox/**',  // Ignorar sandbox
    ]
}
```

### Aumentar Thresholds

```typescript
coverage: {
    lines: 95,      // Meta: 95%
    functions: 95,
    branches: 85,
    statements: 95,
}
```

**Nota:** Testes falharão se não atingir os thresholds!

### Coverage por Pacote

```bash
# Cobertura de um pacote específico
pnpm test packages/auth --coverage

# Cobertura de um arquivo específico
pnpm test packages/auth/services/login.spec.ts --coverage
```

---

## 🎯 Workflow Recomendado

### Durante Desenvolvimento:

```bash
# 1. Trabalhar com watch mode
pnpm test:watch

# 2. Ver cobertura periodicamente
pnpm test:coverage

# 3. Verificar HTML report
start coverage/index.html
```

### Antes de Commit:

```bash
# 1. Rodar todos os testes
pnpm test:run

# 2. Verificar cobertura
pnpm test:coverage

# 3. Garantir que passou thresholds
echo $?  # Deve ser 0
```

### No CI/CD:

```bash
# GitHub Actions roda automaticamente
pnpm test:run
```

---

## 📊 Status Atual

Execute para ver a cobertura atual:

```bash
pnpm test:coverage
```

**Expectativa:**
- Overall: ~53%
- @cmmv/testing: ~95% (bem testado)
- @cmmv/core: ~70% (razoável)
- @cmmv/auth: ~60% (razoável)
- @cmmv/vault: **0%** 🔴 (CRÍTICO)
- @cmmv/throttler: **0%** 🔴 (CRÍTICO)
- @cmmv/http: ~20% (insuficiente)

---

## 🚀 Comandos Rápidos

```bash
# Executar testes com coverage
pnpm test:coverage

# Ver relatório HTML
explorer.exe coverage/index.html

# Executar testes específicos
pnpm test packages/auth

# Watch mode durante desenvolvimento
pnpm test:watch

# UI interativa
pnpm test:ui
```

---

## 📝 Próximos Passos

1. **Execute agora:**
   ```bash
   pnpm test:coverage
   ```

2. **Veja o relatório HTML** para identificar gaps

3. **Comece pelos pacotes críticos:**
   - @cmmv/vault (0% → 95%)
   - @cmmv/throttler (0% → 90%)

4. **Siga a proposta:** `openspec/changes/improve-test-coverage/`

---

**Execute `pnpm test:coverage` agora para ver a situação atual!** 📊

