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
        client_id: 'Ov23litVfJxg9kyhCYOs',
        scope: 'repo'
    };
 
    console.log('DOM Loaded, checking for auth code...');
 
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        console.log('Auth code found in URL');
        handleAuthCallback(code);
        return;
    }
 
    function initializeTimeSelectors() {
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i.toString().padStart(2, '0');
            scheduleHour.appendChild(option);
        }
 
        for (let i = 0; i < 60; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = i.toString().padStart(2, '0');
            scheduleMinute.appendChild(option);
        }
    }
 
    function setDefaultDateTime() {
        const now = new Date();
        now.setHours(now.getHours() + 1);
 
        const dateString = now.toISOString().split('T')[0];
        scheduleDate.value = dateString;
        scheduleDate.min = new Date().toISOString().split('T')[0];
 
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
 
        scheduleHour.value = hours;
        scheduleMinute.value = minutes;
        scheduleAmPm.value = ampm;
    }
 
    initializeTimeSelectors();
    setDefaultDateTime();
 
    tweetContent.addEventListener('input', () => {
        const remaining = 280 - tweetContent.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });
 
    async function handleAuthCallback(code) {
        console.log('Starting auth callback process');
        try {
            console.log('Sending repository dispatch for code exchange');
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
 
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
 
        const state = crypto.randomUUID();
        localStorage.setItem('oauth_state', state);
 
        if (!localStorage.getItem('github_token')) {
            console.log('No token found, starting OAuth flow');
            window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubAuth.client_id}&scope=${githubAuth.scope}&state=${state}`;
            return;
        }
 
        form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
        showMessage('Processing submission...', 'info');
 
        const selectedDate = new Date(scheduleDate.value);
        let hours = parseInt(scheduleHour.value);
        const minutes = parseInt(scheduleMinute.value);
 
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
                    'Authorization': `Bearer ${localStorage.getItem('github_token')}`
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
                
                if (response.status === 401) {
                    localStorage.removeItem('github_token');
                    window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubAuth.client_id}&scope=${githubAuth.scope}&state=${state}`;
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
        console.log(`Showing message: ${text} (${type})`);
        message.textContent = text;
        message.className = type;
        setTimeout(() => {
            message.textContent = '';
            message.className = '';
        }, 5000);
    }
 });