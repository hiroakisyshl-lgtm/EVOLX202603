export interface UserProfile {
  email: string;
  name: string;
  name_roman: string | null;
  company: string;
  title: string | null;
  phone: string | null;
  self_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessCard {
  id: number;
  user_email: string;
  name: string | null;
  name_kana: string | null;
  company: string | null;
  department: string | null;
  title: string | null;
  phone: string | null;
  phone_mobile: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  postal_code: string | null;
  address: string | null;
  note: string | null;
  raw_ocr_text: string | null;
  created_at: string;
  updated_at: string;
}

// Cloudflare D1 型定義
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

// プロフィール取得
export async function getProfile(db: D1Database, email: string): Promise<UserProfile | null> {
  const result = await db
    .prepare('SELECT * FROM user_profiles WHERE email = ?')
    .bind(email)
    .first<UserProfile>();
  return result;
}

// プロフィール保存（INSERT OR REPLACE）
export async function upsertProfile(
  db: D1Database,
  profile: Omit<UserProfile, 'created_at' | 'updated_at'>
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO user_profiles (email, name, name_roman, company, title, phone, self_email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        name_roman = excluded.name_roman,
        company = excluded.company,
        title = excluded.title,
        phone = excluded.phone,
        self_email = excluded.self_email,
        updated_at = datetime('now')
    `)
    .bind(
      profile.email,
      profile.name,
      profile.name_roman ?? null,
      profile.company,
      profile.title ?? null,
      profile.phone ?? null,
      profile.self_email ?? null
    )
    .run();
}

// 名刺一覧取得
export async function getCards(db: D1Database, userEmail: string): Promise<BusinessCard[]> {
  const result = await db
    .prepare('SELECT * FROM business_cards WHERE user_email = ? ORDER BY created_at DESC')
    .bind(userEmail)
    .all<BusinessCard>();
  return result.results;
}

// 名刺1件取得
export async function getCard(db: D1Database, id: number, userEmail: string): Promise<BusinessCard | null> {
  const result = await db
    .prepare('SELECT * FROM business_cards WHERE id = ? AND user_email = ?')
    .bind(id, userEmail)
    .first<BusinessCard>();
  return result;
}

// 名刺保存
export async function insertCard(
  db: D1Database,
  card: Omit<BusinessCard, 'id' | 'created_at' | 'updated_at'>
): Promise<number> {
  const result = await db
    .prepare(`
      INSERT INTO business_cards (
        user_email, name, name_kana, company, department, title,
        phone, phone_mobile, fax, email, website, postal_code, address, note, raw_ocr_text,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
    .bind(
      card.user_email,
      card.name ?? null,
      card.name_kana ?? null,
      card.company ?? null,
      card.department ?? null,
      card.title ?? null,
      card.phone ?? null,
      card.phone_mobile ?? null,
      card.fax ?? null,
      card.email ?? null,
      card.website ?? null,
      card.postal_code ?? null,
      card.address ?? null,
      card.note ?? null,
      card.raw_ocr_text ?? null
    )
    .run();
  return (result.meta as { last_row_id?: number }).last_row_id ?? 0;
}
