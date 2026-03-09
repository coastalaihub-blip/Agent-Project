"""
Run this ONCE to create the Pinecone index.
Usage: python scripts/setup_pinecone.py
"""
import os
import sys
import time
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pinecone import Pinecone

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "ai-agent-platform")
API_KEY = os.environ["PINECONE_API_KEY"]


def main():
    pc = Pinecone(api_key=API_KEY)

    existing = [idx.name for idx in pc.list_indexes()]
    if INDEX_NAME in existing:
        print(f"Index '{INDEX_NAME}' already exists. Skipping creation.")
        index = pc.Index(INDEX_NAME)
        stats = index.describe_index_stats()
        print(f"Stats: {stats}")
        return

    print(f"Creating index '{INDEX_NAME}'...")
    pc.create_index_for_model(
        name=INDEX_NAME,
        cloud="aws",
        region="us-east-1",
        embed={
            "model": "llama-text-embed-v2",
            "field_map": {"text": "text"},
        },
    )

    # Wait for index to be ready
    print("Waiting for index to be ready...")
    for _ in range(30):
        desc = pc.describe_index(INDEX_NAME)
        if desc.status.get("ready", False):
            break
        time.sleep(3)
        print("  still initializing...")

    print(f"Index '{INDEX_NAME}' is ready!")
    index = pc.Index(INDEX_NAME)
    print(f"Host: {index._config.host}")


if __name__ == "__main__":
    main()
