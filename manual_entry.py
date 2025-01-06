import csv
import uuid
from datetime import datetime
import os

def add_manual_tweet(message, scheduled_for=None):
    # CSV file path
    csv_file = 'data/tweets.csv'
    
    # Generate unique ID with 'M' prefix for manual
    tweet_id = f"M{uuid.uuid4().hex[:7]}"
    
    # Current timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # If no schedule time provided, use current time
    if scheduled_for is None:
        scheduled_for = timestamp
        
    # New tweet entry
    new_tweet = {
        'id': tweet_id,
        'timestamp': timestamp,
        'message': message,
        'posted': False,
        'type': 'manual',
        'scheduled_for': scheduled_for,
        'priority': 1,
        'source': 'manual',
        'raw_data': ''
    }
    
    # Read existing tweets to preserve headers
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        existing_tweets = list(reader)
    
    # Add new tweet
    existing_tweets.append(new_tweet)
    
    # Write back to CSV
    with open(csv_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(existing_tweets)
    
    return tweet_id