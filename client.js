const fields = {
    jobCompleted: document.querySelector("#jobCompleted"),
    leetcodeCompleted: document.querySelector("#leetcodeCompleted")
};

const displays = {
    jobCompleted: document.querySelector("#jobCompletedDisplay"),
    jobTotal: document.querySelector("#jobTotalDisplay"),
    leetcodeCompleted: document.querySelector("#leetcodeCompletedDisplay"),
    leetcodeTotal: document.querySelector("#leetcodeTotalDisplay")
};

const DEFAULT_JOB_QUOTA = 10;
const DEFAULT_LEETCODE_QUOTA = 5;

const todayDate = document.querySelector("#todayDate");
const jobStatus = document.querySelector("#jobStatus");
const leetcodeStatus = document.querySelector("#leetcodeStatus");
const jobCompleteCheck = document.querySelector("#jobCompleteCheck");
const leetcodeCompleteCheck = document.querySelector("#leetcodeCompleteCheck");
const historyList = document.querySelector("#historyList");
const dailyForm = document.querySelector("#dailyForm");
const favicon = document.querySelector("#favicon");

const numberFields = Object.keys(fields);
let state = { days: {} };
let hasUnsavedChanges = false;
let pendingChanges = {
    jobCompleted: 0,
    leetcodeCompleted: 0
};

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + amount);
    return nextDate;
}

