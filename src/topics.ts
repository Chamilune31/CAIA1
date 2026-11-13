import type { Topic, TopicId } from './types'

// Topics et poids de l'examen CAIA Level I 2027 (Funds of Funds intégré aux hedge funds).
export const TOPICS: Topic[] = [
  {
    id: 'ethics',
    code: 'ETH',
    name: 'CAIA Ethical Principles',
    fr: 'Principes éthiques',
    weight: [7, 13],
    color: '#8A5CF6',
    summary: 'Les 8 principes, le devoir fiduciaire et les conflits d’intérêts.',
  },
  {
    id: 'intro',
    code: 'INT',
    name: 'Introduction to Alternative Investments',
    fr: 'Introduction aux investissements alternatifs',
    weight: [21, 27],
    color: '#1F6FEB',
    summary: 'Rendements, statistiques, risque, alpha/bêta, structures et frais.',
  },
  {
    id: 'real',
    code: 'REA',
    name: 'Real Assets',
    fr: 'Actifs réels',
    weight: [16, 22],
    color: '#B7791F',
    summary: 'Immobilier, matières premières, infrastructures, ressources naturelles.',
  },
  {
    id: 'pe',
    code: 'PE',
    name: 'Private Equity',
    fr: 'Private equity',
    weight: [8, 14],
    color: '#D9480F',
    summary: 'LBO, venture capital, structure des fonds, mesures de performance.',
  },
  {
    id: 'pd',
    code: 'PD',
    name: 'Private Debt',
    fr: 'Dette privée',
    weight: [10, 16],
    color: '#C2255C',
    summary: 'Direct lending, mezzanine, dette en difficulté, risque de crédit, CLO.',
  },
  {
    id: 'hf',
    code: 'HF',
    name: 'Hedge Funds',
    fr: 'Hedge funds',
    weight: [15, 21],
    color: '#0B7A5A',
    summary: 'Macro, CTA, event-driven, relative value, equity, fonds de fonds.',
  },
  {
    id: 'digital',
    code: 'DIG',
    name: 'Digital Assets',
    fr: 'Actifs numériques',
    weight: [3, 9],
    color: '#0891B2',
    summary: 'Blockchain, consensus, tokens, DeFi et allocation aux cryptos.',
  },
]

export const TOPIC: Record<TopicId, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<
  TopicId,
  Topic
>

export const midWeight = (id: TopicId) => {
  const [a, b] = TOPIC[id].weight
  return (a + b) / 2
}

export const isTopic = (x: string): x is TopicId => x in TOPIC
