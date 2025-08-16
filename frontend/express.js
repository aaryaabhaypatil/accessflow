import express from "express";
import fs from "fs";

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Your upload route
app.post("/upload", (req, res) => {
  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", () => {
    // Save each upload as a line in data.json
    fs.appendFileSync("data.json", body + "\n");
    res.send("Data received & saved!");
  });
});

// Optional: add a route to see saved data
app.get("/data", (req, res) => {
  if (fs.existsSync("data.json")) {
    const fileContent = fs.readFileSync("data.json", "utf-8");
    res.send(fileContent);
  } else {
    res.send("No data stored yet.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
