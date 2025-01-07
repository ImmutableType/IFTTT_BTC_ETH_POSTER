document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tweetForm');
    const tweetContent = document.getElementById('tweetContent');
    const charCount = document.getElementById('charCount');
    const message = document.getElementById('message');
    
    const token = 'ghp_DDHu4lWqq9YUYRcDVvLIXN3xBPcTrg1aGI8j';
    const githubAuth = {
        client_id: 'Ov23litVfJxg9kyhCYOs',
        scope: 'repo'
    };

    console.log('DOM Loaded');
    
    // Set token if not exists
    if (!localStorage.getItem('github_token')) {
        localStorage.setItem('github_token', token);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        handleAuthCallback(code);
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('scheduleDate').min = today;
    
    tweetContent.addEventListener('input', () => {
        const remaining = 280 - tweetContent.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });

    async function handleAuthCallback(code) {
        try {
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            console.log('Using headers:', headers);

            const response = await fetch('https://api.github.com/repos/ImmutableType/twitter-poster/dispatches', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    event_type: 'oauth-callback',
                    client_payload: {
                        code: code,
                        callback_url: window.location.href,
                        state: localStorage.getItem('oauth_state')
                    }
                })
            });

            console.log('Response:', response.status);
            const responseText = await response.text();
            console.log('Response body:', responseText);

            if (response.ok) {
                showMessage('Authentication processing...', 'info');
                location.reload();
            } else {
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
                    'Authorization': `Bearer ${token}`
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
                showMessage(`Error scheduling tweet: ${response.status}`, 'error');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showMessage('Error connecting to server', 'error');
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