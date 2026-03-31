import { Hono } from 'hono'
import { handle } from 'hono/vercel'

export const runtime = 'edge'

const app = new Hono().basePath('/api/erp-mock')

// Mock database for OS
const osList: any[] = []

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'Mock ERP' })
})

app.post('/register-os', async (c) => {
  const body = await c.req.json()

  // Simulate OS number generation
  const os_number = `OS-${Math.floor(100000 + Math.random() * 900000)}`

  const newOS = {
    ...body,
    os_number,
    created_at: new Date().toISOString(),
    status: 'Sincronizado'
  }

  osList.push(newOS)

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))

  return c.json({
    success: true,
    os_number,
    message: 'Ordem de Serviço registrada com sucesso no ERP'
  })
})

app.get('/validate-asset/:id', (c) => {
  const id = c.req.param('id')
  // In a real scenario, we would check a real database.
  // For PoC, we just return a valid response if ID exists.
  return c.json({
    valid: true,
    asset_id: id,
    message: 'Ativo validado no sistema ERP'
  })
})

export const GET = handle(app)
export const POST = handle(app)
