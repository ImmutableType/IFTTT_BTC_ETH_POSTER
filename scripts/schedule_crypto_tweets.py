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
       current_time = datetime.now()
       scheduled_time = datetime.strptime(row['scheduled_for'], "%Y-%m-%d %H:%M:00")
       
       # Only process if it's time to post
       if current_time >= scheduled_time:
           # Handle dynamic crypto price posts
           if row['type'] == 'crypto_price':
               prices = get_crypto_prices()
               if prices is None:
                   continue  # Skip this iteration if we hit rate limit
               message = create_crypto_message(prices)
           
           if send_tweet(message):
               df.at[index, 'posted'] = True
               print(f"Posted tweet: {message}")
               time.sleep(2)  # Add small delay between posts
   
   df.to_csv('data/tweets.csv', index=False)

def schedule_crypto_tweets():
   # Define the Eastern Time posting schedule (24-hour format)
   et_times = ["04:00", "08:00", "12:00", "16:00", "19:00"]  # 4am, 8am, 12pm, 4pm, 7pm ET
   
   # Initialize timezone
   et_tz = pytz.timezone('US/Eastern')
   
   # Create data list
   rows = []
   
   # Schedule for next 7 days
   for i in range(7):
       # Get the date for this iteration
       current_date = datetime.now() + timedelta(days=i)
       date_str = current_date.strftime("%Y-%m-%d")
       
       # Schedule each time slot for this date
       for et_time in et_times:
           # Create unique ID using current timestamp
           unique_id = f"CRYPTO{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
           
           # Create ET datetime string
           et_dt_str = f"{date_str} {et_time}:00"
           
           # Create the row
           row = {
               'id': unique_id,
               'timestamp': et_dt_str,
               'message': "CRYPTO_PRICE_PLACEHOLDER",
               'posted': "False",
               'type': "crypto_price",
               'scheduled_for': et_dt_str,
               'priority': "1.0",
               'source': "auto",
               'raw_data': ""
           }
           rows.append(row)
   
   # Create DataFrame and save to CSV
   df = pd.DataFrame(rows)
   df.to_csv('data/tweets.csv', index=False)

if __name__ == "__main__":
   schedule_crypto_tweets()