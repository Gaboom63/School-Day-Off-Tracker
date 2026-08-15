// --- DEV CONTROLS: Add/Edit Events Here ---
// Use strict YYYY-MM-DD format. The array automatically sorts itself.
const parkwayEvents = [
    { 
        date: '2026-08-25', 
        name: 'Parkway First Day', 
        type: 'early', 
        // Animated Backpack
        icon: '<picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/270f_fe0f/512.gif" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f392/512.gif" alt="🎒" width="32" height="32"></picture>' 
    },
    { 
        date: '2026-09-07', 
        name: 'Labor Day', 
        type: 'holiday', 
        // Animated Backpack
        icon: '<picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1fa8f/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1fa8f/512.gif" alt="🪏" width="32" height="32"></picture>'
    }
];

const rockwoodEvents = [
    { 
        date: '2026-08-24', 
        name: 'Rockwood First Day', 
        type: 'early', 
        // Animated Backpack
        icon: '<picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/270f_fe0f/512.gif" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f392/512.gif" alt="🎒" width="32" height="32"></picture>' 
    },    
    { 
        date: '2026-09-07', 
        name: 'Labor Day', 
        type: 'holiday', 
        icon: '<picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1fa8f/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1fa8f/512.gif" alt="🪏" width="32" height="32"></picture>'
    }
];

let activeEvents = []; // The array the app will actually use

// Local storage key for sleep data
const SLEEP_DATA_KEY = 'hype_hub_sleep_data';
const SETTINGS_KEY = 'hype_hub_settings';

let sleepData = JSON.parse(localStorage.getItem(SLEEP_DATA_KEY)) || {};
let appSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
    district: 'parkway',
    theme: 'vibrant',
    effects: true
};

let snowInterval;
let currentDisplayDate = new Date();

function initApp() {
    loadSettingsUI();
    applySettings(); // This populates activeEvents and applies the chill/vibrant theme!
    updateSleepUI();
}

// --- SETTINGS LOGIC ---
function loadSettingsUI() {
    document.getElementById('district-select').value = appSettings.district;
    document.getElementById('theme-select').value = appSettings.theme;
    document.getElementById('effects-toggle').checked = appSettings.effects;
}

function saveSettings() {
    appSettings.district = document.getElementById('district-select').value;
    appSettings.theme = document.getElementById('theme-select').value;
    appSettings.effects = document.getElementById('effects-toggle').checked;
    
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
    applySettings();
}

function applySettings() {
    // 1. Apply Theme
    if (appSettings.theme === 'chill') {
        document.body.classList.add('chill-mode');
    } else {
        document.body.classList.remove('chill-mode');
    }

    // 2. Set Active District Events
    if (appSettings.district === 'parkway') {
        activeEvents = [...parkwayEvents];
    } else {
        activeEvents = [...rockwoodEvents];
    }
    
    activeEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 3. Re-render UI with new data
    updateCountdown();
    renderCalendar();

    // 4. Force check effects
    if (!appSettings.effects) {
        stopSnowEffect();
    }
}

