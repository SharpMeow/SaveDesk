import {readSavesFile} from './importing.mjs';
self.onmessage = async ({data: {file, source}}) => {
  try { self.postMessage({result: await readSavesFile(file, source)}); }
  catch (error) { self.postMessage({error: error.message || 'This file could not be read.'}); }
};
