const express = require("express");
const path = require("path");
const { listDays, saveDay } = require("./db");

const app = express();
const port = process.env.PORT || 3000;
const defaultJobQuota = 10;
const defaultLeetcodeQuota = 5;

function cleanNumber(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

app.use(express.json());

app.get("/", (request, response) => {
    response.sendFile(path.join(__dirname, "index.html"));
});

app.get("/client.js", (request, response) => {
    response.sendFile(path.join(__dirname, "client.js"));
});

app.get("/styles.css", (request, response) => {
    response.sendFile(path.join(__dirname, "styles.css"));
});

app.get("/api/progress", (request, response) => {
    response.json({ days: listDays() });
});

app.put("/api/progress/:date", (request, response) => {
    const { date } = request.params;

    if (!isDateKey(date)) {
        response.status(400).json({ error: "Use a date formatted as YYYY-MM-DD." });
        return;
    }

    const day = {
        date,
        jobQuota: cleanNumber(request.body.jobQuota) || defaultJobQuota,
        leetcodeQuota: cleanNumber(request.body.leetcodeQuota) || defaultLeetcodeQuota,
        jobCompleted: cleanNumber(request.body.jobCompleted),
        leetcodeCompleted: cleanNumber(request.body.leetcodeCompleted)
    };

    saveDay(day);
    response.json({ day });
});

app.listen(port, () => {
    console.log(`Daily Task Tracker is running at http://localhost:${port}`);
});