function updateSleepUI() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dateStr = formatDate(today);
    const hours = sleepData[dateStr] || 0;

    // Get Yesterday's Data
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yestDateStr = formatDate(yesterday);
    const yestHours = sleepData[yestDateStr];

    const donut = document.getElementById('sleep-donut');
    const donutText = document.getElementById('donut-text');
    const msgTitle = document.getElementById('sleep-message-title');
    const msgBody = document.getElementById('sleep-message-body');
    const compText = document.getElementById('sleep-comparison');

    donutText.innerText = `${hours}h`;

    if (hours === 0) {
        donut.style.background = `conic-gradient(var(--accent) 0%, rgba(255,255,255,0.4) 0%)`;
        msgTitle.innerText = "Log Today's Sleep";
        msgBody.innerText = "Enter your hours above to see your daily ring fill up!";
        compText.classList.add('hidden');
        renderWeeklyGraph(today);
        return;
    }

    // Donut logic
    const goal = 8;
    let percentage = (hours / goal) * 100;
    if (percentage > 100) percentage = 100;
    donut.style.background = `conic-gradient(#00b894 ${percentage}%, rgba(255,255,255,0.4) ${percentage}%)`;

    // Title / Body messaging
    if (hours >= 8) {
        // Use innerHTML to combine the text AND the animated battery snippet
        msgTitle.innerHTML = 'Great Job! <picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f50b/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f50b/512.gif" alt="🔋" width="32" height="32"></picture>';
        msgTitle.style.color = "#00b894";
        msgBody.innerText = "You hit the 8-hour golden standard! You should feel energized.";
    } else if (hours >= 6) {
        msgTitle.innerHTML = 'Solid Rest! <picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f50b/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f50b/512.gif" alt="🔋" width="32" height="32"></picture>';
        msgTitle.style.color = "var(--accent)";
        msgBody.innerText = "Good job getting decent rest. Try getting to bed a bit earlier tonight!";
    } else {
        msgTitle.innerHTML = 'Take it Easy Today <picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1faab/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1faab/512.gif" alt="🪫" width="32" height="32"></picture>';
        msgTitle.style.color = "#e17055";
        msgBody.innerText = "You might feel sluggish. Prioritize sleep tonight to let your body recharge.";
    }

    // Yesterday Comparison Logic
    if (yestHours !== undefined) {
        const diff = hours - yestHours;
        compText.classList.remove('hidden');
        
        if (diff > 0) {
            compText.innerText = `You got ${diff}h more than yesterday. Awesome!`;
            compText.style.color = "#00b894"; 
        } else if (diff < 0) {
            compText.innerText = `You got ${Math.abs(diff)}h less than yesterday. Rest up tonight!`;
            compText.style.color = "#e17055"; 
        } else {
            compText.innerText = `Exactly the same as yesterday! Consistency is key.`;
            compText.style.color = "var(--accent)";
        }
    } else {
        compText.classList.remove('hidden');
        compText.innerText = `First day tracked! Log again tomorrow to compare.`;
        compText.style.color = "var(--text-muted)";
    }

    renderWeeklyGraph(today);
}

function renderWeeklyGraph(todayDate) {
    const graph = document.getElementById('sleep-bar-graph');
    graph.innerHTML = '';
    
    // Loop through the last 7 days (including today)
    for (let i = 6; i >= 0; i--) {
        const d = new Date(todayDate);
        d.setDate(todayDate.getDate() - i);
        const dStr = formatDate(d);
        const hrs = sleepData[dStr] || 0;
        
        // Max limit is 12 hours for the UI bar calculation
        let percent = (hrs / 12) * 100;
        if (percent > 100) percent = 100;

        // Get S, M, T, W, T, F, S
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' }); 

        // Dynamic color for bars based on the 8-hour goal
        let fillColor = 'var(--accent)';
        if (hrs >= 8) fillColor = '#00b894'; // Green for good
        else if (hrs > 0 && hrs < 6) fillColor = '#e17055'; // Red for low

        graph.innerHTML += `
            <div class="bar-col">
                <div class="bar-wrapper">
                    <div class="bar-fill" style="height: ${percent}%; background: ${fillColor};"></div>
                </div>
                <span class="bar-label">${dayLabel}</span>
            </div>
        `;
    }
}

// --- View Navigation ---
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    
    const target = document.getElementById(`view-${viewId}`);
    target.classList.remove('hidden');
    
    // Force a reflow to restart the animation
    void target.offsetWidth; 
    target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// --- Countdown Logic ---
