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
    et_tz = pytz.timezone('US/Eastern')
    current_time = datetime.now(et_tz)
    time_str = current_time.strftime("%Y-%m-%d %I:%M %p ET")
    
    return f"Crypto Price Update 🚨\nBTC: ${prices['btc']:,} USD\nETH: ${prices['eth']:,} USD\n\n{time_str}"

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
    print(f"\nStarting tweet processing at {datetime.now(pytz.timezone('US/Eastern'))}")
    
    try:
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
        
        # Start from tomorrow for past dates
        if current_time.hour >= 19:  # After 7 PM
            start_date = (current_time + timedelta(days=1)).date()
        else:
            start_date = current_time.date()
            
        # Find unposted tweets for today or future
        unposted = df[
            (df['posted'].astype(str).str.lower() == 'false') & 
            (pd.to_datetime(df['scheduled_for']).dt.date >= start_date)
        ].copy()
        
        if len(unposted) == 0:
            print("No unposted tweets found")
            return
            
        # Convert scheduled_for to datetime with timezone
        unposted['scheduled_for'] = pd.to_datetime(unposted['scheduled_for'])
        unposted = unposted.sort_values('scheduled_for')
        
        # Process only the first due tweet
        for index, row in unposted.iterrows():
            scheduled_time = row['scheduled_for'].replace(tzinfo=et_tz)
            
            if current_time >= scheduled_time:
                print(f"\nProcessing tweet scheduled for: {scheduled_time.strftime('%Y-%m-%d %I:%M %p ET')}")
                
                if row['type'] == 'crypto_price':
                    prices = get_crypto_prices()
                    if prices is None:
                        print("Failed to get crypto prices, skipping...")
                        break
                    
                    message = create_crypto_message(prices)
                    if send_tweet(message):
                        df.at[index, 'posted'] = True
                        print(f"Successfully posted tweet for {scheduled_time.strftime('%Y-%m-%d %I:%M %p ET')}")
                        # Save after successful post
                        df.to_csv('data/tweets.csv', index=False, quoting=csv.QUOTE_MINIMAL)
                        break  # Exit after one successful post
                    else:
                        print("Failed to post tweet, will retry next run")
                        break
            else:
                print(f"No tweets due for posting. Next tweet scheduled for {scheduled_time.strftime('%Y-%m-%d %I:%M %p ET')}")
                break
        
    except Exception as e:
        print(f"Error in process_tweets: {e}")

if __name__ == "__main__":
    process_tweets()