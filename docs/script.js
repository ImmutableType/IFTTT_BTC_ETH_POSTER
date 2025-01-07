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

    console.log('DOM Loaded, checking for auth code...');

    // Check for auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        console.log('Auth code found in URL');
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
        console.log('Starting auth callback process');
        try {
            console.log('Sending repository dispatch for code exchange');
            // Use repository dispatch to securely exchange the code
            const response = await fetch('https://api.github.com/repos/ImmutableType/twitter-poster/dispatches', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'oauth-callback',
                    client_payload: {
                        code: code,
                        callback_url: window.location.href,
                        state: localStorage.getItem('oauth_state')
                    }
                })
            });

            console.log('Repository dispatch response status:', response.status);
            if (response.ok) {
                console.log('Repository dispatch successful');
                // Listen for response via repository dispatch
                // Token will be stored in localStorage when received
                window.history.replaceState({}, document.title, window.location.pathname);
                showMessage('Authentication processing...', 'info');
                location.reload();
            } else {
                const errorText = await response.text();
                console.error('Repository dispatch failed:', errorText);
                showMessage('Authentication failed', 'error');
            }
        } catch (error) {
            console.error('Auth error:', error);
            showMessage('Authentication failed', 'error');
        }
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        // Generate and store state for OAuth flow
        const state = crypto.randomUUID();
        localStorage.setItem('oauth_state', state);

        // Check auth and redirect if needed
        if (!localStorage.getItem('github_token')) {
            console.log('No token found, starting OAuth flow');
            window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubAuth.client_id}&scope=${githubAuth.scope}&state=${state}`;
            return;
        }

        // Rest of the form submission code...
        [Previous form submission code remains the same]
    });

    function showMessage(text, type) {
        console.log(`Showing message: ${text} (${type})`);
        message.textContent = text;
        message.className = type;
        setTimeout(() => {
            message.textContent = '';
            message.className = '';
        }, 5000);
    }
});