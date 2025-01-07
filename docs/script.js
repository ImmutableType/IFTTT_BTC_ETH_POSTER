document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tweetForm');
    const tweetContent = document.getElementById('tweetContent');
    const charCount = document.getElementById('charCount');
    const message = document.getElementById('message');
    
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

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('scheduleDate').min = today;
    
    tweetContent.addEventListener('input', () => {
        const remaining = 280 - tweetContent.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });

    async function handleAuthCallback(code) {
        console.log('Starting auth callback process');
        try {
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

            if (response.ok) {
                window.history.replaceState({}, document.title, window.location.pathname);
                showMessage('Authentication processing...', 'info');
                location.reload();
            } else {
                console.error('Repository dispatch failed:', await response.text());
                showMessage('Authentication failed', 'error');
            }
        } catch (error) {
            console.error('Auth error:', error);
            showMessage('Authentication failed', 'error');
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const state = crypto.randomUUID();
        localStorage.setItem('oauth_state', state);

        if (!localStorage.getItem('github_token')) {
            window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubAuth.client_id}&scope=${githubAuth.scope}&state=${state}`;
            return;
        }

        form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
        showMessage('Processing submission...', 'info');

        const scheduleDate = document.getElementById('scheduleDate').value;
        const scheduleTime = document.getElementById('scheduleTime').value;
        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

        const tweet = {
            content: tweetContent.value.trim(),
            scheduled_time: scheduledDateTime.toISOString(),
            uuid: crypto.randomUUID()
        };

        try {
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
                showMessage('Tweet scheduled successfully!', 'success');
                form.reset();
            } else {
                if (response.status === 401) {
                    localStorage.removeItem('github_token');
                    window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubAuth.client_id}&scope=${githubAuth.scope}&state=${state}`;
                    return;
                }
                showMessage(`Error scheduling tweet: ${response.status}`, 'error');
            }
        } catch (error) {
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