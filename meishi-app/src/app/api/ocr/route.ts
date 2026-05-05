import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUserEmail } from '@/lib/auth';

export const runtime = 'edge';

const SYSTEM_PROMPT = `あなたは名刺情報を正確に読み取るOCRアシスタントです。
提供された名刺画像から情報を抽出し、必ず以下のJSON形式で返してください。
フィールドが読み取れない場合はnullにしてください。
余分なテキストは含めず、JSONのみを返してください。

{
  "name": "氏名（漢字）",
  "name_kana": "氏名（ふりがな）",
  "company": "会社名",
  "department": "部署名",
  "title": "役職",
  "phone": "電話番号（固定）",
  "phone_mobile": "携帯電話番号",
  "fax": "FAX番号",
  "email": "メールアドレス",
  "website": "Webサイト",
  "postal_code": "郵便番号",
  "address": "住所",
  "note": "その他特記事項"
}`;

export async function POST(request: NextRequest) {
  const userEmail = getUserEmail(request);
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: '画像が選択されていません' }, { status: 400 });
    }

    // ファイルをbase64に変換
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // MIMEタイプを取得
    const mimeType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
      return NextResponse.json({ error: '対応していない画像形式です' }, { status: 400 });
    }

    const apiKey = (process.env as Record<string, string>).ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'この名刺の情報をJSONで抽出してください。',
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'OCR結果の取得に失敗しました' }, { status: 500 });
    }

    // JSONをパース
    let cardData: Record<string, string | null>;
    try {
      // コードブロックが含まれている場合は除去
      const jsonText = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      cardData = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: 'OCR結果のパースに失敗しました', raw: textBlock.text }, { status: 500 });
    }

    return NextResponse.json({ card: cardData, raw: textBlock.text });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'OCR処理中にエラーが発生しました' }, { status: 500 });
  }
}
