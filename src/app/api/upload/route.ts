import fsPromises from 'fs/promises';
import fs from 'fs';
import { fromBuffer } from 'pdf2pic';
import path from 'path';
import { Buffer } from 'node:buffer';
import { PDFDocument } from 'pdf-lib';
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText, UserContent } from 'ai';
import { z } from 'zod';
import pool from '../../../lib/db';
import { stringify } from 'querystring';
import { BufferResponse, WriteImageResponse } from 'pdf2pic/dist/types/convertResponse';



async function requestPdfCache(uuid : string, filename : string, buffertest : BufferResponse[], doCheckCache : boolean) {
    console.log(doCheckCache,'test')
    if(doCheckCache){
      const res = await pool.query("SELECT * FROM courses WHERE user_id = $1", [uuid]);
      if(res.rows.length != 0){
        //return user cached data
        return res.rows
      }
    }else{
      let removeNonCache = await pool.query("DELETE FROM courses WHERE user_id = $1", [uuid]);
    }

    const contents : UserContent = buffertest.map( (buffer) => {return {type: 'image', image : buffer.buffer ?? Buffer.alloc(0)}})
    const outputText  = await generateText({
      model: openai('gpt-4o-mini'),
      maxTokens: 3800,
      temperature: 0.01,
      system : 'You are a professional table parser, Each cell may contain multiple rows, you must account for this. you never make errors and are elite at your job, for each course row you will find the info for completion (not taken, in-progress, or complete) course_code (2-4 letters followed by numbers, course_name the title of the course (may be unkown in the case of a course that hasnt been taken) credits 1-4 credits or n/a for untaken courses grade letter grades for college course, semester_year will be in format WN 2024, like winter 2024 if taken if not put not taken',
      messages: [
        {
          role: 'user',
          content: [...contents],
        },
        {
          role: 'user',
          content: "dont use markdown, make sure to include EVERY detail, includes table so make sure to keep track of everything there, everything missing, and and symbols of relevance "
        },
      ]
    });

    
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      maxTokens: 3800,
      temperature: 0.01,
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
          content: outputText.text,
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
  let other = data.get('doCheckCache')
  let doCheckCache = JSON.parse(other as any) as boolean
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadDir, file.name);

  // Load the PDF and get the first page's dimensions
  const pdfDoc = await PDFDocument.load(buffer);
  const firstPage = pdfDoc.getPage(0);
  const { width, height } = firstPage.getSize();


  // Convert the PDF to image with dynamic width and height based on PDF size
  const options = {
    density: 100,
    // saveFilename: path.parse(file.name).name,  // Use the PDF file name (without extension) for image files
    // savePath: uploadDir,                      // Save images in the same directory as the PDF
    format: 'jpg',
    width: Math.round(width),   // Use the PDF width
    height: Math.round(height), // Use the PDF height
  };

  let buffertest = await fromBuffer(buffer, options).bulk(-1, { responseType: 'buffer' });

  console.log("success image converted")
  let text = await requestPdfCache(uuid, path.parse(file.name).name, buffertest, doCheckCache);

  console.log("next is text from ai: " + text)
  return Response.json(text);
}
