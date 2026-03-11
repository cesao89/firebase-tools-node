# Firebase Tools — Node.js

CLI interativo para gerenciamento de usuários via **Firebase Admin SDK**.

## Funcionalidades

- Selecionar credenciais de serviço da pasta `keys/`
- **Listar usuários** do Firebase Auth com quantidade configurável
- **Buscar usuário** por UID, e-mail ou telefone
- Exibir todas as informações do usuário, incluindo **custom claims**

## Estrutura

```
firebase-tools/
├── keys/           # Arquivos de credenciais (.json)
├── index.js        # Aplicação principal
├── package.json
├── package-lock.json
└── README.md
```

## Pré-requisitos

- Node.js 22+

## Instalação

```bash
npm install
```

## Uso

```bash
node index.js
```

Ao iniciar, o script irá:

1. Listar os arquivos de credenciais disponíveis em `keys/` para seleção
2. Inicializar o Firebase Admin com o projeto correspondente
3. Apresentar o menu principal

### Menu principal

```
[1] Listar usuários   → informa a quantidade desejada e exibe a lista
[2] Buscar usuário    → busca por UID, e-mail ou telefone e exibe detalhes + custom claims
[0] Sair
```

### Exemplo de saída — busca de usuário

```
============================================================
📋  INFORMAÇÕES DO USUÁRIO - FIREBASE AUTH
============================================================
  🆔  UID:              abc123
  📧  Email:            usuario@exemplo.com
  📱  Telefone:         N/A
  👤  Nome:             João Silva
  ✅  Email verificado: Sim
  🚫  Desabilitado:     Não
  📅  Criado em:        Wed, 01 Jan 2025 00:00:00 GMT
  🕐  Último login:     Mon, 10 Mar 2026 12:00:00 GMT

------------------------------------------------------------
🔐  CUSTOM CLAIMS
------------------------------------------------------------
{
  "role": "admin",
  "tenantId": "tenant-xyz"
}
============================================================
```

## Credenciais

Coloque os arquivos `.json` de conta de serviço do Firebase dentro da pasta `../keys/`.  
Esses arquivos são ignorados pelo git (ver `.gitignore` na raiz do projeto).

Para gerar um arquivo de credenciais:
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Configurações do projeto → Contas de serviço
3. Clique em **Gerar nova chave privada**