function formatDate(date) {
    return new Intl.DateTimeFormat("en-CA", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function defaultDay() {
    return {
        jobQuota: DEFAULT_JOB_QUOTA,
        leetcodeQuota: DEFAULT_LEETCODE_QUOTA,
        jobCompleted: 0,
        leetcodeCompleted: 0
    };
}

function cleanNumber(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function cleanAdjustment(value) {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return Math.max(-1, Math.min(1, parsed));
}

function getToday() {
    const key = localDateKey();
    state.days[key] = {
        ...defaultDay(),
        ...state.days[key]
    };

    if (state.days[key].jobQuota === 0) {
        state.days[key].jobQuota = DEFAULT_JOB_QUOTA;
    }

    if (state.days[key].leetcodeQuota === 0) {
        state.days[key].leetcodeQuota = DEFAULT_LEETCODE_QUOTA;
    }

    return state.days[key];
}

function isComplete(day) {
    return day.jobCompleted >= day.jobQuota && day.leetcodeCompleted >= day.leetcodeQuota;
}

function renderStatus(element, completedToday, quota) {
    element.textContent = `${completedToday} / ${quota}`;
    element.classList.toggle("complete", completedToday >= quota);
}

function renderCheck(element, completedToday, quota) {
    element.checked = completedToday >= quota;
}

function updateFavicon(day) {
    if (!favicon) {
        return;
    }

    const remainingJobs = Math.max(0, day.jobQuota - day.jobCompleted);
    const remainingLeetcode = Math.max(0, day.leetcodeQuota - day.leetcodeCompleted);
    const remainingTasks = remainingJobs + remainingLeetcode;
    const canvas = document.createElement("canvas");
    const size = 64;
    const context = canvas.getContext("2d");

    canvas.width = size;
    canvas.height = size;
    context.fillStyle = remainingTasks === 0 ? "#16a34a" : "#0f172a";
    context.beginPath();
    context.roundRect(0, 0, size, size, 14);
    context.fill();

    context.fillStyle = "#f8fafc";
    context.textAlign = "center";
    context.textBaseline = "middle";

    if (remainingTasks === 0) {
        context.strokeStyle = "#f8fafc";
        context.lineWidth = 7;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(18, 34);
        context.lineTo(28, 43);
        context.lineTo(47, 21);
        context.stroke();
    } else {
        const label = remainingTasks > 99 ? "99+" : String(remainingTasks);
        context.font = `${label.length > 2 ? 24 : 32}px Arial, sans-serif`;
        context.fillText(label, size / 2, size / 2 + 2);
    }

    favicon.href = canvas.toDataURL("image/png");
}

function renderHistory() {
    const today = new Date();
    historyList.innerHTML = "";

    for (let daysAgo = 7; daysAgo >= 1; daysAgo -= 1) {
        const date = addDays(today, -daysAgo);
        const key = localDateKey(date);
        const day = state.days[key];
        const item = document.createElement("article");
        const complete = day ? isComplete(day) : false;
        const jobsToday = day?.jobCompleted ?? 0;
        const leetcodeToday = day?.leetcodeCompleted ?? 0;

        item.className = `history-day ${complete ? "complete" : "missed"}`;
        item.innerHTML = `
            <p class="history-date">${formatDate(date)}</p>
            <p class="history-status">${complete ? "Complete" : "Not complete"}</p>
            <p class="history-counts">
                Jobs: ${jobsToday} / ${day?.jobQuota ?? 0}<br>
                LeetCode: ${leetcodeToday} / ${day?.leetcodeQuota ?? 0}
            </p>
        `;

        historyList.appendChild(item);
    }
}

function calculateTotals() {
    return Object.values(state.days).reduce((totals, day) => {
        totals.jobs += cleanNumber(day.jobCompleted);
        totals.leetcode += cleanNumber(day.leetcodeCompleted);
        return totals;
    }, { jobs: 0, leetcode: 0 });
}

function render() {
    const today = getToday();
    const totals = calculateTotals();

    todayDate.textContent = formatDate(new Date());

    numberFields.forEach((field) => {
        fields[field].value = pendingChanges[field];
        displays[field].textContent = pendingChanges[field];
    });

    displays.jobTotal.textContent = totals.jobs;
    displays.leetcodeTotal.textContent = totals.leetcode;

    renderStatus(jobStatus, today.jobCompleted, today.jobQuota);
    renderStatus(leetcodeStatus, today.leetcodeCompleted, today.leetcodeQuota);
    renderCheck(jobCompleteCheck, today.jobCompleted, today.jobQuota);
    renderCheck(leetcodeCompleteCheck, today.leetcodeCompleted, today.leetcodeQuota);
    updateFavicon(today);
    renderHistory();
}

function renderPendingChanges() {
    numberFields.forEach((field) => {
        fields[field].value = pendingChanges[field];
        displays[field].textContent = pendingChanges[field];
    });
}

async function loadState() {
    const response = await fetch("/api/progress");

    if (!response.ok) {
        throw new Error("Could not load progress.");
    }

    const data = await response.json();
    state.days = data.days.reduce((days, day) => {
        days[day.date] = {
            jobQuota: cleanNumber(day.jobQuota) || DEFAULT_JOB_QUOTA,
            leetcodeQuota: cleanNumber(day.leetcodeQuota) || DEFAULT_LEETCODE_QUOTA,
            jobCompleted: cleanNumber(day.jobCompleted),
            leetcodeCompleted: cleanNumber(day.leetcodeCompleted)
        };
        return days;
    }, {});

    return Boolean(state.days[localDateKey()]);
}

function todayPayload() {
    const date = localDateKey();
    const today = getToday();

    return {
        date,
        today
    };
}

async function saveToday(options = {}) {
    const { date, today } = todayPayload();
    const response = await fetch(`/api/progress/${date}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(today),
        keepalive: options.keepalive === true
    });

    if (!response.ok) {
        throw new Error("Could not save progress.");
    }

    hasUnsavedChanges = false;
}

async function updateField(field, value) {
    pendingChanges[field] = cleanAdjustment(value);
    renderPendingChanges();
}

numberFields.forEach((field) => {
    fields[field].addEventListener("input", (event) => {
        updateField(field, event.target.value);
    });
});

dailyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const today = getToday();
    today.jobCompleted = Math.max(0, today.jobCompleted + pendingChanges.jobCompleted);
    today.leetcodeCompleted = Math.max(0, today.leetcodeCompleted + pendingChanges.leetcodeCompleted);
    pendingChanges = {
        jobCompleted: 0,
        leetcodeCompleted: 0
    };
    hasUnsavedChanges = true;
    render();
    saveToday().catch(showError);
});

document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const field = button.dataset.field;
    const currentValue = cleanAdjustment(fields[field].value);
    const nextValue = button.dataset.action === "increase"
        ? currentValue + 1
        : currentValue - 1;

    updateField(field, nextValue);
});

function showError(error) {
    todayDate.textContent = error.message;
}

window.addEventListener("beforeunload", () => {
    if (!hasUnsavedChanges) {
        return;
    }

    const { date, today } = todayPayload();

    fetch(`/api/progress/${date}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(today),
        keepalive: true
    }).catch(() => {});
});

loadState()
    .then((hasToday) => {
        render();
        hasUnsavedChanges = false;

        if (!hasToday) {
            return saveToday();
        }

        return undefined;
    })
    .catch(showError);
