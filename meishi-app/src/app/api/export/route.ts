import { NextRequest, NextResponse } from 'next/server';
import { getUserEmail } from '@/lib/auth';
import { getCards } from '@/lib/db';
import type { D1Database, BusinessCard } from '@/lib/db';

export const runtime = 'edge';

interface CloudflareEnv {
  DB: D1Database;
}

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // カンマ、ダブルクォート、改行が含まれる場合はクォートで囲む
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function cardToCsvRow(card: BusinessCard): string {
  const fields = [
    card.company,
    card.department,
    card.name,
    card.name_kana,
    card.title,
    card.phone,
    card.phone_mobile,
    card.fax,
    card.email,
    card.website,
    card.postal_code,
    card.address,
    card.note,
    card.created_at,
  ];
  return fields.map(escapeCsvField).join(',');
}

// GET /api/export - CSVダウンロード
export async function GET(request: NextRequest) {
  const userEmail = getUserEmail(request);
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const env = (process.env as unknown as CloudflareEnv);
    const db = env.DB;

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const cards = await getCards(db, userEmail);

    // ヘッダー行
    const headers = [
      '会社名',
      '部署',
      '氏名',
      '氏名（かな）',
      '役職',
      '電話（固定）',
      '電話（携帯）',
      'FAX',
      'メール',
      'Webサイト',
      '郵便番号',
      '住所',
      'メモ',
      '登録日時',
    ];

    const headerRow = headers.map(escapeCsvField).join(',');
    const dataRows = cards.map(cardToCsvRow);

    // BOM付きUTF-8（Excelで文字化けしないように）
    const BOM = '﻿';
    const csvContent = BOM + [headerRow, ...dataRows].join('\r\n');

    const now = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `meishi_${now}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'CSVエクスポートに失敗しました' }, { status: 500 });
  }
}
