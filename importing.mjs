import { parseImport, mergeItems } from './model.mjs';
import { unzipSync, strFromU8 } from './vendor/fflate.mjs';
const MB = 1024 * 1024;
export async function readSavesFile(file, source = 'like') {
  const zip = /\.zip$/i.test(file.name);
  if (file.size > (zip ? 200 : 50) * MB) {
    throw Error(zip ? 'This archive is larger than 200 MB. Unzip it on your device, open the data folder, and choose like.js instead.' : 'This file is larger than 50 MB. Choose a smaller export or one archive part at a time.');
  }
  if (!zip) {
    try { return { items: parseImport(await file.text(), source), files: 1 }; }
    catch (error) {
      if (error instanceof SyntaxError) throw Error('We could not read this file. Choose like.js from your X archive, a Savedesk backup, or a compatible JSON export.');
      throw error;
    }
  }
  let bytes = 0, count = 0, files;
  try {
    files = unzipSync(new Uint8Array(await file.arrayBuffer()), {filter(entry) {
      if (!/(^|\/)like(?:-part\d+)?\.js$/i.test(entry.name)) return false;
      if (!Number.isSafeInteger(entry.originalSize) || entry.originalSize < 0 || (entry.compression === 0 && entry.size !== entry.originalSize)) throw Error('Invalid ZIP entry size.');
      bytes += entry.originalSize; count++;
      if (bytes > 50 * MB || count > 100) throw Error('The likes files are too large to import together. Unzip the archive and choose one like.js part at a time.');
      return true;
    }});
  } catch (error) {
    if (error.message.includes('too large')) throw error;
    throw Error('We could not open this ZIP. Unzip it on your device, then choose data/like.js.');
  }
  if (!Object.keys(files).length) throw Error('No likes file was found in this ZIP. Look for data/like.js in your X archive. Bookmarks may need a separate export.');
  let items = [], actualBytes = 0;
  for (const data of Object.values(files)) {
    actualBytes += data.length;
    if (actualBytes > 50 * MB) throw Error('The likes files are too large. Choose one archive part at a time.');
    // Build the entire result before changing the user's library.
    items = mergeItems(items, parseImport(strFromU8(data), 'like'));
  }
  return {items, files: count};
}
