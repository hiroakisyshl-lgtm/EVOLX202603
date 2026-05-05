import { NextRequest, NextResponse } from 'next/server';
import { getUserEmail } from '@/lib/auth';
import { getProfile, upsertProfile } from '@/lib/db';
import type { D1Database } from '@/lib/db';

export const runtime = 'edge';

interface CloudflareEnv {
  DB: D1Database;
}

// GET /api/profile - プロフィール取得
export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const env = (process.env as unknown as CloudflareEnv);
    const db = env.DB;

    if (!db) {
      return NextResponse.json({ profile: null });
    }

    const profile = await getProfile(db, userEmail);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
  }
}

// PUT /api/profile - プロフィール保存
export async function PUT(request: NextRequest) {
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

    if (!body.name || !body.company) {
      return NextResponse.json({ error: '名前と会社名は必須です' }, { status: 400 });
    }

    await upsertProfile(db, {
      email: userEmail,
      name: body.name,
      name_roman: body.name_roman ?? null,
      company: body.company,
      title: body.title ?? null,
      phone: body.phone ?? null,
      self_email: body.self_email ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'プロフィールの保存に失敗しました' }, { status: 500 });
  }
}
