import os
import csv
import pandas as pd
import requests
from datetime import datetime, timedelta
import pytz
import time

def get_crypto_prices():
    url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if 'bitcoin' in data and 'ethereum' in data:
                return {
                    'btc': data['bitcoin']['usd'],
                    'eth': data['ethereum']['usd']
                }
        elif response.status_code == 429:
            print("Rate limit reached, waiting 60 seconds...")
            time.sleep(60)  # Wait 60 seconds before next attempt
            return None
        print(f"Error: Unexpected API response: {response.text}")
        return None
    except Exception as e:
        print(f"Error fetching crypto prices: {e}")
        return None

def create_crypto_message(prices):
    # Convert UTC to Eastern Time
    et_tz = pytz.timezone('US/Eastern')
    utc_time = datetime.now(pytz.UTC)
    et_time = utc_time.astimezone(et_tz)
    current_time = et_time.strftime("%Y-%m-%d %I:%M %p ET")
    
    return f"Crypto Price Update 🚨\nBTC: ${prices['btc']:,} USD\nETH: ${prices['eth']:,} USD\n\n{current_time}"

def send_tweet(message):
    webhook_url = os.getenv('IFTTT_WEBHOOK_URL')
    if not webhook_url:
        print("Error: IFTTT_WEBHOOK_URL environment variable not set")
        return False
        
    try:
        response = requests.post(
            webhook_url,
            json={"value1": message}
        )
        print(f"Tweet sent with status code: {response.status_code}")
        if response.status_code != 200:
            print(f"Error: Unexpected status code {response.status_code}")
            return False
        return True
    except Exception as e:
        print(f"Error sending tweet: {e}")
        return False

def process_tweets():
    # Read the CSV file
    df = pd.read_csv('data/tweets.csv', 
                     lineterminator='\n',
                     quotechar='"',
                     escapechar='\\',
                     on_bad_lines='warn',
                     encoding='utf-8')
    
    df.columns = df.columns.str.strip()
    
    # Get current time in ET
    et_tz = pytz.timezone('US/Eastern')
    current_time = datetime.now(et_tz)
    
    # Filter for unposted tweets that are due
    unposted = df[df['posted'].astype(str).str.lower() == 'false']
    
    # Process each tweet
    for index, row in unposted.iterrows():
        scheduled_time = datetime.strptime(row['scheduled_for'], "%Y-%m-%d %H:%M:00")
        scheduled_time = et_tz.localize(scheduled_time)
        
        # Only process if it's time to post
        if current_time >= scheduled_time:
            print(f"\nProcessing scheduled tweet for: {scheduled_time.strftime('%Y-%m-%d %I:%M %p ET')}")
            
            # Handle dynamic crypto price posts
            if row['type'] == 'crypto_price':
                prices = get_crypto_prices()
                if prices is None:
                    print("Skipping due to rate limit...")
                    continue
                message = create_crypto_message(prices)
                
                if send_tweet(message):
                    df.at[index, 'posted'] = True
                    print(f"Successfully posted tweet for {scheduled_time.strftime('%Y-%m-%d %I:%M %p ET')}")
                    time.sleep(5)  # Increased delay between successful posts
            else:
                message = row['message']
                if send_tweet(message):
                    df.at[index, 'posted'] = True
                    print(f"Successfully posted non-crypto tweet")
                    time.sleep(2)
    
    # Save updates back to CSV
    df.to_csv('data/tweets.csv', index=False, quoting=csv.QUOTE_MINIMAL)
    print("\nFinished processing tweets")

if __name__ == "__main__":
    process_tweets()