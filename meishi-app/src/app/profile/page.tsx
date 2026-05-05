'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileFormData {
  name: string;
  name_roman: string;
  company: string;
  title: string;
  phone: string;
  self_email: string;
}

const EMPTY_FORM: ProfileFormData = {
  name: '',
  name_roman: '',
  company: '',
  title: '',
  phone: '',
  self_email: '',
};

export default function ProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProfileFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          if (res.status === 401) {
            setError('認証が必要です');
            setLoading(false);
            return;
          }
          throw new Error('プロフィール取得エラー');
        }
        const data = await res.json();

        if (data.profile) {
          setFormData({
            name: data.profile.name ?? '',
            name_roman: data.profile.name_roman ?? '',
            company: data.profile.company ?? '',
            title: data.profile.title ?? '',
            phone: data.profile.phone ?? '',
            self_email: data.profile.self_email ?? '',
          });
          setIsNew(false);
        } else {
          setIsNew(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) {
      setError('名前と会社名は必須です');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? '保存に失敗しました');
      }

      setSuccess(true);
      setIsNew(false);

      // 初回設定の場合は一覧へ遷移
      if (isNew) {
        setTimeout(() => router.push('/'), 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof ProfileFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* 戻るリンク（プロフィール設定済みの場合のみ表示） */}
      {!isNew && (
        <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-4">
          <ChevronLeftIcon />
          一覧に戻る
        </a>
      )}

      {/* タイトル */}
      <div className="mb-6">
        <h1 className="text-lg font-bold">
          {isNew ? 'プロフィール設定' : 'プロフィール編集'}
        </h1>
        {isNew && (
          <p className="text-sm text-gray-500 mt-1">
            挨拶メールの署名に使用するプロフィールを設定してください。
          </p>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 成功表示 */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700">
          {isNew ? 'プロフィールを設定しました。名刺一覧に移動します...' : 'プロフィールを保存しました'}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
            基本情報
          </h2>

          <FormGroup label="名前 *" htmlFor="name">
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="input-field"
              placeholder="山田 太郎"
              required
            />
          </FormGroup>

          <FormGroup label="名前（ローマ字）" htmlFor="name_roman">
            <input
              id="name_roman"
              type="text"
              value={formData.name_roman}
              onChange={(e) => updateField('name_roman', e.target.value)}
              className="input-field"
              placeholder="Taro Yamada"
            />
            <p className="text-xs text-gray-400 mt-1">挨拶メールの署名に表示されます</p>
          </FormGroup>

          <FormGroup label="会社名 *" htmlFor="company">
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => updateField('company', e.target.value)}
              className="input-field"
              placeholder="株式会社EVOLX"
              required
            />
          </FormGroup>

          <FormGroup label="役職" htmlFor="title">
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="input-field"
              placeholder="営業部長"
            />
          </FormGroup>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
            連絡先
          </h2>

          <FormGroup label="電話番号" htmlFor="phone">
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="input-field"
              placeholder="03-1234-5678"
            />
          </FormGroup>

          <FormGroup label="メールアドレス" htmlFor="self_email">
            <input
              id="self_email"
              type="email"
              value={formData.self_email}
              onChange={(e) => updateField('self_email', e.target.value)}
              className="input-field"
              placeholder="taro@example.com"
            />
          </FormGroup>
        </div>

        {/* プレビュー（署名） */}
        {(formData.name || formData.company) && (
          <div className="card bg-gray-50">
            <h2 className="text-xs font-semibold text-gray-500 mb-2">署名プレビュー</h2>
            <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
{`─────────────────
${formData.name}${formData.name_roman ? `（${formData.name_roman}）` : ''}
${formData.title ? `${formData.title} | ` : ''}${formData.company}
${formData.phone ? `TEL: ${formData.phone}` : ''}
${formData.self_email ? `MAIL: ${formData.self_email}` : ''}
─────────────────`}
            </pre>
          </div>
        )}

        <button
          type="submit"
          className="w-full btn-primary py-3"
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              保存中...
            </span>
          ) : isNew ? 'プロフィールを設定して開始' : '保存する'}
        </button>
      </form>
    </div>
  );
}

function FormGroup({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
