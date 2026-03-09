"""
RAG recall test — run before demo to verify >85% accuracy.
Usage: python scripts/test_recall.py --biz_id biz_demo
"""
import sys
import os
import argparse
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from dotenv import load_dotenv
load_dotenv()
from retriever import retrieve

TEST_QUERIES = [
    ("What time do you open?", "hours"),
    ("How do I book an appointment?", "appointments"),
    ("Do you accept insurance?", "insurance"),
    ("Where is the clinic?", "location"),
    ("How much is a consultation?", "fees"),
    ("Do you treat children?", "doctors"),
    ("Can I cancel my appointment?", "appointments"),
    ("What is the fee for teeth cleaning?", "fees"),
    ("Do you have emergency services?", "emergency"),
    ("What payment methods do you accept?", "fees"),
]


def test_recall(biz_id: str):
    passed = 0
    for query, expected_category in TEST_QUERIES:
        chunks = retrieve(query, biz_id, top_k=3)
        if not chunks:
            print(f"  FAIL: '{query}' → no results")
            continue
        categories = [c["category"] for c in chunks]
        if expected_category in categories:
            print(f"  PASS: '{query}' → {chunks[0]['text'][:60]}...")
            passed += 1
        else:
            print(f"  FAIL: '{query}' → expected '{expected_category}', got {categories}")

    pct = (passed / len(TEST_QUERIES)) * 100
    print(f"\nRecall: {passed}/{len(TEST_QUERIES)} ({pct:.0f}%)")
    if pct >= 85:
        print("PASS — ready for demo")
    else:
        print("FAIL — increase chunk overlap or review FAQ content")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--biz_id", default="biz_demo")
    args = parser.parse_args()
    test_recall(args.biz_id)
