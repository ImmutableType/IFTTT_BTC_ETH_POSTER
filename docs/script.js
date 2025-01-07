document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tweetForm');
    const tweetContent = document.getElementById('tweetContent');
    const charCount = document.getElementById('charCount');
    
    tweetContent.addEventListener('input', () => {
        const remaining = 280 - tweetContent.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        window.location.href = `https://github.com/ImmutableType/twitter-poster/issues/new?title=New+Tweet&body=${encodeURIComponent(
            `Tweet: ${tweetContent.value}\nDate: ${document.getElementById('scheduleDate').value}\nTime: ${document.getElementById('scheduleTime').value}`
        )}`;
    });
});
