const express = require("express");
const axios = require("axios");
const yargs = require("yargs");

const loggingMiddleware = require("./middleware/logging.js");

const app = express();
const cache = new Map();

//Parse the CMD arguments
const argv = yargs
  .option("port", {
    alias: "p",
    description: "Port where the server is running on",
    type: "number",
  })
  .option("origin", {
    alias: "o",
    description: "Origin URL of the proxy requets",
    type: "string",
  })
  .option("clear-cache", {
    alias: "c",
    description: "Clear the cache",
    type: "boolean",
  })
  .help()
  .alias("help", "h").argv;

const PORT = argv.port;
const ORIGIN_URL = argv.origin;

//Clear cache if the flag is provided
if (argv["clear-cache"]) {
  cache.clear();
  console.log("Cache cleared.");
  process.exit(0);
}

//Middleware to log the requests
app.use(loggingMiddleware);

//Route to clear the cache
app.post("/clear-cache", (req,res)=> {
  cache.clear
})

//Proxy Route
app.use(async (req, res) => {
  const cacheKey = req.originalUrl;

  // Check if the response is already cached
  if (cache.has(cacheKey)) {
    res.setHeader("X-Cache", "HIT");
    return res.send(cache.get(cacheKey));
  }

  try {
    // Forward the request to the origin server
    const response = await axios.get(`${ORIGIN_URL}${req.originalUrl}`);
    const data = response.data;

    cache.set(cacheKey, data);

    res.setHeader("X-Cache", "MISS");
    res.send(data);
  } catch (error) {
    console.error("Error when fetching from the server:", error.message);
    res.status(500).send("Error when fetching from the server.");
  }
});

//Start the server
app.listen(PORT, () => {
  console.log(`Caching proxy server running on port ${PORT}`);
  console.log(`Forwarding requests to the following origin: ${ORIGIN_URL}`);
});
