// Generates docs/API_CONTRACT.md from src/api/contract.js. Run: npm run docs:api
import { writeFileSync, mkdirSync } from 'node:fs'
import { OPS } from '../src/api/contract.js'

const ops = Object.values(OPS)
const areas = [['public', 'Public (no sign-in)'], ['customer', 'Customer app'], ['admin', 'Staff console']]
const j = (v) => '```json\n' + (typeof v === 'string' ? v : JSON.stringify(v, null, 2)) + '\n```'
let md = `# Vendii API contract

Generated from \`src/api/contract.js\`. Do not edit by hand; run \`npm run docs:api\`.

**${ops.length} operations.** To connect your back end set \`VITE_API_MODE=live\` and \`VITE_API_BASE_URL\` (see \`.env.example\`).

## Conventions

- JSON everywhere. Money is a number in naira, never a string. Dates are ISO 8601.
- Success: \`{ "data": ..., "sync": ... }\`. \`data\` is the thing created or changed. \`sync\` lists every other record the call changed, by slice name (for example the new cash balance after an order). The app merges \`sync\` by id.
- Failure: 4xx or 5xx with \`{ "error": { "code", "message", "fields" } }\`. \`fields\` on a 422 maps input names to messages.
- Every write carries an \`Idempotency-Key\` header. Replaying a key must not repeat the action.
- Auth is Bearer JWT. A 401 triggers one silent \`POST /auth/refresh\`, then sign-out.
- Staff operations also check the staff role's permission (\`permission\` below).

`
for (const [key, title] of areas) {
  const list = ops.filter(o => o.area === key)
  if (!list.length) continue
  md += `## ${title}\n\n| Operation | Method and path | What it does |\n|---|---|---|\n`
  md += list.map(o => `| \`${o.name}\` | \`${o.method} ${o.path}\` | ${o.summary} |`).join('\n') + '\n\n'
  for (const o of list) {
    md += `### \`${o.name}\`\n\n\`${o.method} ${o.path}\`${o.permission ? ` · needs permission **${o.permission}**` : ''}\n\n${o.summary}\n\n`
    if (o.request) md += '**Request**\n\n' + j(o.request) + '\n\n'
    if (o.response) md += '**Response**\n\n' + j(o.response) + '\n\n'
  }
}
mkdirSync('docs', { recursive: true })
writeFileSync('docs/API_CONTRACT.md', md)
console.log(`wrote docs/API_CONTRACT.md (${ops.length} operations)`)
