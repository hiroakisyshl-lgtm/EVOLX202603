'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BusinessCard, UserProfile } from '@/lib/db';
import { buildGreetingMailto } from '@/lib/mailto';

export default function HomePage() {
  const router = useRouter();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // プロフィール取得
        const profileRes = await fetch('/api/profile');
        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            setError('認証が必要です');
            setLoading(false);
            return;
          }
          throw new Error('プロフィール取得エラー');
        }
        const profileData = await profileRes.json();

        // プロフィール未設定の場合はプロフィール設定画面へ
        if (!profileData.profile) {
          router.push('/profile');
          return;
        }
        setProfile(profileData.profile);

        // 名刺一覧取得
        const cardsRes = await fetch('/api/cards');
        if (!cardsRes.ok) throw new Error('名刺一覧取得エラー');
        const cardsData = await cardsRes.json();
        setCards(cardsData.cards ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary text-sm"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* アクションバー */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a
          href="/scan"
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <CameraIcon />
          名刺をスキャン
        </a>
        <a
          href="/api/export"
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <DownloadIcon />
          CSVダウンロード
        </a>
        <a
          href="/profile"
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <UserIcon />
          プロフィール
        </a>
      </div>

      {/* 名刺数サマリー */}
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-gray-900">
          名刺一覧
          <span className="ml-2 text-sm font-normal text-gray-500">
            {cards.length}件
          </span>
        </h1>
      </div>

      {/* 名刺リスト */}
      {cards.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              profile={profile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CardItem({
  card,
  profile,
}: {
  card: BusinessCard;
  profile: UserProfile | null;
}) {
  const mailtoLink = profile && card.email
    ? buildGreetingMailto(card, profile)
    : null;

  return (
    <div className="card">
      {/* 会社名・名前 */}
      <div className="mb-2">
        {card.company && (
          <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mb-0.5">
            {card.company}
          </p>
        )}
        <div className="flex items-baseline gap-2">
          {card.name && (
            <h2 className="text-lg font-bold text-gray-900">{card.name}</h2>
          )}
          {card.name_kana && (
            <span className="text-xs text-gray-400">{card.name_kana}</span>
          )}
        </div>
        {card.title && (
          <p className="text-sm text-gray-600 mt-0.5">{card.title}</p>
        )}
        {card.department && (
          <p className="text-xs text-gray-500">{card.department}</p>
        )}
      </div>

      {/* 連絡先情報 */}
      <div className="space-y-0.5 text-sm text-gray-600 mb-3">
        {card.phone && (
          <a href={`tel:${card.phone}`} className="flex items-center gap-1.5 hover:text-black">
            <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
            {card.phone}
          </a>
        )}
        {card.phone_mobile && (
          <a href={`tel:${card.phone_mobile}`} className="flex items-center gap-1.5 hover:text-black">
            <MobileIcon className="w-3.5 h-3.5 text-gray-400" />
            {card.phone_mobile}
          </a>
        )}
        {card.email && (
          <a href={`mailto:${card.email}`} className="flex items-center gap-1.5 hover:text-black">
            <MailIcon className="w-3.5 h-3.5 text-gray-400" />
            {card.email}
          </a>
        )}
        {card.website && (
          <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-black">
            <GlobeIcon className="w-3.5 h-3.5 text-gray-400" />
            {card.website}
          </a>
        )}
        {card.address && (
          <p className="flex items-start gap-1.5">
            <LocationIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            {card.postal_code && `〒${card.postal_code} `}{card.address}
          </p>
        )}
      </div>

      {/* 挨拶メール作成ボタン */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {new Date(card.created_at).toLocaleDateString('ja-JP')}
        </span>
        {mailtoLink ? (
          <a
            href={mailtoLink}
            className="flex items-center gap-1 text-xs font-medium text-black hover:text-gray-600 transition-colors"
          >
            <MailSendIcon className="w-3.5 h-3.5" />
            挨拶メール作成
          </a>
        ) : (
          <span className="text-xs text-gray-300">
            {!card.email ? 'メールアドレスなし' : 'プロフィール設定が必要'}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CameraIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-gray-700 font-medium mb-1">名刺がまだありません</h2>
      <p className="text-sm text-gray-400 mb-4">
        名刺をスキャンして登録しましょう
      </p>
      <a href="/scan" className="btn-primary text-sm">
        名刺をスキャン
      </a>
    </div>
  );
}

// アイコンコンポーネント
function CameraIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MobileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function MailSendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
