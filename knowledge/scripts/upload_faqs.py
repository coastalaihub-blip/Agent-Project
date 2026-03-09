"""
Upload FAQs to Pinecone.
Usage:
    python scripts/upload_faqs.py --vertical clinic --biz_id biz_demo
    python scripts/upload_faqs.py --vertical call_center --biz_id biz_demo_cc
"""
import os
import sys
import json
import argparse
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pinecone import Pinecone

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "ai-agent-platform")
FAQS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "faqs")


def upload_faqs(vertical: str, biz_id: str):
    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
    index = pc.Index(INDEX_NAME)
    namespace = biz_id if biz_id.startswith("biz_") else f"biz_{biz_id}"

    faq_file = os.path.join(FAQS_DIR, f"{vertical}_faqs.json")
    if not os.path.exists(faq_file):
        print(f"FAQ file not found: {faq_file}")
        sys.exit(1)

    with open(faq_file) as f:
        faqs = json.load(f)

    records = []
    for i, faq in enumerate(faqs):
        records.append({
            "id": f"{biz_id}_{vertical}_{i:03d}",
            "text": f"Q: {faq['question']}\nA: {faq['answer']}",
            "category": faq.get("category", "faq"),
            "vertical": vertical,
            "business_id": biz_id,
            "type": faq.get("type", "faq"),
        })

    # Upload in batches of 20
    batch_size = 20
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        index.upsert_records(namespace=namespace, records=batch)
        print(f"  Uploaded records {i+1}–{min(i+batch_size, len(records))}")

    print(f"\nDone. Uploaded {len(records)} records to namespace '{namespace}'")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--vertical", required=True, choices=["clinic", "call_center"])
    parser.add_argument("--biz_id", required=True)
    args = parser.parse_args()
    upload_faqs(args.vertical, args.biz_id)
