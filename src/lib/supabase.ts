import { createClient } from '@supabase/supabase-js';
import {
  isSupabaseMode,
  loadDatabaseConfig,
  findUserByLogin,
  updateUserPasswordById,
  verifyPassword,
} from './authdb';
import { createDataChain, runSql, makeAuthStub, type QueryOp } from './dataAdapter';

// In Supabase mode this is the real service-role client (BYPASSES RLS), exactly
// like the old Drizzle postgres connection did. In local mode all data queries
// are served by the wizard-selected MySQL/PostgreSQL database instead.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
  console.warn('Supabase URL or Key is missing. In local database mode this is expected.');
}

export const rawSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function replayOp(q: any, op: QueryOp): any {
  switch (op.t) {
    case 'select':
      return q.select(op.cols === undefined || op.cols === '*' ? '*' : op.cols);
    case 'eq':
      return q.eq(op.col, op.val);
    case 'neq':
      return q.neq(op.col, op.val);
    case 'gt':
      return q.gt(op.col, op.val);
    case 'gte':
      return q.gte(op.col, op.val);
    case 'lt':
      return q.lt(op.col, op.val);
    case 'lte':
      return q.lte(op.col, op.val);
    case 'like':
      return q.like(op.col, op.val);
    case 'ilike':
      return q.ilike(op.col, op.val);
    case 'in':
      return q.in(op.col, op.vals);
    case 'or':
      return q.or(op.filters);
    case 'order':
      return q.order(op.col, { ascending: op.asc });
    case 'limit':
      return q.limit(op.n);
    case 'range':
      return q.range(op.from, op.to);
    case 'maybeSingle':
      return q.maybeSingle();
    case 'single':
      return q.single();
    case 'insert':
      return q.insert(op.rows);
    case 'upsert':
      return q.upsert(op.rows);
    case 'update':
      return q.update(op.obj);
    case 'delete':
      return q.delete();
    default:
      return q;
  }
}

async function executor(ops: QueryOp[], table: string): Promise<{ data: any; error: any }> {
  if (!(await isSupabaseMode())) {
    return runSql(ops, table);
  }
  let q: any = rawSupabase.from(table);
  for (const op of ops) {
    q = replayOp(q, op);
  }
  return await q;
}

// ---- Auth helpers that work in both modes ----

async function localSignIn(email: string, password: string) {
  const cfg = await loadDatabaseConfig();
  if (!cfg) return { data: { user: null }, error: { message: 'No local database configured.' } };
  const user = await findUserByLogin(cfg, email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { data: { user: null }, error: { message: 'Invalid login credentials' } };
  }
  return {
    data: {
      user: { id: user.id, email: user.email, user_metadata: { role: user.role, username: user.username } },
    },
    error: null,
  };
}

async function localUpdateUserById(id: string, attributes: { password?: string; user_metadata?: Record<string, unknown> }) {
  const cfg = await loadDatabaseConfig();
  if (!cfg) return { data: null, error: null };
  try {
    if (attributes.password) {
      await updateUserPasswordById(cfg, id, attributes.password);
    }
  } catch (_e) {}
  return { data: { id }, error: null };
}

export const supabase: any = {
  from: (table: string) => createDataChain(table, executor),
  auth: {
    admin: {
      listUsers: async (opts?: unknown) => (await isSupabaseMode())
        ? rawSupabase.auth.admin.listUsers(opts as any)
        : makeAuthStub().admin.listUsers(),
      createUser: async (user: unknown) => (await isSupabaseMode())
        ? rawSupabase.auth.admin.createUser(user as any)
        : (makeAuthStub().admin.createUser as any)(user as any),
      updateUserById: async (id: string, attrs: unknown) => (await isSupabaseMode())
        ? rawSupabase.auth.admin.updateUserById(id, attrs as any)
        : localUpdateUserById(id, attrs as { password?: string }),
      deleteUser: async (id: string) => (await isSupabaseMode())
        ? rawSupabase.auth.admin.deleteUser(id as any)
        : { data: null, error: null },
      getUserById: async (id: string) => (await isSupabaseMode())
        ? rawSupabase.auth.admin.getUserById(id as any)
        : { data: { user: null }, error: null },
    },
    getUser: async () => (await isSupabaseMode())
      ? rawSupabase.auth.getUser()
      : { data: { user: null }, error: null },
    signInWithPassword: async (credentials: { email: string; password: string }) => (await isSupabaseMode())
      ? rawSupabase.auth.signInWithPassword(credentials as any)
      : localSignIn(credentials.email, credentials.password),
    signOut: async () => (await isSupabaseMode())
      ? rawSupabase.auth.signOut()
      : { error: null },
  },
};

export default supabase;