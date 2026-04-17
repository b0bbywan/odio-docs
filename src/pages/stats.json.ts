import stats from '../data/stats.json';

export const GET = () =>
  new Response(JSON.stringify(stats), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
