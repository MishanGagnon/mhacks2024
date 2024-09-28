import fsPromises from 'fs/promises';
import fs from 'fs';
import { fromBuffer } from 'pdf2pic';
import path from 'path';
import { Buffer } from 'node:buffer';
import { PDFDocument } from 'pdf-lib';
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import pool from '../../../lib/db';
import { stringify } from 'querystring';



async function requestPdfCache(uuid : string, filename : string) {


    const res = await pool.query("SELECT * FROM courses WHERE user_id = $1", [uuid]);
    if(res.rows.length != 0){
      //return user cached data
      return res.rows
    }
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      maxTokens: 2048,
      schema: z.object({
        courses: z.array(
          z.object({
            course_code: z.string(),
            course_name: z.string(),
            semester_year: z.string(),
            grade: z.string(),
            credits: z.number(),
            completion: z.string()
          }),
        ),
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'list all the stamps in these passport pages?',
            },
            {
              type: 'image',
              image: fs.readFileSync(path.join(process.cwd(), 'uploads','AuditChecklist_22783726_2024-28-9--12-36-58.1.jpg')),
            },
          ],
        },
      ],
    });

    const columnsPerRow = 8; // course_code, course_name, semester_year, grade, credits, completion, uuid

    // Construct the base of the query
    const baseQuery = `
      INSERT INTO courses (
        course_code,
        course_name,
        semester_year,
        grade,
        credits,
        completion,
        user_id,
        file_name
      )
      VALUES
    `;
  
    // Dynamically construct the VALUES part with parameter placeholders
    const valuesClause = object.courses
      .map(
        (_, index) =>
          `($${index * columnsPerRow + 1}, $${index * columnsPerRow + 2}, $${index * columnsPerRow + 3}, $${index * columnsPerRow + 4}, $${index * columnsPerRow + 5}, $${index * columnsPerRow + 6}, $${index * columnsPerRow + 7}, $${index * columnsPerRow + 8})`
      )
      .join(',\n');
  
    // Flatten all the values into a single array
    const values = object.courses.flatMap(course => [
      course.course_code,
      course.course_name,
      course.semester_year,
      course.grade,
      course.credits,
      course.completion,
      uuid, // Same UUID for every row
      filename
    ]);
  
    const query = `${baseQuery}${valuesClause} RETURNING *;`;
  
    try {
      const res = await pool.query(query, values);
      console.log(`Inserted ${res.rowCount} courses.`);
      return res.rows;
    } catch (error) {
      console.error('Error inserting courses batch:', error);
      throw error;
    }
  

}

export async function POST(req: Request) {
  const data = await req.formData();
  const file = data.get('file') as File;
  const uuid = data.get('uuid') as string
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadDir, file.name);
  await fsPromises.writeFile(filePath, buffer);

  // Load the PDF and get the first page's dimensions
  const pdfDoc = await PDFDocument.load(buffer);
  const firstPage = pdfDoc.getPage(0);
  const { width, height } = firstPage.getSize();

  // Convert the PDF to image with dynamic width and height based on PDF size
  const options = {
    density: 100,
    saveFilename: path.parse(file.name).name,  // Use the PDF file name (without extension) for image files
    savePath: uploadDir,                      // Save images in the same directory as the PDF
    format: 'jpg',
    width: Math.round(width),   // Use the PDF width
    height: Math.round(height), // Use the PDF height
  };

  fromBuffer(buffer, options).bulk(-1, { responseType: 'image' });

  console.log("success image converted")
  let text = await requestPdfCache(uuid,path.parse(file.name).name);

  console.log("next is text from ai: " + text)
  return Response.json(text);
}
