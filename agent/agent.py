"""
LangChain agent core — Sid's implementation.

Receives caller text → retrieves context from Pinecone → runs Claude → returns structured response.
"""
import os
import json
import httpx
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage, SystemMessage
from langchain.memory import ConversationBufferMemory

from prompts.clinic import CLINIC_SYSTEM_PROMPT
from prompts.call_center import CALL_CENTER_SYSTEM_PROMPT

load_dotenv()

KNOWLEDGE_SERVICE_URL = os.getenv("KNOWLEDGE_SERVICE_URL", "http://localhost:8003")

# Per-call session memory: call_sid → ConversationBufferMemory
_session_memories: dict[str, ConversationBufferMemory] = {}


def get_session_memory(call_sid: str) -> ConversationBufferMemory:
    if call_sid not in _session_memories:
        _session_memories[call_sid] = ConversationBufferMemory(return_messages=True)
    return _session_memories[call_sid]


def clear_session_memory(call_sid: str):
    _session_memories.pop(call_sid, None)


def _get_system_prompt(vertical: str, biz_name: str, biz_config: dict) -> str:
    hours = biz_config.get("business_hours", "9am to 6pm, Monday to Saturday")
    doctors = biz_config.get("doctors", [])
    services = biz_config.get("services", [])

    if vertical == "clinic":
        return CLINIC_SYSTEM_PROMPT.format(
            biz_name=biz_name,
            business_hours=hours,
            doctors=", ".join(doctors) if doctors else "our doctors",
            services=", ".join(services) if services else "general consultations",
        )
    elif vertical == "call_center":
        return CALL_CENTER_SYSTEM_PROMPT.format(
            biz_name=biz_name,
            business_hours=hours,
        )
    else:
        return CLINIC_SYSTEM_PROMPT.format(
            biz_name=biz_name,
            business_hours=hours,
            doctors="our doctors",
            services="our services",
        )


async def retrieve_context(query: str, biz_id: str) -> str:
    """Call Nandana's knowledge service to get relevant FAQ chunks."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{KNOWLEDGE_SERVICE_URL}/retrieve",
                json={"query": query, "biz_id": biz_id, "top_k": 3},
            )
            resp.raise_for_status()
            chunks = resp.json().get("chunks", [])
            return "\n\n".join(f"- {c['text']}" for c in chunks) if chunks else ""
    except Exception as e:
        print(f"[agent] Knowledge retrieval failed: {e}")
        return ""


async def run_agent(
    text: str,
    biz_id: str,
    biz_name: str,
    vertical: str,
    biz_config: dict,
    call_sid: str,
) -> dict:
    """
    Main agent function.
    Returns: { text, intent, action, action_data, escalate, summary }
    """
    llm = ChatAnthropic(
        model="claude-sonnet-4-6",
        api_key=os.environ["ANTHROPIC_API_KEY"],
        max_tokens=512,
        temperature=0.3,
    )

    # Retrieve relevant context from Pinecone
    context = await retrieve_context(text, biz_id)

    # Build system prompt
    system_prompt = _get_system_prompt(vertical, biz_name, biz_config)
    if context:
        system_prompt += f"\n\n## Relevant Information\n{context}"

    # Get or create session memory
    memory = get_session_memory(call_sid)
    history = memory.chat_memory.messages

    # Build messages
    messages = [SystemMessage(content=system_prompt)] + history + [HumanMessage(content=text)]

    # Add output format instruction
    messages[-1] = HumanMessage(
        content=text + "\n\n[Respond with JSON: {\"text\": \"...\", \"intent\": \"...\", \"action\": null|\"book_appointment\"|\"escalate\"|\"answer_faq\", \"action_data\": null|{...}, \"escalate\": false|true, \"summary\": \"...\"}]"
    )

    response = llm.invoke(messages)
    raw = response.content.strip()

    # Parse JSON response
    try:
        # Extract JSON if wrapped in markdown
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        result = json.loads(raw)
    except Exception:
        # Fallback if Claude doesn't return valid JSON
        result = {
            "text": raw,
            "intent": "unknown",
            "action": None,
            "action_data": None,
            "escalate": False,
            "summary": text[:100],
        }

    # Update session memory
    memory.chat_memory.add_user_message(text)
    memory.chat_memory.add_ai_message(result.get("text", ""))

    # Force escalate if caller demands it
    if any(phrase in text.lower() for phrase in ["speak to someone", "talk to a human", "manager", "urgent", "emergency"]):
        result["escalate"] = True
        result["intent"] = "escalate"

    return result
