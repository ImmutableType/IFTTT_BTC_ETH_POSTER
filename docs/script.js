document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tweetForm');
    const tweetContent = document.getElementById('tweetContent');
    const charCount = document.getElementById('charCount');
    const message = document.getElementById('message');

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('scheduleDate').min = today;
    
    tweetContent.addEventListener('input', () => {
        const remaining = 280 - tweetContent.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
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
                    'Content-Type': 'application/json'
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
                showMessage('Error scheduling tweet. Please try again.', 'error');
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