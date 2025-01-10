import pandas as pd
from datetime import datetime, timedelta
import pytz

def reset_tweets_csv():
    # Define the Eastern Time posting schedule (24-hour format)
    et_times = ["04:00", "08:00", "12:00", "16:00", "19:00"]  # 4am, 8am, 12pm, 4pm, 7pm ET
    
    # Initialize timezone
    et_tz = pytz.timezone('US/Eastern')
    current_time = datetime.now(et_tz)
    
    # Create data list for next 7 days
    rows = []
    
    for i in range(7):
        current_date = current_time.date() + timedelta(days=i)
        date_str = current_date.strftime("%Y-%m-%d")
        
        for et_time in et_times:
            unique_id = f"CRYPTO_{date_str}_{et_time}".replace(":", "")
            et_dt_str = f"{date_str} {et_time}:00"
            
            row = {
                'id': unique_id,
                'timestamp': et_dt_str,
                'message': "",  # Empty as this will be generated at post time
                'posted': False,
                'type': "crypto_price",
                'scheduled_for': et_dt_str,
                'priority': 1.0,
                'source': "auto",
                'raw_data': ""
            }
            rows.append(row)
    
    # Create DataFrame and save to CSV
    df = pd.DataFrame(rows)
    df.to_csv('data/tweets.csv', index=False)
    print(f"Reset tweets.csv with {len(rows)} scheduled entries")

if __name__ == "__main__":
    reset_tweets_csv()