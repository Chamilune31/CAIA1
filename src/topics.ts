import type { Topic, TopicId } from './types'

// CAIA Level I 2027 topics and exam weights (Funds of Funds is now covered within hedge funds).
export const TOPICS: Topic[] = [
  {
    id: 'ethics',
    code: 'ETH',
    name: 'CAIA Ethical Principles',
    short: 'Ethics',
    weight: [7, 13],
    color: '#7B57C9',
    summary: 'The eight principles, fiduciary duty and conflicts of interest.',
  },
  {
    id: 'intro',
    code: 'INT',
    name: 'Introduction to Alternative Investments',
    short: 'Intro to alternatives',
    weight: [21, 27],
    color: '#2563B8',
    summary: 'Returns, statistics, risk measures, alpha and beta, structures and fees.',
  },
  {
    id: 'real',
    code: 'REA',
    name: 'Real Assets',
    short: 'Real assets',
    weight: [16, 22],
    color: '#A86B12',
    summary: 'Real estate, commodities, infrastructure, natural resources, IP.',
  },
  {
    id: 'pe',
    code: 'PE',
    name: 'Private Equity',
    short: 'Private equity',
    weight: [8, 14],
    color: '#C8461B',
    summary: 'Fund structure, buyouts, venture capital and performance measurement.',
  },
  {
    id: 'pd',
    code: 'PD',
    name: 'Private Debt',
    short: 'Private debt',
    weight: [10, 16],
    color: '#B3305E',
    summary: 'Direct lending, mezzanine, distressed debt, credit risk and CLOs.',
  },
  {
    id: 'hf',
    code: 'HF',
    name: 'Hedge Funds',
    short: 'Hedge funds',
    weight: [15, 21],
    color: '#14805E',
    summary: 'Macro, managed futures, event-driven, relative value, equity, funds of funds.',
  },
  {
    id: 'digital',
    code: 'DIG',
    name: 'Digital Assets',
    short: 'Digital assets',
    weight: [3, 9],
    color: '#0E7FA0',
    summary: 'Blockchains, consensus, tokens, DeFi and crypto allocation.',
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
