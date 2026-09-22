// A worker keeps decompression and parsing away from the UI and can be stopped
// even when an archive lies about its size or a parser takes too long.
export function readFileInWorker(file, source = 'like', {
  createWorker = () => new Worker(new URL('./import-worker.mjs', import.meta.url), {type: 'module'}),
  timeoutMs = 30000,
} = {}) {
  return new Promise((resolve, reject) => {
    let worker, timer;
    const finish = (error, result) => {
      clearTimeout(timer);
      if (worker) { worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null; worker.terminate(); }
      if (error) reject(error); else resolve(result);
    };
    try {
      worker = createWorker();
      worker.onmessage = ({data}) => data.error ? finish(Error(data.error)) : finish(null, data.result);
      worker.onerror = event => { event.preventDefault?.(); finish(Error('This browser could not read the file. Try again in an updated browser, or choose a smaller likes file.')); };
      worker.onmessageerror = () => finish(Error('The imported file could not be read. Try a smaller export.'));
      timer = setTimeout(() => finish(Error('This file took too long to read. Unzip your archive and choose one likes file, or try a smaller export.')), timeoutMs);
      worker.postMessage({file, source});
    } catch { finish(Error('File processing could not start. Use an updated browser and try again.')); }
  });
}
