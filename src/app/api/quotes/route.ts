import { NextResponse } from 'next/server';
import { getDailyQuote, getRandomQuote } from '@/lib/quotes';

export async function GET() {
  try {
    const quote = getDailyQuote();
    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}
