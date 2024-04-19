const darkModeToggle = document.getElementById('dark-mode-toggle');
const weeklyContestsContainer = document.getElementById('weekly-contests');
const biweeklyContestsContainer = document.getElementById('biweekly-contests');

// Check if dark mode is enabled in localStorage
const isDarkMode = localStorage.getItem('darkMode') === 'true';
document.body.classList.toggle('dark-mode', isDarkMode);
darkModeToggle.checked = isDarkMode;

// Add event listener for dark mode toggle
darkModeToggle.addEventListener('change', () => {
    const isDarkMode = darkModeToggle.checked;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
});

// Check if data is stored in localStorage and is not older than 1 day
const lastUpdated = localStorage.getItem('lastUpdated');
const currentTime = new Date().getTime();
const oneDayInMs = 1000 * 60 * 60 * 24;
if (lastUpdated && currentTime - lastUpdated < oneDayInMs) {
    const data = JSON.parse(localStorage.getItem('leetcodeData'));
    renderContests(data);
} else {
    // Fetch data from the provided URL
    fetch('https://zerotrac.github.io/leetcode_problem_rating/data.json')
        .then(response => response.json())
        .then(data => {
            // Store the data in localStorage with a timestamp
            localStorage.setItem('leetcodeData', JSON.stringify(data));
            localStorage.setItem('lastUpdated', new Date().getTime());
            renderContests(data);
        })
        .catch(error => console.error('Error fetching data:', error));
}

function renderContests(data) {
    // Group problems by contest
    const contestMap = new Map();
    data.forEach(problem => {
        const contestID = problem.ContestID_en;
        if (!contestMap.has(contestID)) {
            contestMap.set(contestID, []);
        }
        contestMap.get(contestID).push(problem);
    });

    // Sort contests by ContestID_en in descending order
    const sortedContests = Array.from(contestMap.entries()).sort((a, b) => {
        const aParts = a[0].match(/(\d+)/g);
        const bParts = b[0].match(/(\d+)/g);
        const aNum = aParts ? parseInt(aParts[aParts.length - 1]) : 0;
        const bNum = bParts ? parseInt(bParts[bParts.length - 1]) : 0;
        return bNum - aNum;
    });

    // Separate weekly and biweekly contests
    const weeklyContests = sortedContests.filter(([contestID]) => contestID.includes('Weekly'));
    const biweeklyContests = sortedContests.filter(([contestID]) => contestID.includes('Biweekly'));

    // Remove placeholder text
    weeklyContestsContainer.innerHTML = '';
    biweeklyContestsContainer.innerHTML = '';

    // Create dropdowns for weekly contests
    weeklyContests.forEach(([contestID, problems]) => {
        const contestDropdown = createContestDropdown(contestID, problems);
        weeklyContestsContainer.appendChild(contestDropdown);
    });

    // Create dropdowns for biweekly contests
    biweeklyContests.forEach(([contestID, problems]) => {
        const contestDropdown = createContestDropdown(contestID, problems);
        biweeklyContestsContainer.appendChild(contestDropdown);
    });
}

function createContestDropdown(contestID, problems) {
    const contestDropdown = document.createElement('details');
    contestDropdown.classList.add('contest-dropdown');
    const summary = document.createElement('summary');
    const summaryText = document.createElement('span');
    summaryText.textContent = contestID;
    const dropdownArrow = document.createElement('span');
    dropdownArrow.classList.add('dropdown-arrow');
    summary.appendChild(summaryText);
    summary.appendChild(dropdownArrow);
    contestDropdown.appendChild(summary);

    // Sort problems by Rating in ascending order
    problems.sort((a, b) => a.Rating - b.Rating);

    // Create checkboxes for each problem
    problems.forEach(problem => {
        const problemCheckbox = document.createElement('div');
        problemCheckbox.classList.add('problem-checkbox');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${problem.ContestSlug}-${problem.ProblemIndex}`;
        checkbox.checked = isChecked(problem.ContestSlug, problem.ProblemIndex);
        checkbox.addEventListener('change', () => {
            saveCheckboxState(problem.ContestSlug, problem.ProblemIndex, checkbox.checked, problems, contestDropdown);
        });
        const problemLink = document.createElement('a');
        problemLink.href = `https://leetcode.com/problems/${problem.TitleSlug}`;
        problemLink.target = '_blank';
        problemLink.textContent = `${problem.Title}`;
        problemLink.classList.add('problem-link');
        const problemRating = document.createElement('span');
        problemRating.textContent = `(Rating: ${Math.floor(problem.Rating)})`;
        problemRating.classList.add('problem-rating');
        const label = document.createElement('label');
        label.appendChild(checkbox);
        label.appendChild(problemLink);
        label.appendChild(problemRating);
        problemCheckbox.appendChild(label);
        contestDropdown.appendChild(problemCheckbox);
        if (checkAllProblemsChecked(problems)) {
            contestDropdown.classList.add('all-checked');
        }
    });

    // Add contest link when dropdown is open
    contestDropdown.addEventListener('toggle', () => {
        if (contestDropdown.open) {
            const contestLink = document.createElement('a');
            contestLink.href = `https://leetcode.com/contest/${problems[0].ContestSlug}`;
            contestLink.target = '_blank';
            contestLink.textContent = contestID;
            summary.innerHTML = '';
            summary.appendChild(contestLink);
            summary.appendChild(dropdownArrow);
        } else {
            summary.innerHTML = '';
            summary.appendChild(summaryText);
            summary.appendChild(dropdownArrow);
        }
    });

    return contestDropdown;
}

function isChecked(contestSlug, problemIndex) {
    const checkedProblems = JSON.parse(localStorage.getItem('checkedProblems') || '{}');
    return checkedProblems[`${contestSlug}-${problemIndex}`] || false;
}

function saveCheckboxState(contestSlug, problemIndex, checked, problems, contestDropdown) {
    let checkedProblems = JSON.parse(localStorage.getItem('checkedProblems') || '{}');
    checkedProblems[`${contestSlug}-${problemIndex}`] = checked;
    localStorage.setItem('checkedProblems', JSON.stringify(checkedProblems));
    if (checkAllProblemsChecked(problems)) {
        contestDropdown.classList.add('all-checked');
    } else {
        contestDropdown.classList.remove('all-checked');
    }
}

function checkAllProblemsChecked(problems) {
    return problems.every(problem => isChecked(problem.ContestSlug, problem.ProblemIndex));
}