function updateCountdown() {
    const today = new Date();
    today.setHours(0,0,0,0);

    const futureEvents = activeEvents.filter(e => {
        const [y, m, d] = e.date.split('-');
        return new Date(y, m - 1, d) >= today;
    });
    
    const nextEvent = futureEvents[0]; 
    const followingEvent = futureEvents[1]; 

    if (nextEvent) {
        const [y, m, d] = nextEvent.date.split('-');
        const eventDate = new Date(y, m - 1, d);
        
        const diffTime = Math.abs(eventDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        document.getElementById('days-left').innerText = diffDays;
        document.getElementById('event-title').innerText = nextEvent.name;
        document.getElementById('event-icon').innerHTML = nextEvent.icon;
        // document.getElementById('event-icon').innerText = nextEvent.icon;
        
        // Format nicely (e.g., "Monday, August 21")
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        document.getElementById('event-date').innerText = eventDate.toLocaleDateString('en-US', options);

        if (followingEvent) {
            document.getElementById('next-up-container').classList.remove('hidden');
            document.getElementById('next-up-icon').innerHTML = followingEvent.icon;
            // document.getElementById('next-up-icon').innerText = followingEvent.icon;
            document.getElementById('next-up-name').innerText = followingEvent.name;
        } else {
            document.getElementById('next-up-container').classList.add('hidden');
        }

        if (nextEvent.type === 'snow' && appSettings.effects) {
            startSnowEffect();
        } else {
            stopSnowEffect();
        }
    }
}

// --- Calendar Logic ---
function renderCalendar() {
    const cal = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('calendar-month-label');
    cal.innerHTML = '';
    
    const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth(); 

    // Update the header label (e.g., "August 2026")
    const options = { month: 'long', year: 'numeric' };
    monthLabel.innerText = currentDisplayDate.toLocaleDateString('en-US', options);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty slots for alignment
    for(let i = 0; i < firstDay; i++) {
        cal.innerHTML += `<div class="cal-cell empty"></div>`;
    }

    // Generate days
    for(let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const eventOnDay = activeEvents.find(e => e.date === dateStr);
        const sleepHours = sleepData[dateStr];

        let cellClasses = 'cal-cell';
        let innerHTML = `<span style="z-index: 2">${day}</span>`;
        
        if (eventOnDay) {
            cellClasses += ' pulse-ring';
            innerHTML += `<div class="cal-icon">${eventOnDay.icon}</div>`;
        }
        
        if (sleepHours) {
            innerHTML += `<div class="sleep-dot"></div>`;
        }

        const cell = document.createElement('div');
        cell.className = cellClasses;
        cell.innerHTML = innerHTML;
        
        // Pass stringified objects to avoid quoting issues
        const eventDataObj = eventOnDay ? JSON.stringify(eventOnDay) : 'null';
        cell.onclick = () => showEventDetails(dateStr, eventDataObj, sleepHours);
        
        cal.appendChild(cell);
    }
}

// Navigates the calendar grid forward or backward
function changeMonth(direction) {
    // direction is 1 (next) or -1 (previous)
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() + direction);
    renderCalendar();
}

function showEventDetails(dateStr, eventDataStr, sleepHours) {
    const card = document.getElementById('calendar-details-card');
    const dateEl = document.getElementById('detail-date');
    const eventText = document.getElementById('detail-event-text');
    const sleepText = document.getElementById('detail-sleep-text');

    // Parse date for display
    const [y, m, d] = dateStr.split('-');
    const displayDate = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    dateEl.innerText = displayDate;

    // Handle Event info
    const eventObj = JSON.parse(eventDataStr);
    if (eventObj) {
        eventText.innerHTML = `<strong>${eventObj.name}</strong>`;
    } else {
        eventText.innerText = "No special events.";
    }

    // Handle Sleep info
    if (sleepHours) {
        sleepText.innerHTML = `You got <strong>${sleepHours} hours</strong> of sleep!`;
    } else {
        sleepText.innerText = "No sleep logged for this day.";
    }

    card.classList.remove('hidden');
    
    // Pop animation
    card.style.transform = 'scale(1.05)';
    setTimeout(() => card.style.transform = 'scale(1)', 150);

    // Bulletproof Auto-Scroll: Forces the calendar view to scroll to its absolute bottom
    setTimeout(() => {
        const calendarView = document.getElementById('view-calendar');
        calendarView.scrollTo({
            top: calendarView.scrollHeight,
            behavior: 'smooth'
        });
    }, 50);
}

// --- Sleep Tracker Logic ---
function logSleep() {
    const input = document.getElementById('sleep-hours');
    const hours = parseFloat(input.value);
    
    if (isNaN(hours) || hours <= 0) return;

    // Save under today's date YYYY-MM-DD
    const today = new Date();
    const dateStr = formatDate(today);
    
    sleepData[dateStr] = hours;
    localStorage.setItem(SLEEP_DATA_KEY, JSON.stringify(sleepData));
    
    input.value = '';
    updateSleepUI();
    renderCalendar(); // Re-render to show the green dot!
}

// --- Visual Effects ---
function startSnowEffect() {
    if (snowInterval) return;
    snowInterval = setInterval(() => {
        const flake = document.createElement('div');
        flake.classList.add('snowflake');
        flake.innerText = '❄️';
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        flake.style.opacity = Math.random();
        document.body.appendChild(flake);
        setTimeout(() => flake.remove(), 5000);
    }, 300);
}

function stopSnowEffect() {
    if (snowInterval) {
        clearInterval(snowInterval);
        snowInterval = null;
    }
    document.querySelectorAll('.snowflake').forEach(f => f.remove());
}

// Helper function to format Date objects as YYYY-MM-DD
function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}



// Boot up
initApp();