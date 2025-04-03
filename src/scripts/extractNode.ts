import * as extract from 'extract-zip';
import * as path from 'path';
import * as fs from 'fs';

async function extractNodeArchive() {
  const source = path.join(process.cwd(), 'node-v22.0.4-linux-x64.zip');
  const destination = process.cwd();

  try {
    // Check if source file exists
    if (!fs.existsSync(source)) {
      throw new Error('Node.js archive not found');
    }

    // Extract the archive
    await extract(source, { dir: destination });
    console.log('Successfully extracted Node.js archive');

    // Clean up the zip file
    fs.unlinkSync(source);
    console.log('Cleaned up archive file');

  } catch (err) {
    console.error('Error extracting Node.js archive:', err);
    process.exit(1);
  }
}

extractNodeArchive();