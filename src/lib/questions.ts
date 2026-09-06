import { q } from './db';

// The consensus questions from datum-context/evals/questions.yaml, with the canonical SQL that
// answers each. `:date` binds to the requested day (default: the latest day with data).
export type Question = { id: string; question: string; metric: string; sql: string; product: string };

export const QUESTIONS: Question[] = [
  { id: 'sui_tvl_net_total', product: 'sui', metric: 'tvl-net', question: 'What was total net TVL across the five tracked Sui lending protocols on {date}?', sql: 'select sum(tvl_net_usd) as value from sui.fct_sui_protocol_tvl_daily where day = :date' },
  { id: 'sui_tvl_navi', product: 'sui', metric: 'tvl-net', question: "What was NAVI's net TVL on {date}?", sql: "select tvl_net_usd as value from sui.fct_sui_protocol_tvl_daily where protocol = 'navi' and day = :date" },
  { id: 'sui_liq_volume_30d', product: 'sui', metric: 'liquidation-volume', question: 'What was total Sui lending liquidation volume in the 30 days to {date}?', sql: "select sum(collateral_usd) as value from sui.fct_sui_liquidations where ts >= :date::date - interval '30 days' and ts < :date::date + interval '1 day'" },
  { id: 'sui_supply_apy_usdc_navi', product: 'sui', metric: 'supply-apy', question: 'What was the USDC supply APY on NAVI on {date}?', sql: "select supply_apy as value from sui.fct_sui_pool_daily where protocol = 'navi' and symbol = 'USDC' and day = :date" },
  { id: 'morpho_tvl_total', product: 'morpho', metric: 'tvl-net', question: "What was Morpho Blue's total net TVL across chains on {date}?", sql: "select sum(tvl_net_usd) as value from morpho.fct_morpho_protocol_tvl_daily where slug = 'morpho-blue' and day = :date" },
  { id: 'morpho_share_ethereum', product: 'morpho', metric: 'lending-share', question: "What was Morpho's share of Ethereum lending TVL on {date}?", sql: "select share_of_tracked_lending as value from morpho.fct_morpho_protocol_tvl_daily where chain = 'ethereum' and slug = 'morpho-blue' and day = :date" },
  { id: 'morpho_top_curator', product: 'morpho', metric: 'curator-tvl', question: 'Which curator had the largest Morpho vault TVL on {date}, and how much?', sql: 'select curator as label, tvl_usd as value from morpho.fct_morpho_curator_daily where day = :date order by tvl_usd desc limit 1' },
  { id: 'aave_v3_ethereum_supply', product: 'aave', metric: 'tvl-gross', question: 'What was total supplied on Aave v3 Ethereum Core on {date}?', sql: "select supply_usd as value from aave.fct_aave_market_daily where version = 'v3' and chain_id = 1 and market_name = 'AaveV3Ethereum' and day = :date" },
  { id: 'centrifuge_tvl_total', product: 'centrifuge', metric: 'tvl-net', question: "What was Centrifuge's total token TVL on {date}?", sql: 'select sum(tvl_usd) as value from centrifuge.fct_centrifuge_token_daily where day = :date' },
];

const DAY_TABLE: Record<string, string> = {
  sui: 'sui.fct_sui_protocol_tvl_daily', morpho: 'morpho.fct_morpho_protocol_tvl_daily', aave: 'aave.fct_aave_market_daily', centrifuge: 'centrifuge.fct_centrifuge_token_daily',
};

export type Answer = { id: string; question: string; date: string; value: number | null; label?: string | null; unit: string; sql: string; answered_at: string };

export async function ask(id: string, date?: string): Promise<Answer> {
  const qn = QUESTIONS.find((x) => x.id === id);
  if (!qn) throw new Error(`unknown question "${id}"`);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must be YYYY-MM-DD');
  let day = date;
  if (!day) { const [m] = await q<{ d: string }>(`select max(day)::text as d from ${DAY_TABLE[qn.product]}`); day = m?.d; }
  if (!day) throw new Error('no data yet');
  const sql = qn.sql.replace(/:date/g, '$1');
  const [row] = await q<{ value: number | string | null; label?: string }>(sql, [day]);
  const value = row?.value == null ? null : Number(row.value);
  const unit = qn.metric.endsWith('apy') ? 'percent' : qn.metric === 'lending-share' ? 'fraction' : 'usd';
  return { id: qn.id, question: qn.question.replace('{date}', day), date: day, value, label: row?.label ?? null, unit, sql: qn.sql, answered_at: new Date().toISOString() };
}
