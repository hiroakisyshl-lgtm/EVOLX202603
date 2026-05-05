'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CardFormData {
  name: string;
  name_kana: string;
  company: string;
  department: string;
  title: string;
  phone: string;
  phone_mobile: string;
  fax: string;
  email: string;
  website: string;
  postal_code: string;
  address: string;
  note: string;
}

const EMPTY_FORM: CardFormData = {
  name: '',
  name_kana: '',
  company: '',
  department: '',
  title: '',
  phone: '',
  phone_mobile: '',
  fax: '',
  email: '',
  website: '',
  postal_code: '',
  address: '',
  note: '',
};

type Step = 'capture' | 'reading' | 'confirm' | 'saving';

export default function ScanPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('capture');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<CardFormData>(EMPTY_FORM);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    // プレビュー表示
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);

    // OCR実行
    handleOcr(file);
  }

  async function handleOcr(file: File) {
    setStep('reading');
    setError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('image', file);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formDataObj,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? 'OCR処理に失敗しました');
      }

      const data = await res.json();
      const card = data.card as Record<string, string | null>;

      setFormData({
        name: card.name ?? '',
        name_kana: card.name_kana ?? '',
        company: card.company ?? '',
        department: card.department ?? '',
        title: card.title ?? '',
        phone: card.phone ?? '',
        phone_mobile: card.phone_mobile ?? '',
        fax: card.fax ?? '',
        email: card.email ?? '',
        website: card.website ?? '',
        postal_code: card.postal_code ?? '',
        address: card.address ?? '',
        note: card.note ?? '',
      });

      setRawOcrText(data.raw ?? '');
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR処理に失敗しました');
      setStep('capture');
    }
  }

  async function handleSave() {
    setStep('saving');
    setError(null);

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          raw_ocr_text: rawOcrText,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? '保存に失敗しました');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
      setStep('confirm');
    }
  }

  function updateField(field: keyof CardFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div>
      {/* 戻るリンク */}
      <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-4">
        <ChevronLeftIcon />
        一覧に戻る
      </a>

      <h1 className="text-lg font-bold mb-4">名刺スキャン</h1>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ステップ: 撮影・アップロード */}
      {step === 'capture' && (
        <div className="space-y-4">
          {/* プレビュー（再選択時） */}
          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <img src={previewUrl} alt="名刺プレビュー" className="w-full object-contain max-h-64" />
            </div>
          )}

          {/* 撮影ボタン */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base"
          >
            <CameraIcon />
            カメラで撮影
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
          />

          {/* ファイル選択ボタン */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full btn-secondary py-4 flex items-center justify-center gap-2 text-base"
          >
            <UploadIcon />
            ファイルを選択
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
          />

          <p className="text-xs text-center text-gray-400">
            JPEG・PNG・WebP形式に対応
          </p>
        </div>
      )}

      {/* ステップ: OCR読み取り中 */}
      {step === 'reading' && (
        <div className="text-center py-16">
          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-200 mb-6">
              <img src={previewUrl} alt="名刺プレビュー" className="w-full object-contain max-h-48" />
            </div>
          )}
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">名刺を読み取り中...</p>
          <p className="text-sm text-gray-400 mt-1">AIが情報を抽出しています</p>
        </div>
      )}

      {/* ステップ: 確認・編集 */}
      {(step === 'confirm' || step === 'saving') && (
        <div>
          {/* プレビュー */}
          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-200 mb-4">
              <img src={previewUrl} alt="名刺プレビュー" className="w-full object-contain max-h-40" />
            </div>
          )}

          <p className="text-sm text-gray-500 mb-4">
            読み取り結果を確認・修正してから登録してください。
          </p>

          {/* フォーム */}
          <div className="space-y-3">
            <FormGroup label="氏名">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="input-field"
                placeholder="山田 太郎"
              />
            </FormGroup>

            <FormGroup label="氏名（かな）">
              <input
                type="text"
                value={formData.name_kana}
                onChange={(e) => updateField('name_kana', e.target.value)}
                className="input-field"
                placeholder="やまだ たろう"
              />
            </FormGroup>

            <FormGroup label="会社名">
              <input
                type="text"
                value={formData.company}
                onChange={(e) => updateField('company', e.target.value)}
                className="input-field"
                placeholder="株式会社サンプル"
              />
            </FormGroup>

            <FormGroup label="部署">
              <input
                type="text"
                value={formData.department}
                onChange={(e) => updateField('department', e.target.value)}
                className="input-field"
                placeholder="営業部"
              />
            </FormGroup>

            <FormGroup label="役職">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="input-field"
                placeholder="部長"
              />
            </FormGroup>

            <FormGroup label="電話（固定）">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="input-field"
                placeholder="03-1234-5678"
              />
            </FormGroup>

            <FormGroup label="電話（携帯）">
              <input
                type="tel"
                value={formData.phone_mobile}
                onChange={(e) => updateField('phone_mobile', e.target.value)}
                className="input-field"
                placeholder="090-1234-5678"
              />
            </FormGroup>

            <FormGroup label="FAX">
              <input
                type="tel"
                value={formData.fax}
                onChange={(e) => updateField('fax', e.target.value)}
                className="input-field"
                placeholder="03-1234-5679"
              />
            </FormGroup>

            <FormGroup label="メールアドレス">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="input-field"
                placeholder="taro@example.com"
              />
            </FormGroup>

            <FormGroup label="Webサイト">
              <input
                type="url"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                className="input-field"
                placeholder="https://example.com"
              />
            </FormGroup>

            <FormGroup label="郵便番号">
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => updateField('postal_code', e.target.value)}
                className="input-field"
                placeholder="100-0001"
              />
            </FormGroup>

            <FormGroup label="住所">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="input-field"
                placeholder="東京都千代田区..."
              />
            </FormGroup>

            <FormGroup label="メモ">
              <textarea
                value={formData.note}
                onChange={(e) => updateField('note', e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="備考など"
              />
            </FormGroup>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setStep('capture');
                setFormData(EMPTY_FORM);
                setPreviewUrl(null);
              }}
              className="flex-1 btn-secondary"
              disabled={step === 'saving'}
            >
              やり直す
            </button>
            <button
              onClick={handleSave}
              className="flex-1 btn-primary"
              disabled={step === 'saving'}
            >
              {step === 'saving' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  保存中...
                </span>
              ) : '登録する'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
