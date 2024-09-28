import pool from '../../../lib/db';


export async function GET(request : any) {
    try {
        const res = await pool.query("SELECT * FROM courses WHERE user_id = '960a1621-2e16-43dc-8e34-d499125db487'");
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