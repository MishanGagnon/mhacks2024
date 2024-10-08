import pool from '../../../lib/db';


export async function GET(request : any) {
    try {
        const res = await pool.query("DELETE FROM courses");
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