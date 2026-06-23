import server from "../dist/server/server.js";

export default async function handler(req, res) {
  // 1. Construct the URL
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const url = `${protocol}://${host}${req.url}`;

  // 2. Read the body (if any)
  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", (err) => reject(err));
    });
  }

  // 3. Construct the Web Request object
  const webRequest = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: body,
  });

  try {
    // 4. Call our SSR server's fetch method
    const webResponse = await server.fetch(webRequest, {}, {});

    // 5. Write the response status and headers back to Node's res
    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // 6. Write the body back to Node's res
    const responseBody = await webResponse.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (error) {
    console.error("Error in SSR adapter:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
