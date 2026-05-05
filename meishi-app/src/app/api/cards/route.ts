import { NextRequest, NextResponse } from 'next/server';
import { getUserEmail } from '@/lib/auth';
import { getCards, insertCard } from '@/lib/db';
import type { D1Database } from '@/lib/db';

export const runtime = 'edge';

interface CloudflareEnv {
  DB: D1Database;
}

// GET /api/cards - 名刺一覧取得
export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const env = (process.env as unknown as CloudflareEnv);
    const db = env.DB;

    if (!db) {
      // ローカル開発時のモックレスポンス
      return NextResponse.json({ cards: [] });
    }

    const cards = await getCards(db, userEmail);
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Cards GET error:', error);
    return NextResponse.json({ error: '名刺一覧の取得に失敗しました' }, { status: 500 });
  }
}

// POST /api/cards - 名刺保存
export async function POST(request: NextRequest) {
  const userEmail = getUserEmail(request);
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const env = (process.env as unknown as CloudflareEnv);
    const db = env.DB;

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const cardId = await insertCard(db, {
      user_email: userEmail,
      name: body.name ?? null,
      name_kana: body.name_kana ?? null,
      company: body.company ?? null,
      department: body.department ?? null,
      title: body.title ?? null,
      phone: body.phone ?? null,
      phone_mobile: body.phone_mobile ?? null,
      fax: body.fax ?? null,
      email: body.email ?? null,
      website: body.website ?? null,
      postal_code: body.postal_code ?? null,
      address: body.address ?? null,
      note: body.note ?? null,
      raw_ocr_text: body.raw_ocr_text ?? null,
    });

    return NextResponse.json({ id: cardId, success: true });
  } catch (error) {
    console.error('Cards POST error:', error);
    return NextResponse.json({ error: '名刺の保存に失敗しました' }, { status: 500 });
  }
}
