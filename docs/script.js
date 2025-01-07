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
        console.log('Auth code found in URL:', code);
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
        console.log('Starting auth callback process');
        try {
            console.log('Sending request with code:', code);
            const response = await fetch('https://api.github.com/repos/ImmutableType/twitter-poster/dispatches', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ghp_DDHu4lWqq9YUYRcDVvLIXN3xBPcTrg1aGI8j'
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
 
            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Response body:', responseText);
 
            if (response.ok) {
                window.history.replaceState({}, document.title, window.location.pathname);
                showMessage('Authentication processing...', 'info');
                location.reload();
            } else {
                console.error('Repository dispatch failed:', responseText);
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
 
        const scheduleDate = document.getElementById('scheduleDate').value;
        const scheduleTime = document.getElementById('scheduleTime').value;
        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
 
        const tweet = {
            content: tweetContent.value.trim(),
            scheduled_time: scheduledDateTime.toISOString(),
            uuid: crypto.randomUUID()
        };
 
        try {
            console.log('Submitting tweet:', tweet);
            const response = await fetch('https://api.github.com/repos/ImmutableType/twitter-poster/dispatches', {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ghp_DDHu4lWqq9YUYRcDVvLIXN3xBPcTrg1aGI8j'
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
            } else {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                
                if (response.status === 401) {
                    localStorage.removeItem('github_token');
                    window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubAuth.client_id}&scope=${githubAuth.scope}&state=${state}`;
                    return;
                }
                showMessage(`Error scheduling tweet: ${response.status}`, 'error');
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