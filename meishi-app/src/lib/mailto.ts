import type { UserProfile, BusinessCard } from './db';

export function buildGreetingMailto(
  card: BusinessCard,
  senderProfile: UserProfile
): string {
  const to = card.email ?? '';
  const subject = `はじめまして｜${senderProfile.company} ${senderProfile.name}`;

  const body = `${card.company ?? ''}
${card.name ?? ''} 様

先日はお名刺をいただきありがとうございました。
${senderProfile.company}の${senderProfile.name}と申します。

改めてご挨拶申し上げますとともに、
今後ともどうぞよろしくお願いいたします。

─────────────────
${senderProfile.name}${senderProfile.name_roman ? `（${senderProfile.name_roman}）` : ''}
${senderProfile.title ? `${senderProfile.title} | ` : ''}${senderProfile.company}
${senderProfile.phone ? `TEL: ${senderProfile.phone}` : ''}
${senderProfile.self_email ? `MAIL: ${senderProfile.self_email}` : ''}
─────────────────`;

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
