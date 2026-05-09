const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = path.join(__dirname, "tracker.db");
const schemaPath = path.join(__dirname, "schema.sql");
const db = new DatabaseSync(dbPath);

db.exec(fs.readFileSync(schemaPath, "utf8"));

const legacyColumns = db
    .prepare("PRAGMA table_info(daily_progress)")
    .all()
    .map((column) => column.name);

if (legacyColumns.includes("job_applications")) {
    db.exec(`
        ALTER TABLE daily_progress RENAME TO daily_progress_legacy;
        CREATE TABLE daily_progress (
            date TEXT UNIQUE NOT NULL,
            job_quota INTEGER NOT NULL DEFAULT 0,
            leetcode_quota INTEGER NOT NULL DEFAULT 0,
            job_completed INTEGER NOT NULL DEFAULT 0,
            leetcode_completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO daily_progress (
            date,
            job_completed,
            leetcode_completed,
            created_at,
            updated_at
        )
        SELECT
            date,
            job_applications,
            leetcode_problems,
            created_at,
            updated_at
        FROM daily_progress_legacy;
        DROP TABLE daily_progress_legacy;
    `);
}

const listDaysStatement = db.prepare(`
    SELECT
        date,
        job_quota AS jobQuota,
        leetcode_quota AS leetcodeQuota,
        job_completed AS jobCompleted,
        leetcode_completed AS leetcodeCompleted
    FROM daily_progress
    ORDER BY date
`);

const upsertDayStatement = db.prepare(`
    INSERT INTO daily_progress (
        date,
        job_quota,
        leetcode_quota,
        job_completed,
        leetcode_completed
    )
    VALUES (
        ?,
        ?,
        ?,
        ?,
        ?
    )
    ON CONFLICT(date) DO UPDATE SET
        job_quota = excluded.job_quota,
        leetcode_quota = excluded.leetcode_quota,
        job_completed = excluded.job_completed,
        leetcode_completed = excluded.leetcode_completed,
        updated_at = CURRENT_TIMESTAMP
`);

function listDays() {
    return listDaysStatement.all();
}

function saveDay(day) {
    upsertDayStatement.run(
        day.date,
        day.jobQuota,
        day.leetcodeQuota,
        day.jobCompleted,
        day.leetcodeCompleted
    );
}

module.exports = {
    listDays,
    saveDay
};
