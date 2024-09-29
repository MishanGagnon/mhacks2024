import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request: NextRequest) {
    const uuid = request.nextUrl.searchParams.get('uuid');
    console.log("The uuid collected from the GET from home page is:", uuid)
    try {
        // const res = await pool.query("SELECT EXISTS(SELECT 1 FROM courses WHERE user_id = $1)", [uuid]);
        const res = await pool.query('SELECT * FROM courses WHERE user_id = $1', [uuid])
        console.log("The Query result PostgreSQL table ", res)
        const exists = res.rows.length > 0

        return NextResponse.json({ exists }, { status: 200 });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}