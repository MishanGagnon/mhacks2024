import pool from '../../../lib/db';

export async function GET(request: any) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get('uuid'); // Assuming 'uuid' is passed in the query string

  if (!uuid) {
    return new Response(JSON.stringify({ error: 'UUID is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const res = await pool.query("SELECT * FROM courses WHERE user_id = $1", [uuid]);
    return new Response(JSON.stringify(res.rows), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
