document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tweetForm');
    const tweetContent = document.getElementById('tweetContent');
    const charCount = document.getElementById('charCount');
    const message = document.getElementById('message');
    const scheduleDate = document.getElementById('scheduleDate');
    const scheduleHour = document.getElementById('scheduleHour');
    const scheduleMinute = document.getElementById('scheduleMinute');
    const scheduleAmPm = document.getElementById('scheduleAmPm');

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

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

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

        // Check if selected time is in the past
        if (selectedDate < new Date()) {
            showMessage('Cannot schedule tweets in the past', 'error');
            return;
        }

        const tweet = {
            content: tweetContent.value,
            scheduled_time: selectedDate.toISOString(),
            uuid: crypto.randomUUID()
        };

        try {
            const response = await fetch('https://api.github.com/repos/ImmutableType/twitter-poster/dispatches', {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.everest-preview+json',
                    'Authorization': `Bearer ${TWEET_MANAGER_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_type: 'tweet-submission',
                    client_payload: tweet
                })
            });

            if (response.status === 204) {
                showMessage('Tweet scheduled successfully!', 'success');
                form.reset();
                setDefaultDateTime();
            } else {
                showMessage('Error scheduling tweet.', 'error');
                console.error('Response:', response);
            }
        } catch (error) {
            showMessage('Error connecting to server.', 'error');
            console.error('Error:', error);
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

    // Validate date changes
    scheduleDate.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            showMessage('Cannot schedule tweets in the past', 'error');
            scheduleDate.value = new Date().toISOString().split('T')[0];
        }
    });
});