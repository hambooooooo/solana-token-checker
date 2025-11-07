// path: lib/fetcher.ts
// --- NEW FILE ---

// First, we define a custom Error class that includes our custom properties.
// This tells TypeScript that 'status' and 'info' are valid properties.
export class FetchError extends Error {
  info: any;
  status: number;

  constructor(message: string, status: number, info: any) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

// This is our single, robust fetcher function.
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    let info;
    try {
      // Try to get JSON error info from the response
      info = await res.json();
    } catch (e) {
      // If no JSON, just use a default message
      info = 'No JSON error response';
    }

    // Throw our custom error
    const error = new FetchError(
      'An error occurred while fetching the data.',
      res.status,
      info
    );
    throw error;
  }

  return res.json();
};

export default fetcher;