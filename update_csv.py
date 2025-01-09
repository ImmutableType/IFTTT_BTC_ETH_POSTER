import os
import csv
import pandas as pd
import requests
from datetime import datetime
import pytz

def get_crypto_prices():
    url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
    try:
        response = requests.get(url)
        data = response.json()
        return {
            'btc': data['bitcoin']['usd'],
            'eth': data['ethereum']['usd']
        }
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
    try:
        response = requests.post(
            os.getenv('IFTTT_WEBHOOK_URL'),
            json={"value1": message}
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending tweet: {e}")
        return False

def process_tweets():
    df = pd.read_csv('data/tweets.csv', 
                     lineterminator='\n',
                     quotechar='"',
                     escapechar='\\',
                     on_bad_lines='warn',
                     encoding='utf-8')
    
    df.columns = df.columns.str.strip()
    unposted = df[df['posted'].astype(str).str.lower() == 'false']
    
    for index, row in unposted.iterrows():
        message = row['message']
        
        # Handle dynamic crypto price posts
        if row['type'] == 'crypto_price':
            prices = get_crypto_prices()
            if prices is None:
                continue
            message = create_crypto_message(prices)
        
        if send_tweet(message):
            df.at[index, 'posted'] = True
            print(f"Posted tweet: {message}")
    
    df.to_csv('data/tweets.csv', index=False, quoting=csv.QUOTE_MINIMAL)

if __name__ == "__main__":
    process_tweets()