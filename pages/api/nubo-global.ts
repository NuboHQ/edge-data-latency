import { NextRequest as Request, NextResponse as Response } from 'next/server';
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { connect } from 'nubo';
import { employees } from '@/lib/schema';

const connection = connect({ url: process.env.DATABASE_URL });
const db = drizzle(connection);

export const config = {
  runtime: 'edge',
};

const start = Date.now();

export default async function api(req: Request) {
  const count = toNumber(new URL(req.url).searchParams.get('count'));
  const time = Date.now();

  let data = null;
  for (let i = 0; i < count; i++) {
    data = await db.select().from(employees).limit(10);
  }

  return Response.json(
    {
      data,
      queryDuration: Date.now() - time,
      invocationIsCold: start === time,
      invocationRegion:
        (req.headers.get('x-vercel-id') ?? '').split(':')[1] || null,
    },
    {
      headers: {
        'x-edge-is-cold': start === time ? '1' : '0',
      },
    },
  );
}

// convert a query parameter to a number
// also apply a min and a max
function toNumber(queryParam: string | null, min = 1, max = 5) {
  const num = Number(queryParam);
  return Number.isNaN(num) ? null : Math.min(Math.max(num, min), max);
}
