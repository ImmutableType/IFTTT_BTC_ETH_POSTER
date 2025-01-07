import sys
import pandas as pd
import os
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_tweet(content, scheduled_time, uuid):
    try:
        # Ensure directories exist
        tweets_dir = 'data/tweets'
        os.makedirs(tweets_dir, exist_ok=True)
        logger.info(f"Ensuring directory exists: {tweets_dir}")

        tweet_data = {
            'content': [content],
            'scheduled_time': [scheduled_time],
            'uuid': [uuid],
            'status': ['pending']
        }
        
        df = pd.DataFrame(tweet_data)
        
        # Update manual_tweets.csv
        manual_tweets_path = os.path.join(tweets_dir, 'manual_tweets.csv')
        logger.info(f"Processing manual tweets file: {manual_tweets_path}")
        
        if os.path.exists(manual_tweets_path):
            existing_df = pd.read_csv(manual_tweets_path)
            df = pd.concat([existing_df, df], ignore_index=True)
        df.to_csv(manual_tweets_path, index=False)
        logger.info(f"Saved to manual tweets file")
        
        # Update master_tweets.csv
        master_tweets_path = os.path.join(tweets_dir, 'master_tweets.csv')
        logger.info(f"Processing master tweets file: {master_tweets_path}")
        
        if os.path.exists(master_tweets_path):
            master_df = pd.read_csv(master_tweets_path)
            df = pd.concat([master_df, df], ignore_index=True)
        df.to_csv(master_tweets_path, index=False)
        logger.info(f"Saved to master tweets file")
        
        return True

    except Exception as e:
        logger.error(f"Error processing tweet: {str(e)}")
        raise

if __name__ == "__main__":
    if len(sys.argv) != 4:
        logger.error("Incorrect number of arguments")
        print("Usage: python process_submission.py <content> <scheduled_time> <uuid>")
        sys.exit(1)
    
    content = sys.argv[1]
    scheduled_time = sys.argv[2]
    uuid = sys.argv[3]
    
    logger.info(f"Processing tweet: {content[:20]}... scheduled for {scheduled_time}")
    process_tweet(content, scheduled_time, uuid)