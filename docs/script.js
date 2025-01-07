document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tweetForm');
    const tweetContent = document.getElementById('tweetContent');
    const charCount = document.getElementById('charCount');
    const message = document.getElementById('message');
    const scheduleDate = document.getElementById('scheduleDate');
    const scheduleHour = document.getElementById('scheduleHour');
    const scheduleMinute = document.getElementById('scheduleMinute');
    const scheduleAmPm = document.getElementById('scheduleAmPm');

    const githubAuth = {
        client_id: 'Ov23litVfJxg9kyhCYOs', // Replace with your actual client ID
        scope: 'repo'
    };

    // Check for auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        // Exchange code for token via GitHub Actions proxy
        handleAuthCallback(code);
        return;
    }

    // Initialize time selectors
    function initializeTimeSelectors() {
        // Hours (1-12)
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i.toString().padStart(2, '0');
            scheduleHour.appendChild(option);
        }

        // Minutes (00-59)
        for (let i = 0; i < 60; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i.toString().padStart(2, '0');
            scheduleMinute.appendChild(option);
        }
    }

    // Set default date and time
    function setDefaultDateTime() {
        const now = new Date();
        now.setHours(now.getHours() + 1);

        // Set default date
        const dateString = now.toISOString().split('T')[0];
        scheduleDate.value = dateString;
        scheduleDate.min = new Date().toISOString().split('T')[0];

        // Set default time
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12

        scheduleHour.value = hours;
        scheduleMinute.value = minutes;
        scheduleAmPm.value = ampm;
    }

    // Initialize the form
    initializeTimeSelectors();
    setDefaultDateTime();

    // Character counter
    tweetContent.addEventListener('input', () => {
        const remaining = 280 - tweetContent.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });

    async function handleAuthCallback(code) {
        try {
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: githubAuth.client_id,
                    code: code
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.access_token) {
                    localStorage.setItem('github_token', data.access_token);
                    // Remove code from URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            showMessage('Authentication failed', 'error');
        }
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('github_token');
        if (!token) {
            window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubAuth.client_id}&scope=${githubAuth.scope}`;
            return;
        }

        // Disable form during submission
        form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
        showMessage('Processing submission...', 'info');

        // Convert form time to Date object
        const selectedDate = new Date(scheduleDate.value);
        let hours = parseInt(scheduleHour.value);
        const minutes = parseInt(scheduleMinute.value);
        
        // Convert to 24-hour format
        if (scheduleAmPm.value === 'PM' && hours !== 12) {
            hours += 12;
        }
        if (scheduleAmPm.value === 'AM' && hours === 12) {
            hours = 0;
        }

        selectedDate.setHours(hours, minutes, 0, 0);

        const tweet = {
            content: tweetContent.value.trim(),
            scheduled_time: selectedDate.toISOString(),
            uuid: crypto.randomUUID()
        };

        try {
            console.log('Submitting tweet:', tweet);
            const response = await fetch('https://api.github.com/repos/ImmutableType/twitter-poster/dispatches', {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    event_type: 'tweet-submission',
                    client_payload: tweet
                })
            });

            if (response.ok) {
                console.log('Tweet scheduled successfully');
                showMessage('Tweet scheduled successfully!', 'success');
                form.reset();
                setDefaultDateTime();
            } else {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                showMessage(`Error scheduling tweet: ${response.status}`, 'error');
                
                // If unauthorized, clear token and redirect to auth
                if (response.status === 401) {
                    localStorage.removeItem('github_token');
                    window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubAuth.client_id}&scope=${githubAuth.scope}`;
                }
            }
        } catch (error) {
            console.error('Submission error:', error);
            showMessage('Error connecting to server', 'error');
        } finally {
            form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = false);
        }
    });

    function showMessage(text, type) {
        message.textContent = text;
        message.className = type;
        setTimeout(() => {
            message.textContent = '';
            message.className = '';
        }, 5000);
    }
});