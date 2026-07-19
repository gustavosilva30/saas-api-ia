#!/usr/bin/env node
/**
 * MCP Server — SaaS AI
 *
 * Fornece ao agente do Cursor acesso a:
 *  - Schema completo do banco PostgreSQL (tabelas, colunas, tipos, constraints, indexes)
 *  - Queries SELECT e mutações direto no banco
 *  - Status e comandos na VPS via SSH
 *  - Gerenciamento completo do MinIO (storage S3-compatible)
 *  - Gerenciamento do Easypanel (serviços, logs, redeploy, env vars)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import pg from 'pg';
import { Client as SSH } from 'ssh2';
import { readFileSync } from 'fs';
import * as Minio from 'minio';

const { Pool } = pg;

// ─── Banco de Dados ──────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
});

async function dbQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// ─── SSH / VPS ───────────────────────────────────────────────────────────────

function sshExec(command, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const conn = new SSH();
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      conn.end();
      reject(new Error(`Timeout após ${timeoutMs / 1000}s executando: ${command}`));
    }, timeoutMs);

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          conn.end();
          return reject(err);
        }
        stream.on('close', (code) => {
          clearTimeout(timer);
          conn.end();
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
        });
        stream.on('data', (d) => { stdout += d.toString(); });
        stream.stderr.on('data', (d) => { stderr += d.toString(); });
      });
    });

    conn.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    const cfg = {
      host: process.env.SSH_HOST,
      port: parseInt(process.env.SSH_PORT ?? '22'),
      username: process.env.SSH_USER,
      readyTimeout: 10000,
    };

    if (process.env.SSH_PASSWORD) {
      cfg.password = process.env.SSH_PASSWORD;
    } else if (process.env.SSH_KEY_PATH) {
      cfg.privateKey = readFileSync(process.env.SSH_KEY_PATH);
    }

    conn.connect(cfg);
  });
}

function sshAvailable() {
  return !!(process.env.SSH_HOST && process.env.SSH_USER && (process.env.SSH_PASSWORD || process.env.SSH_KEY_PATH));
}

// ─── MinIO ───────────────────────────────────────────────────────────────────

function createMinioClient() {
  const endpoint = process.env.MINIO_ENDPOINT;
  if (!endpoint) throw new Error('MINIO_ENDPOINT não configurado no mcp.json');
  const url = new URL(endpoint.startsWith('http') ? endpoint : `https://${endpoint}`);
  return new Minio.Client({
    endPoint: url.hostname,
    port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 9000),
    useSSL: url.protocol === 'https:',
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'admin',
    secretKey: process.env.MINIO_SECRET_KEY ?? '',
  });
}

function minioAvailable() {
  return !!(process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY);
}

// ─── Easypanel (tRPC) ─────────────────────────────────────────────────────────

const EASYPANEL_URL = process.env.EASYPANEL_URL ?? 'https://painel.douradosap.com.br';
let _epToken = null;


async function epLogin() {
  const password = process.env.EASYPANEL_PASSWORD;
  const email = process.env.EASYPANEL_EMAIL;
  if (!password) throw new Error('EASYPANEL_PASSWORD não configurado no mcp.json');
  if (!email) throw new Error('EASYPANEL_EMAIL não configurado no mcp.json');
  const res = await fetch(`${EASYPANEL_URL}/api/trpc/auth.login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: { email, password } }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`Login falhou: ${json.error.json?.message ?? JSON.stringify(json.error)}`);
  // tRPC v11 aninha o resultado em data.json.token
  _epToken = json.result?.data?.json?.token ?? json.result?.data?.token;
  if (!_epToken) throw new Error('Token não retornado pelo Easypanel. Verifique email/senha.');
  return _epToken;
}

async function epGet(path, input = {}) {
  const url = `${EASYPANEL_URL}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${_epToken}`, 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.json?.message ?? JSON.stringify(json.error));
  return json.result?.data?.json ?? json.result?.data;
}

async function epPost(path, input = {}) {
  const res = await fetch(`${EASYPANEL_URL}/api/trpc/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${_epToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: input }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.json?.message ?? JSON.stringify(json.error));
  return json.result?.data?.json ?? json.result?.data;
}

function epAvailable() {
  return !!(process.env.EASYPANEL_EMAIL && process.env.EASYPANEL_PASSWORD);
}

// ─── Servidor MCP ────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'saas-ai-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── Lista de ferramentas ─────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ── Banco ──
    {
      name: 'db_list_tables',
      description: 'Lista todas as tabelas do banco PostgreSQL com quantidade de colunas e linhas estimadas.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'db_get_table_schema',
      description: 'Retorna o schema detalhado de uma tabela: colunas, tipos, nullable, defaults, constraints e indexes.',
      inputSchema: {
        type: 'object',
        required: ['table_name'],
        properties: {
          table_name: { type: 'string', description: 'Nome da tabela' },
        },
      },
    },
    {
      name: 'db_get_full_schema',
      description: 'Retorna o schema completo de TODAS as tabelas do banco. Use quando precisar entender toda a estrutura do banco.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'db_query',
      description: 'Executa uma query SELECT no banco. Apenas leitura — INSERT/UPDATE/DELETE são bloqueados.',
      inputSchema: {
        type: 'object',
        required: ['sql'],
        properties: {
          sql: { type: 'string', description: 'Query SQL SELECT' },
          limit: { type: 'number', description: 'Máximo de linhas (default 50)', default: 50 },
        },
      },
    },
    {
      name: 'db_get_foreign_keys',
      description: 'Lista todas as chaves estrangeiras do banco, mostrando os relacionamentos entre tabelas.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'db_mutation',
      description: 'Executa INSERT, UPDATE, DELETE ou ALTER TABLE no banco. Requer confirm=true. Use para corrigir dados ou schema.',
      inputSchema: {
        type: 'object',
        required: ['sql', 'confirm'],
        properties: {
          sql: { type: 'string', description: 'SQL de mutação (INSERT/UPDATE/DELETE/ALTER/CREATE)' },
          confirm: { type: 'boolean', description: 'Deve ser true para confirmar a execução' },
        },
      },
    },
    {
      name: 'db_get_column_defaults',
      description: 'Mostra is_nullable e column_default de todas as colunas de uma tabela — útil para diagnosticar erros NOT NULL.',
      inputSchema: {
        type: 'object',
        required: ['table_name'],
        properties: {
          table_name: { type: 'string', description: 'Nome da tabela' },
        },
      },
    },

    // ── VPS ──
    {
      name: 'vps_run_command',
      description: 'Executa um comando shell na VPS via SSH. Use com cautela — prefira comandos de leitura.',
      inputSchema: {
        type: 'object',
        required: ['command'],
        properties: {
          command: { type: 'string', description: 'Comando a executar na VPS' },
        },
      },
    },
    {
      name: 'vps_docker_status',
      description: 'Lista todos os containers Docker rodando (ou parados) na VPS.',
      inputSchema: {
        type: 'object',
        properties: {
          all: { type: 'boolean', description: 'Incluir containers parados (default: false)' },
        },
      },
    },
    {
      name: 'vps_disk_usage',
      description: 'Mostra uso de disco da VPS.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'vps_memory_usage',
      description: 'Mostra uso de memória RAM e swap da VPS.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'vps_view_logs',
      description: 'Mostra os últimos logs de um container Docker na VPS.',
      inputSchema: {
        type: 'object',
        required: ['container'],
        properties: {
          container: { type: 'string', description: 'Nome ou ID do container' },
          lines: { type: 'number', description: 'Número de linhas (default: 50)' },
        },
      },
    },
    {
      name: 'vps_system_info',
      description: 'Informações gerais da VPS: OS, uptime, CPU, IP público.',
      inputSchema: { type: 'object', properties: {} },
    },

    // ── MinIO ──
    {
      name: 'minio_list_buckets',
      description: 'Lista todos os buckets do MinIO com data de criação.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'minio_list_objects',
      description: 'Lista objetos dentro de um bucket MinIO (com prefixo opcional).',
      inputSchema: {
        type: 'object',
        required: ['bucket'],
        properties: {
          bucket: { type: 'string', description: 'Nome do bucket' },
          prefix: { type: 'string', description: 'Prefixo/pasta (opcional)', default: '' },
          limit: { type: 'number', description: 'Máximo de objetos (default: 50)', default: 50 },
        },
      },
    },
    {
      name: 'minio_bucket_stats',
      description: 'Conta total de objetos e tamanho total de um bucket MinIO.',
      inputSchema: {
        type: 'object',
        required: ['bucket'],
        properties: {
          bucket: { type: 'string', description: 'Nome do bucket' },
          prefix: { type: 'string', description: 'Prefixo/pasta (opcional)', default: '' },
        },
      },
    },
    {
      name: 'minio_delete_object',
      description: 'Remove um objeto de um bucket MinIO.',
      inputSchema: {
        type: 'object',
        required: ['bucket', 'object_name'],
        properties: {
          bucket: { type: 'string', description: 'Nome do bucket' },
          object_name: { type: 'string', description: 'Caminho/nome do objeto a remover' },
        },
      },
    },
    {
      name: 'minio_get_public_url',
      description: 'Retorna a URL pública de um objeto no MinIO.',
      inputSchema: {
        type: 'object',
        required: ['bucket', 'object_name'],
        properties: {
          bucket: { type: 'string', description: 'Nome do bucket' },
          object_name: { type: 'string', description: 'Caminho/nome do objeto' },
        },
      },
    },
    {
      name: 'minio_set_bucket_public',
      description: 'Define política de leitura pública em um bucket MinIO (necessário para imagens públicas).',
      inputSchema: {
        type: 'object',
        required: ['bucket'],
        properties: {
          bucket: { type: 'string', description: 'Nome do bucket' },
        },
      },
    },
    {
      name: 'minio_create_bucket',
      description: 'Cria um novo bucket no MinIO.',
      inputSchema: {
        type: 'object',
        required: ['bucket'],
        properties: {
          bucket: { type: 'string', description: 'Nome do bucket' },
          region: { type: 'string', description: 'Região (default: us-east-1)', default: 'us-east-1' },
          public: { type: 'boolean', description: 'Definir como público imediatamente', default: false },
        },
      },
    },
    {
      name: 'minio_upload_text',
      description: 'Cria ou sobrescreve um objeto no MinIO com conteúdo de texto (JSON, CSV, TXT, etc).',
      inputSchema: {
        type: 'object',
        required: ['bucket', 'object_name', 'content'],
        properties: {
          bucket: { type: 'string' },
          object_name: { type: 'string', description: 'Caminho do objeto (ex: pasta/arquivo.json)' },
          content: { type: 'string', description: 'Conteúdo do arquivo' },
          content_type: { type: 'string', description: 'MIME type (default: text/plain)', default: 'text/plain' },
        },
      },
    },
    {
      name: 'minio_download_object',
      description: 'Lê e retorna o conteúdo de um objeto do MinIO (para arquivos de texto/JSON).',
      inputSchema: {
        type: 'object',
        required: ['bucket', 'object_name'],
        properties: {
          bucket: { type: 'string' },
          object_name: { type: 'string' },
        },
      },
    },
    {
      name: 'minio_copy_object',
      description: 'Copia um objeto de uma localização para outra no MinIO (mesmo bucket ou buckets diferentes).',
      inputSchema: {
        type: 'object',
        required: ['source_bucket', 'source_object', 'dest_bucket', 'dest_object'],
        properties: {
          source_bucket: { type: 'string' },
          source_object: { type: 'string' },
          dest_bucket: { type: 'string' },
          dest_object: { type: 'string' },
        },
      },
    },
    {
      name: 'minio_get_presigned_url',
      description: 'Gera URL pré-assinada temporária para download de um objeto privado.',
      inputSchema: {
        type: 'object',
        required: ['bucket', 'object_name'],
        properties: {
          bucket: { type: 'string' },
          object_name: { type: 'string' },
          expires_seconds: { type: 'number', description: 'Validade em segundos (default: 3600)', default: 3600 },
        },
      },
    },
    {
      name: 'minio_delete_objects_prefix',
      description: 'Remove TODOS os objetos dentro de um prefixo/pasta no MinIO. Use com cuidado.',
      inputSchema: {
        type: 'object',
        required: ['bucket', 'prefix'],
        properties: {
          bucket: { type: 'string' },
          prefix: { type: 'string', description: 'Prefixo/pasta a remover (ex: produtos/fotos/)' },
        },
      },
    },
    {
      name: 'minio_object_info',
      description: 'Retorna metadados de um objeto (tamanho, content-type, etag, last-modified).',
      inputSchema: {
        type: 'object',
        required: ['bucket', 'object_name'],
        properties: {
          bucket: { type: 'string' },
          object_name: { type: 'string' },
        },
      },
    },

    // ── Easypanel ──
    {
      name: 'easypanel_login',
      description: 'Autentica no Easypanel e obtém token. Chame isso antes das outras ferramentas easypanel_*.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'easypanel_list_projects',
      description: 'Lista todos os projetos no Easypanel.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'easypanel_list_services',
      description: 'Lista todos os serviços de um projeto no Easypanel.',
      inputSchema: {
        type: 'object',
        required: ['project_name'],
        properties: {
          project_name: { type: 'string', description: 'Nome do projeto no Easypanel' },
        },
      },
    },
    {
      name: 'easypanel_get_service',
      description: 'Detalhes completos de um serviço: env vars, domínios, recursos, imagem.',
      inputSchema: {
        type: 'object',
        required: ['project_name', 'service_name'],
        properties: {
          project_name: { type: 'string' },
          service_name: { type: 'string' },
        },
      },
    },
    {
      name: 'easypanel_get_logs',
      description: 'Busca os logs recentes de um serviço no Easypanel.',
      inputSchema: {
        type: 'object',
        required: ['project_name', 'service_name'],
        properties: {
          project_name: { type: 'string' },
          service_name: { type: 'string' },
          lines: { type: 'number', description: 'Número de linhas (default: 100)', default: 100 },
        },
      },
    },
    {
      name: 'easypanel_restart_service',
      description: 'Reinicia um serviço no Easypanel.',
      inputSchema: {
        type: 'object',
        required: ['project_name', 'service_name'],
        properties: {
          project_name: { type: 'string' },
          service_name: { type: 'string' },
        },
      },
    },
    {
      name: 'easypanel_redeploy_service',
      description: 'Faz redeploy (rebuild + restart) de um serviço no Easypanel.',
      inputSchema: {
        type: 'object',
        required: ['project_name', 'service_name'],
        properties: {
          project_name: { type: 'string' },
          service_name: { type: 'string' },
        },
      },
    },
    {
      name: 'easypanel_update_env',
      description: 'Atualiza as variáveis de ambiente de um serviço no Easypanel (substitui todas).',
      inputSchema: {
        type: 'object',
        required: ['project_name', 'service_name', 'env'],
        properties: {
          project_name: { type: 'string' },
          service_name: { type: 'string' },
          env: { type: 'string', description: 'Variáveis de ambiente no formato KEY=VALUE\\nKEY2=VALUE2' },
        },
      },
    },
    {
      name: 'easypanel_run_command',
      description: 'Executa um comando dentro de um container de serviço no Easypanel.',
      inputSchema: {
        type: 'object',
        required: ['project_name', 'service_name', 'command'],
        properties: {
          project_name: { type: 'string' },
          service_name: { type: 'string' },
          command: { type: 'string', description: 'Comando a executar no container' },
        },
      },
    },
  ],
}));

// ─── Implementação das ferramentas ────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  function text(content) {
    return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
  }

  function requireSSH() {
    if (!sshAvailable()) {
      throw new Error('SSH não configurado. Defina SSH_HOST, SSH_USER e SSH_PASSWORD (ou SSH_KEY_PATH) no mcp.json.');
    }
  }

  try {
    switch (name) {

      // ────────────────── BANCO ──────────────────

      case 'db_list_tables': {
        const rows = await dbQuery(`
          SELECT
            t.table_name,
            COUNT(c.column_name) AS columns,
            pg_stat_user_tables.n_live_tup AS estimated_rows,
            obj_description(quote_ident(t.table_name)::regclass, 'pg_class') AS description
          FROM information_schema.tables t
          JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
          LEFT JOIN pg_stat_user_tables ON pg_stat_user_tables.relname = t.table_name
          WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
          GROUP BY t.table_name, pg_stat_user_tables.n_live_tup
          ORDER BY t.table_name
        `);
        return text(rows);
      }

      case 'db_get_table_schema': {
        const { table_name } = args;

        const columns = await dbQuery(`
          SELECT
            c.column_name,
            c.data_type,
            c.character_maximum_length,
            c.is_nullable,
            c.column_default,
            c.ordinal_position
          FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = $1
          ORDER BY c.ordinal_position
        `, [table_name]);

        const constraints = await dbQuery(`
          SELECT
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
          WHERE tc.table_schema = 'public' AND tc.table_name = $1
          ORDER BY tc.constraint_type, tc.constraint_name
        `, [table_name]);

        const indexes = await dbQuery(`
          SELECT
            indexname,
            indexdef
          FROM pg_indexes
          WHERE schemaname = 'public' AND tablename = $1
        `, [table_name]);

        return text({ table: table_name, columns, constraints, indexes });
      }

      case 'db_get_full_schema': {
        const tables = await dbQuery(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `);

        const schema = {};
        for (const { table_name } of tables) {
          const columns = await dbQuery(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position
          `, [table_name]);
          schema[table_name] = columns;
        }

        return text(schema);
      }

      case 'db_query': {
        const { sql, limit = 50 } = args;
        const normalized = sql.trim().toUpperCase();
        if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
          throw new Error('Apenas queries SELECT ou WITH são permitidas.');
        }
        const safeSql = sql.replace(/;?\s*$/, '') + ` LIMIT ${Math.min(limit, 500)}`;
        const rows = await dbQuery(safeSql);
        return text({ rows, count: rows.length });
      }

      case 'db_mutation': {
        const { sql, confirm } = args;
        if (!confirm) throw new Error('confirm deve ser true para executar mutações no banco.');
        const client = await pool.connect();
        try {
          const result = await client.query(sql);
          return text({ ok: true, rowCount: result.rowCount, command: result.command });
        } finally {
          client.release();
        }
      }

      case 'db_get_column_defaults': {
        const { table_name } = args;
        const rows = await dbQuery(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table_name]);
        return text(rows);
      }

      case 'db_get_foreign_keys': {
        const rows = await dbQuery(`
          SELECT
            tc.table_name AS "tabela",
            kcu.column_name AS "coluna",
            ccu.table_name AS "referencia_tabela",
            ccu.column_name AS "referencia_coluna",
            tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
          ORDER BY tc.table_name
        `);
        return text(rows);
      }

      // ────────────────── VPS ──────────────────

      case 'vps_run_command': {
        requireSSH();
        const { command } = args;
        const result = await sshExec(command);
        return text(result);
      }

      case 'vps_docker_status': {
        requireSSH();
        const flag = args?.all ? '-a' : '';
        const result = await sshExec(`docker ps ${flag} --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"`);
        return text(result.stdout || result.stderr);
      }

      case 'vps_disk_usage': {
        requireSSH();
        const result = await sshExec('df -h --output=source,size,used,avail,pcent,target | grep -v tmpfs');
        return text(result.stdout || result.stderr);
      }

      case 'vps_memory_usage': {
        requireSSH();
        const result = await sshExec('free -h && echo "---" && vmstat -s | head -5');
        return text(result.stdout || result.stderr);
      }

      case 'vps_view_logs': {
        requireSSH();
        const { container, lines = 50 } = args;
        const result = await sshExec(`docker logs --tail ${lines} ${container} 2>&1`);
        return text(result.stdout || result.stderr);
      }

      case 'vps_system_info': {
        requireSSH();
        const result = await sshExec([
          'echo "=== OS ===" && cat /etc/os-release | grep PRETTY_NAME',
          'echo "=== Uptime ===" && uptime',
          'echo "=== CPU ===" && nproc && cat /proc/cpuinfo | grep "model name" | head -1',
          'echo "=== IP Público ===" && curl -s ifconfig.me',
          'echo "=== Kernel ===" && uname -r',
        ].join(' && '));
        return text(result.stdout || result.stderr);
      }

      // ────────────────── MINIO ──────────────────

      case 'minio_list_buckets': {
        if (!minioAvailable()) throw new Error('MinIO não configurado. Defina MINIO_ENDPOINT, MINIO_ACCESS_KEY e MINIO_SECRET_KEY no mcp.json.');
        const mc = createMinioClient();
        const buckets = await mc.listBuckets();
        return text(buckets);
      }

      case 'minio_list_objects': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket, prefix = '', limit = 50 } = args;
        const objects = [];
        await new Promise((resolve, reject) => {
          const stream = mc.listObjects(bucket, prefix, true);
          stream.on('data', (obj) => { if (objects.length < limit) objects.push(obj); });
          stream.on('end', resolve);
          stream.on('error', reject);
        });
        return text({ bucket, prefix, count: objects.length, objects });
      }

      case 'minio_bucket_stats': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket, prefix = '' } = args;
        let count = 0;
        let totalSize = 0;
        await new Promise((resolve, reject) => {
          const stream = mc.listObjects(bucket, prefix, true);
          stream.on('data', (obj) => { count++; totalSize += obj.size ?? 0; });
          stream.on('end', resolve);
          stream.on('error', reject);
        });
        const totalMB = (totalSize / 1024 / 1024).toFixed(2);
        return text({ bucket, prefix, total_objects: count, total_size_bytes: totalSize, total_size_mb: `${totalMB} MB` });
      }

      case 'minio_delete_object': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket, object_name } = args;
        await mc.removeObject(bucket, object_name);
        return text({ success: true, removed: object_name, bucket });
      }

      case 'minio_get_public_url': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const { bucket, object_name } = args;
        const base = (process.env.MINIO_ENDPOINT ?? '').replace(/\/$/, '');
        const url = `${base}/${bucket}/${object_name}`;
        return text({ url });
      }

      case 'minio_set_bucket_public': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket } = args;
        const exists = await mc.bucketExists(bucket);
        if (!exists) await mc.makeBucket(bucket, 'us-east-1');
        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          }],
        });
        await mc.setBucketPolicy(bucket, policy);
        return text({ success: true, bucket, policy: 'public-read' });
      }

      case 'minio_create_bucket': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket, region = 'us-east-1', public: makePublic = false } = args;
        const exists = await mc.bucketExists(bucket);
        if (!exists) await mc.makeBucket(bucket, region);
        if (makePublic) {
          const policy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [{ Effect: 'Allow', Principal: { AWS: ['*'] }, Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${bucket}/*`] }],
          });
          await mc.setBucketPolicy(bucket, policy);
        }
        return text({ success: true, bucket, created: !exists, public: makePublic });
      }

      case 'minio_upload_text': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket, object_name, content, content_type = 'text/plain' } = args;
        const buf = Buffer.from(content, 'utf-8');
        await mc.putObject(bucket, object_name, buf, buf.length, { 'Content-Type': content_type });
        return text({ success: true, bucket, object_name, size: buf.length });
      }

      case 'minio_download_object': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket, object_name } = args;
        const chunks = [];
        await new Promise((resolve, reject) => {
          mc.getObject(bucket, object_name, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', c => chunks.push(c));
            stream.on('end', resolve);
            stream.on('error', reject);
          });
        });
        const content = Buffer.concat(chunks).toString('utf-8');
        return text({ bucket, object_name, size: Buffer.byteLength(content), content });
      }

      case 'minio_copy_object': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { source_bucket, source_object, dest_bucket, dest_object } = args;
        const conds = new Minio.CopyConditions();
        await mc.copyObject(dest_bucket, dest_object, `/${source_bucket}/${source_object}`, conds);
        return text({ success: true, source: `${source_bucket}/${source_object}`, dest: `${dest_bucket}/${dest_object}` });
      }

      case 'minio_get_presigned_url': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket, object_name, expires_seconds = 3600 } = args;
        const url = await mc.presignedGetObject(bucket, object_name, expires_seconds);
        return text({ url, expires_seconds });
      }

      case 'minio_delete_objects_prefix': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket, prefix } = args;
        const objects = [];
        await new Promise((resolve, reject) => {
          const stream = mc.listObjects(bucket, prefix, true);
          stream.on('data', obj => objects.push({ name: obj.name }));
          stream.on('end', resolve);
          stream.on('error', reject);
        });
        if (objects.length === 0) return text({ success: true, deleted: 0, message: 'Nenhum objeto encontrado.' });
        await new Promise((resolve, reject) => {
          mc.removeObjects(bucket, objects, err => err ? reject(err) : resolve());
        });
        return text({ success: true, deleted: objects.length, objects: objects.map(o => o.name) });
      }

      case 'minio_object_info': {
        if (!minioAvailable()) throw new Error('MinIO não configurado.');
        const mc = createMinioClient();
        const { bucket, object_name } = args;
        const stat = await mc.statObject(bucket, object_name);
        return text(stat);
      }

      // ────────────────── EASYPANEL ──────────────────

      case 'easypanel_login': {
        await epLogin();
        return text({ success: true, message: 'Autenticado no Easypanel com sucesso.' });
      }

      case 'easypanel_list_projects': {
        if (!_epToken) await epLogin();
        const data = await epGet('projects.listProjects');
        return text(data);
      }

      case 'easypanel_list_services': {
        if (!_epToken) await epLogin();
        const { project_name } = args;
        const data = await epGet('projects.inspectProject', { projectName: project_name });
        return text(data);
      }

      case 'easypanel_get_service': {
        if (!_epToken) await epLogin();
        const { project_name, service_name } = args;
        // Inspeciona o projeto e filtra o serviço
        const data = await epGet('projects.inspectProject', { projectName: project_name });
        const svc = (data?.services ?? []).find(s => s.name === service_name);
        if (!svc) throw new Error(`Serviço '${service_name}' não encontrado no projeto '${project_name}'`);
        return text(svc);
      }

      case 'easypanel_get_logs': {
        if (!_epToken) await epLogin();
        const { project_name, service_name, lines = 100 } = args;
        // Usa SSH se disponível para pegar logs do container
        if (sshAvailable()) {
          const result = await sshExec(`docker logs --tail ${lines} ${project_name}-${service_name} 2>&1`);
          return text(result.stdout || result.stderr);
        }
        return text({ message: 'SSH não configurado. Configure SSH_HOST/SSH_USER/SSH_PASSWORD para ver logs.' });
      }

      case 'easypanel_restart_service': {
        if (!_epToken) await epLogin();
        const { project_name, service_name } = args;
        const data = await epPost('projects.restartApp', { projectName: project_name, appName: service_name });
        return text({ success: true, message: `Serviço ${service_name} reiniciado.`, data });
      }

      case 'easypanel_redeploy_service': {
        if (!_epToken) await epLogin();
        const { project_name, service_name } = args;
        // Busca o token do serviço via inspectProject
        const projectData = await epGet('projects.inspectProject', { projectName: project_name });
        const svc = (projectData?.services ?? []).find(s => s.name === service_name);
        if (!svc?.token) {
          return text({ success: false, message: `Token do serviço ${service_name} não encontrado.` });
        }
        // Usa o webhook de deploy do Easypanel (rota /api/deploy/{token})
        const webhookUrl = `${process.env.EASYPANEL_URL}/api/deploy/${svc.token}`;
        const wRes = await fetch(webhookUrl, { method: 'POST' });
        const wText = await wRes.text();
        return text({ success: wRes.ok, status: wRes.status, message: wText.trim() || `Redeploy de ${service_name} iniciado.` });
      }

      case 'easypanel_update_env': {
        if (!_epToken) await epLogin();
        const { project_name, service_name, env } = args;
        const data = await epPost('projects.updateAppEnv', {
          projectName: project_name,
          appName: service_name,
          env,
        });
        return text({ success: true, message: 'Env vars atualizadas. Faça redeploy para aplicar.', data });
      }

      case 'easypanel_run_command': {
        if (!_epToken) await epLogin();
        const { project_name, service_name, command } = args;
        // Usa SSH para executar dentro do container
        if (sshAvailable()) {
          const result = await sshExec(`docker exec ${project_name}-${service_name} sh -c "${command.replace(/"/g, '\\"')}"`);
          return text({ stdout: result.stdout, stderr: result.stderr, code: result.code });
        }
        return text({ message: 'SSH não configurado. Configure SSH_HOST/SSH_USER/SSH_PASSWORD para executar comandos.' });
      }

      default:
        throw new Error(`Ferramenta desconhecida: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Erro: ${err.message}` }],
      isError: true,
    };
  }
});

// ─── Inicialização ────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
