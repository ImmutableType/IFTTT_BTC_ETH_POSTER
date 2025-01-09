import csv
from datetime import datetime, timedelta
import pytz

def schedule_crypto_tweets():
    # Define the Eastern Time posting schedule
    et_times = ["04:00", "08:00", "12:00", "16:00", "19:00"]  # 4am, 8am, 12pm, 4pm, 7pm ET
    
    # Convert ET times to UTC for storage
    et_tz = pytz.timezone('US/Eastern')
    utc_tz = pytz.UTC
    
    with open('data/tweets.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        
        # Schedule for next 7 days
        for i in range(7):
            date = (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
            
            for et_time in et_times:
                # Create ET datetime
                et_dt_str = f"{date} {et_time}"
                et_dt = et_tz.localize(datetime.strptime(et_dt_str, "%Y-%m-%d %H:%M"))
                
                # Convert to UTC for storage
                utc_dt = et_dt.astimezone(utc_tz)
                
                row = [
                    f"CRYPTO{datetime.now().strftime('%Y%m%d%H%M%S')}",  # ID
                    utc_dt.strftime("%Y-%m-%d %H:%M:00"),  # timestamp
                    "CRYPTO_PRICE_PLACEHOLDER",  # message (will be replaced at runtime)
                    "False",  # posted
                    "crypto_price",  # type
                    utc_dt.strftime("%Y-%m-%d %H:%M:00"),  # scheduled_for
                    "1.0",  # priority
                    "auto",  # source
                    ""  # raw_data
                ]
                writer.writerow(row)

if __name__ == "__main__":
    schedule_crypto_tweets()