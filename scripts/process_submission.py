import sys
import csv
import json
from datetime import datetime
from pathlib import Path
import uuid

def save_tweet(content, scheduled_time, tweet_uuid):
    tweet_data = {
        'uuid': tweet_uuid,
        'content': content,
        'scheduled_time': scheduled_time,
        'status': 'pending'
    }
    
    # Ensure directories exist
    Path('data/tweets').mkdir(parents=True, exist_ok=True)
    
    # Save to manual_tweets.csv
    manual_tweets_path = Path('data/tweets/manual_tweets.csv')
    file_exists = manual_tweets_path.exists()
    
    with open(manual_tweets_path, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['uuid', 'content', 'scheduled_time', 'status'])
        if not file_exists:
            writer.writeheader()
        writer.writerow(tweet_data)
    
    # Update master_tweets.csv
    master_tweets_path = Path('data/tweets/master_tweets.csv')
    master_exists = master_tweets_path.exists()
    
    with open(master_tweets_path, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['uuid', 'content', 'scheduled_time', 'status'])
        if not master_exists:
            writer.writeheader()
        writer.writerow(tweet_data)

def main():
    if len(sys.argv) != 4:
        print("Usage: python process_submission.py <content> <scheduled_time> <uuid>")
        sys.exit(1)
    
    content = sys.argv[1]
    scheduled_time = sys.argv[2]
    tweet_uuid = sys.argv[3]
    
    try:
        # Validate the scheduled time
        datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
        
        # Save the tweet
        save_tweet(content, scheduled_time, tweet_uuid)
        print(f"Tweet saved successfully with UUID: {tweet_uuid}")
        
    except ValueError as e:
        print(f"Error processing tweet: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()