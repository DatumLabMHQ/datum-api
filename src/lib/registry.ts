// The door's map of the platform. Every resource is a curated table in datum-models; nothing here
// reaches raw tables except the shared DefiLlama layer. Filters are the only columns a caller can
// constrain, and they are always parameterised.
export type FilterType = 'text' | 'int' | 'bool' | 'date';
export type Resource = {
  product: string;
  name: string;
  table: string;
  description: string;
  grain: string;
  dayColumn: string | null;      // daily-grain tables: default to the latest day
  timeColumn: string | null;     // event tables: `since` / `until` apply here
  filters: Record<string, FilterType>;
  order: string;
};

export const RESOURCES: Resource[] = [
  { product: 'sui', name: 'pools', table: 'sui.fct_sui_pool_daily', description: 'One row per protocol, pool and UTC day: supply, borrow, rates, utilization, LTV, liquidation threshold, price.', grain: 'protocol × pool × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', protocol: 'text', symbol: 'text' }, order: 'day desc, protocol, symbol' },
  { product: 'sui', name: 'protocols', table: 'sui.fct_sui_protocol_tvl_daily', description: 'Net and gross TVL per protocol per day with the method (net or remote) and the DefiLlama divergence.', grain: 'protocol × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', protocol: 'text' }, order: 'day desc, protocol' },
  { product: 'sui', name: 'liquidations', table: 'sui.fct_sui_liquidations', description: 'One row per liquidation event across NAVI, Suilend, Scallop, AlphaLend and Bucket.', grain: 'event', dayColumn: null, timeColumn: 'ts', filters: { protocol: 'text', liquidator: 'text', borrower: 'text', debt_asset: 'text', collateral_asset: 'text' }, order: 'ts desc' },
  { product: 'rwa', name: 'totals', table: 'rwa.fct_rwa_totals_daily', description: 'RWA AUM, stablecoin AUM and total AUM on Horizon per day, plus holders and activity.', grain: 'day', dayColumn: 'day', timeColumn: null, filters: { day: 'date' }, order: 'day desc' },
  { product: 'rwa', name: 'reserves', table: 'rwa.fct_rwa_reserve_daily', description: 'Horizon reserves per day: supplied, borrowed, rates, utilization, risk parameters, oracle price, NAV.', grain: 'reserve × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', reserve: 'text', symbol: 'text' }, order: 'day desc, symbol' },
  { product: 'rwa', name: 'morpho-markets', table: 'rwa.fct_rwa_morpho_market_daily', description: 'Morpho markets with RWA collateral per day.', grain: 'market × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', market_id: 'text', collateral_symbol: 'text' }, order: 'day desc, collateral_usd desc' },
  { product: 'rwa', name: 'assets', table: 'rwa.fct_rwa_asset_aum_daily', description: 'Tokenized-asset AUM per day, back to January 2024 for the seeded assets.', grain: 'asset × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', ticker: 'text', issuer: 'text', asset_id: 'text' }, order: 'day desc, aum_usd desc' },
  { product: 'morpho', name: 'markets', table: 'morpho.fct_morpho_market_daily', description: 'Every Morpho market per day. Filter listed=true for headline numbers; unlisted markets include dust and fake-price entries.', grain: 'chain × market × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', chain_id: 'int', market_id: 'text', listed: 'bool', loan_symbol: 'text', collateral_symbol: 'text' }, order: 'day desc, supply_assets_usd desc nulls last' },
  { product: 'morpho', name: 'vaults', table: 'morpho.fct_morpho_vault_daily', description: 'Every Morpho vault (V1 and V2) per day with TVL, APYs, fees and curator.', grain: 'chain × vault × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', chain_id: 'int', vault_address: 'text', listed: 'bool', vault_version: 'int', curator: 'text', asset_symbol: 'text' }, order: 'day desc, total_assets_usd desc nulls last' },
  { product: 'morpho', name: 'curators', table: 'morpho.fct_morpho_curator_daily', description: 'Curator share of listed vault TVL (V1 + V2) per day and an estimated annual fee revenue.', grain: 'curator × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', curator: 'text' }, order: 'day desc, tvl_usd desc' },
  { product: 'morpho', name: 'protocols', table: 'morpho.fct_morpho_protocol_tvl_daily', description: 'DefiLlama net and gross TVL per chain for Morpho and eleven comparator lending protocols, with share of the tracked set.', grain: 'protocol × chain × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', slug: 'text', chain: 'text' }, order: 'day desc, tvl_net_usd desc' },
  { product: 'aave', name: 'reserves', table: 'aave.fct_aave_reserve_daily', description: 'Every Aave v3 reserve on 20 chains and every v4 reserve by spoke, per day.', grain: 'version × chain × market × reserve × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', version: 'text', chain_id: 'int', market_key: 'text', symbol: 'text' }, order: 'day desc, supply_usd desc nulls last' },
  { product: 'aave', name: 'markets', table: 'aave.fct_aave_market_daily', description: 'Aave market (v3) or spoke (v4) totals per day, weighted APYs, and the API totalMarketSize for reconciliation.', grain: 'version × chain × market × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', version: 'text', chain_id: 'int', market_name: 'text' }, order: 'day desc, supply_usd desc' },
  { product: 'aave', name: 'protocols', table: 'aave.fct_aave_protocol_tvl_daily', description: 'DefiLlama net and gross TVL per chain for aave-v2, aave-v3 and aave-v4.', grain: 'protocol × chain × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', slug: 'text', chain: 'text' }, order: 'day desc, tvl_net_usd desc' },
  { product: 'centrifuge', name: 'tokens', table: 'centrifuge.fct_centrifuge_token_daily', description: 'Every Centrifuge token per day: supply, price, TVL; basis says snapshot or api_history.', grain: 'token × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', token_id: 'text', symbol: 'text', pool_id: 'text' }, order: 'day desc, tvl_usd desc nulls last' },
  { product: 'centrifuge', name: 'pools', table: 'centrifuge.fct_centrifuge_pool_daily', description: 'Centrifuge pool TVL per day.', grain: 'pool × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', pool_id: 'text' }, order: 'day desc, tvl_usd desc' },
  { product: 'centrifuge', name: 'flows', table: 'centrifuge.fct_centrifuge_flows_daily', description: 'Deposits, redemptions and net flow per token per day from executed and claimed investor transactions.', grain: 'token × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', symbol: 'text', token_id: 'text', pool_id: 'text' }, order: 'day desc, net_flow_usd desc' },
  { product: 'centrifuge', name: 'protocol', table: 'centrifuge.fct_centrifuge_protocol_tvl_daily', description: 'Own token-level TVL per day beside DefiLlama, with the divergence.', grain: 'day', dayColumn: 'day', timeColumn: null, filters: { day: 'date' }, order: 'day desc' },
  { product: 'defillama', name: 'tvl', table: 'ref.raw_defillama_tvl', description: 'DefiLlama per-chain TVL and borrowed for the 17 tracked protocols (latest stored value per slug, chain, day).', grain: 'slug × chain × day', dayColumn: 'day', timeColumn: null, filters: { day: 'date', slug: 'text', chain: 'text' }, order: 'day desc, tvl_usd desc' },
];

export function findResource(product: string, name: string): Resource | undefined {
  return RESOURCES.find((r) => r.product === product && r.name === name);
}
export function products(): { product: string; resources: string[] }[] {
  const m = new Map<string, string[]>();
  for (const r of RESOURCES) m.set(r.product, [...(m.get(r.product) ?? []), r.name]);
  return [...m.entries()].map(([product, resources]) => ({ product, resources }));
}
