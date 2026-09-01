// Test-runner compatibility shim for restricted sandboxes without an RSS source.
// Application code does not depend on this file. Unexpected memory errors still fail.

const originalMemoryUsage = process.memoryUsage.bind(process);
const originalRss = process.memoryUsage.rss.bind(process.memoryUsage);

const isMissingRssSource = (error) =>
  error instanceof Error &&
  'code' in error &&
  error.code === 'ENOENT' &&
  'syscall' in error &&
  error.syscall === 'uv_resident_set_memory';

const safeMemoryUsage = () => {
  try {
    return originalMemoryUsage();
  } catch (error) {
    if (!isMissingRssSource(error)) throw error;
    return {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0,
    };
  }
};

safeMemoryUsage.rss = () => {
  try {
    return originalRss();
  } catch (error) {
    if (!isMissingRssSource(error)) throw error;
    return 0;
  }
};

process.memoryUsage = safeMemoryUsage;
