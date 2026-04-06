import { OptimizeResponse } from '../../types';

export function buildShareText(result: OptimizeResponse): string {
  const holdingLines = result.holdings
    .map(h => `  • ${h.ticker} — ${(h.weight * 100).toFixed(1)}%`)
    .join('\n');
  return [
    `My Frontier Portfolio — ${result.profile.name}`,
    `Grade: ${result.scores.grade}  |  Smart Score: ${result.scores.smart_score.toFixed(1)}/10`,
    `Expected Return: ${(result.performance.expected_annual_return * 100).toFixed(1)}%/yr`,
    '',
    'ETF Holdings:',
    holdingLines,
    '',
    'Built with My Frontier · Not financial advice.',
  ].join('\n');
}

export function generatePortfolioHTML(result: OptimizeResponse, frontierScore: number): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const holdingsRows = result.holdings
    .map(
      h => `<tr>
        <td><strong>${h.ticker}</strong></td>
        <td>${h.name}</td>
        <td style="text-align:center">${(h.weight * 100).toFixed(1)}%</td>
        <td style="text-align:right">$${Math.round(h.lump_sum_amount).toLocaleString()}</td>
        <td style="text-align:right">$${h.weekly_amount.toFixed(2)}/wk</td>
      </tr>`,
    )
    .join('');

  const projectionsRows = result.projections
    .map(
      p => `<tr>
        <td>In ${p.years % 1 === 0 ? p.years.toFixed(0) : p.years.toFixed(1)} years (Age ${p.at_age % 1 === 0 ? p.at_age.toFixed(0) : p.at_age.toFixed(1)})</td>
        <td style="text-align:right">$${Math.round(p.conservative).toLocaleString()}</td>
        <td style="text-align:right">$${Math.round(p.optimistic).toLocaleString()}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html><html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 40px; color: #1A1A2E; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #4361EE; padding-bottom: 16px; }
    .logo { font-size: 24px; font-weight: 900; }
    .logo-my { color: #4361EE; }
    .meta { font-size: 12px; color: #6B7280; text-align: right; }
    h2 { font-size: 16px; font-weight: 700; color: #4361EE; margin: 24px 0 8px; border-left: 4px solid #4361EE; padding-left: 10px; }
    .scores { display: flex; gap: 24px; margin-bottom: 24px; background: #F0F4FF; padding: 16px; border-radius: 8px; }
    .score-item { text-align: center; }
    .score-val { font-size: 28px; font-weight: 900; color: #4361EE; }
    .score-lbl { font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #4361EE; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
    td { padding: 7px 10px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
    tr:nth-child(even) td { background: #F8F9FF; }
    .disclaimer { font-size: 11px; color: #9CA3AF; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><span class="logo-my">My </span>Frontier</div>
    <div class="meta">
      <div><strong>${result.profile.name}</strong></div>
      <div>${date}</div>
      <div>${result.profile.risk_label} Portfolio</div>
    </div>
  </div>

  <div class="scores">
    <div class="score-item"><div class="score-val">${frontierScore}</div><div class="score-lbl">Frontier Score</div></div>
    <div class="score-item"><div class="score-val">${result.scores.grade}</div><div class="score-lbl">Grade</div></div>
    <div class="score-item"><div class="score-val">${(result.performance.expected_annual_return * 100).toFixed(1)}%</div><div class="score-lbl">Exp. Return</div></div>
    <div class="score-item"><div class="score-val">${result.scores.risk_score_pct.toFixed(0)}%</div><div class="score-lbl">Risk Score</div></div>
  </div>

  <h2>ETF Holdings</h2>
  <table>
    <tr><th>Ticker</th><th>Name</th><th style="text-align:center">Weight</th><th style="text-align:right">One-Time</th><th style="text-align:right">Weekly</th></tr>
    ${holdingsRows}
  </table>

  <h2>Retirement Projections</h2>
  <table>
    <tr><th>Horizon</th><th style="text-align:right">Conservative</th><th style="text-align:right">Optimistic</th></tr>
    ${projectionsRows}
  </table>

  <p class="disclaimer">
    This report is for educational purposes only. It is not financial advice. All projections are estimates based on historical data and mathematical models. Past performance does not guarantee future results. Consult a licensed financial advisor before making any investment decisions. Data sourced from Yahoo Finance.
  </p>
</body></html>`;
}
