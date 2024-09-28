import fs from 'fs/promises';
import { fromBuffer } from 'pdf2pic';
import path from 'path';
import { Buffer } from 'node:buffer';
import { PDFDocument } from 'pdf-lib';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

async function main() {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: 'You are a friendly assistant!',
    prompt: 'Why is the sky blue?',
  });

  return text
}

export async function POST(req: Request) {
  const data = await req.formData();
  const file = data.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadDir, file.name);
  await fs.writeFile(filePath, buffer);

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
  let text = await main();

  console.log("next is text from ai: " + text)
  return Response.json({ cool: 'true' });
}
