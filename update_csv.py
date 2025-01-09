import os
import csv
import pandas as pd
import requests
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

WEBHOOK_URL = os.getenv('IFTTT_WEBHOOK_URL')

def send_tweet(message):
    try:
        response = requests.post(
            WEBHOOK_URL,
            json={"value1": message}
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending tweet: {e}")
        return False

def process_tweets():
    # Read the CSV with specific parameters to handle potential formatting issues
    df = pd.read_csv('data/tweets.csv', 
                     lineterminator='\n',  # Explicit line terminator
                     quotechar='"',        # Explicit quote character
                     escapechar='\\',      # Add escape character
                     on_bad_lines='warn',  # Don't fail on bad lines
                     encoding='utf-8')     # Explicit encoding
    
    # Clean up any potential whitespace in column names
    df.columns = df.columns.str.strip()
    
    # Find unposted tweets
    unposted = df[df['posted'].astype(str).str.lower() == 'false']
    
    for index, row in unposted.iterrows():
        if send_tweet(row['message']):
            df.at[index, 'posted'] = True
            print(f"Posted tweet: {row['message']}")
    
    # Save updated CSV
    df.to_csv('data/tweets.csv', index=False, quoting=csv.QUOTE_MINIMAL)

if __name__ == "__main__":
    process_tweets()