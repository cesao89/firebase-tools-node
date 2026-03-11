const fs = require('fs');
const path = require('path');
const readline = require('readline');
const admin = require('firebase-admin');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

function separator(char = '=', len = 60) {
  return char.repeat(len);
}

// ─── Key selection ────────────────────────────────────────────────────────────

function listKeyFiles() {
  const keysDir = path.resolve(__dirname, 'keys');
  return fs.readdirSync(keysDir).filter((f) => f.endsWith('.json'));
}

async function selectKeyFile() {
  const files = listKeyFiles();

  if (files.length === 0) {
    console.error('\n❌  Nenhum arquivo .json encontrado na pasta keys/\n');
    process.exit(1);
  }

  console.log('\n' + separator());
  console.log('🔑  SELECIONE O ARQUIVO DE CREDENCIAIS');
  console.log(separator());
  files.forEach((f, i) => console.log(`  [${i + 1}] ${f}`));
  console.log(separator());

  let idx = -1;
  while (idx < 0 || idx >= files.length) {
    const input = await ask(`Opção (1-${files.length}): `);
    idx = parseInt(input, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= files.length) {
      console.log('  ⚠️  Opção inválida, tente novamente.');
      idx = -1;
    }
  }

  return path.resolve(__dirname, '..', 'keys', files[idx]);
}

// ─── Firebase Init ────────────────────────────────────────────────────────────

function initFirebase(keyPath) {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
  const projectId = serviceAccount.project_id;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });
  }

  console.log(`\n✅  Firebase inicializado — projeto: ${projectId}\n`);
  return admin.auth();
}

// ─── Display ──────────────────────────────────────────────────────────────────

function printUser(user) {
  console.log('\n' + separator());
  console.log('📋  INFORMAÇÕES DO USUÁRIO - FIREBASE AUTH');
  console.log(separator());
  console.log(`  🆔  UID:              ${user.uid}`);
  console.log(`  📧  Email:            ${user.email || 'N/A'}`);
  console.log(`  📱  Telefone:         ${user.phoneNumber || 'N/A'}`);
  console.log(`  👤  Nome:             ${user.displayName || 'N/A'}`);
  console.log(`  ✅  Email verificado: ${user.emailVerified ? 'Sim' : 'Não'}`);
  console.log(`  🚫  Desabilitado:     ${user.disabled ? 'Sim' : 'Não'}`);
  console.log(`  📅  Criado em:        ${user.metadata.creationTime || 'N/A'}`);
  console.log(`  🕐  Último login:     ${user.metadata.lastSignInTime || 'N/A'}`);

  // Custom Claims
  console.log('\n' + separator('-'));
  console.log('🔐  CUSTOM CLAIMS');
  console.log(separator('-'));
  if (user.customClaims && Object.keys(user.customClaims).length > 0) {
    console.log(JSON.stringify(user.customClaims, null, 2));
  } else {
    console.log('  (nenhum custom claim definido)');
  }
  console.log(separator() + '\n');
}

// ─── Flows ────────────────────────────────────────────────────────────────────

async function listUsers(auth) {
  const limitInput = await ask('Quantos usuários listar? (padrão: 10): ');
  const limit = parseInt(limitInput, 10) || 10;

  console.log(`\n⏳  Buscando até ${limit} usuário(s)...\n`);

  const result = await auth.listUsers(limit);

  if (result.users.length === 0) {
    console.log('  ℹ️  Nenhum usuário encontrado.\n');
    return;
  }

  result.users.forEach((user, i) => {
    console.log(separator('-'));
    console.log(`  [${i + 1}] UID: ${user.uid}`);
    console.log(`       Email:  ${user.email || 'N/A'}`);
    console.log(`       Nome:   ${user.displayName || 'N/A'}`);
    console.log(`       Fone:   ${user.phoneNumber || 'N/A'}`);
  });

  console.log(separator('-'));
  console.log(`\n  Total exibido: ${result.users.length} usuário(s)\n`);

  if (result.pageToken) {
    console.log('  ℹ️  Existem mais usuários (paginação disponível).\n');
  }
}

async function searchUser(auth) {
  console.log('\n' + separator('-'));
  console.log('  Buscar por:  [1] UID   [2] Email   [3] Telefone');
  console.log(separator('-'));

  const type = await ask('Opção (1/2/3): ');

  let user;

  try {
    if (type === '1') {
      const uid = await ask('UID: ');
      user = await auth.getUser(uid);
    } else if (type === '2') {
      const email = await ask('Email: ');
      user = await auth.getUserByEmail(email);
    } else if (type === '3') {
      const phone = await ask('Telefone (formato E.164, ex: +5511999999999): ');
      user = await auth.getUserByPhoneNumber(phone);
    } else {
      console.log('\n  ⚠️  Opção inválida.\n');
      return;
    }

    printUser(user);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('\n  ❌  Usuário não encontrado.\n');
    } else {
      console.error('\n  ❌  Erro:', err.message, '\n');
    }
  }
}

// ─── Main Menu ────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + separator());
  console.log('🔥  FIREBASE TOOLS - GERENCIAMENTO DE USUÁRIOS (Node.js)');
  console.log(separator() + '\n');

  const keyPath = await selectKeyFile();
  const auth = initFirebase(keyPath);

  while (true) {
    console.log(separator('-'));
    console.log('  MENU PRINCIPAL');
    console.log('  [1] Listar usuários');
    console.log('  [2] Buscar usuário');
    console.log('  [0] Sair');
    console.log(separator('-'));

    const option = await ask('Opção: ');

    if (option === '0') {
      console.log('\n👋  Encerrando. Até logo!\n');
      break;
    } else if (option === '1') {
      await listUsers(auth);
    } else if (option === '2') {
      await searchUser(auth);
    } else {
      console.log('\n  ⚠️  Opção inválida.\n');
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  rl.close();
  process.exit(1);
});
