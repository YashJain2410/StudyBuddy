# filename: studybuddy_with_report.py
import os
import json
from dotenv import load_dotenv
import requests
from datetime import datetime, timedelta
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

load_dotenv()

model = ChatGoogleGenerativeAI(model='gemini-2.5-flash')

system_prompt = """
You are StudyBuddy, a personalized, patient, and motivating study mentor for students. 
Your job is to help students learn effectively, stay focused, and feel encouraged.

Guidelines:
1. Tone & Personality:
   - Always be friendly, supportive, and encouraging.
   - Avoid being too formal; speak like a helpful mentor.
   - Keep answers clear, concise, and easy to understand.

2. Teaching Style:
   - Break concepts into simple steps with examples.
   - Adapt explanations to the student’s profile (goals, subjects, strengths, weaknesses, deadlines, preferred learning style).
   - Encourage curiosity and deeper thinking.

3. Interactive Learning:
   - After explaining, ask a short practice question to check understanding.
   - If the student struggles, give hints first, then provide the full solution.
   - Adjust difficulty based on the student’s level.

4. Feedback & Motivation:
   - Highlight strengths and progress regularly.
   - Point out weak areas gently and give actionable tips.
   - Always end with a motivating or positive message.

5. Content Grounding (if context provided):
   - If given context (notes, textbooks, uploaded docs), prioritize it when answering.
   - If unsure, admit it instead of guessing, and suggest how to find the answer.

6. Session End:
   - Summarize key takeaways.
   - Suggest the next topic or task.
   - Give one short motivational line.

Your mission: Be a reliable, empathetic mentor who makes studying easier, more effective, and less stressful for every student.
"""

chat_history = [SystemMessage(content=system_prompt)]

BACKEND_URL = os.getenv("REPORT_BACKEND_URL", "http://localhost:3000")
BACKEND_API_KEY = os.getenv("REPORT_BACKEND_API_KEY", None)
USER_ID = os.getenv("USER_ID", None)                                  

def fetch_report(user_id: str, date: str = None, timeout: int = 10):
    url = f"{BACKEND_URL.rstrip('/')}/api/report"
    payload = {"userId": user_id}
    if date:
        payload["date"] = date
    headers = {"Content-Type": "application/json"}
    if BACKEND_API_KEY:
        headers["Authorization"] = f"Bearer {BACKEND_API_KEY}"
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}

def build_report_prompt(report_json: dict):
    report_str = json.dumps(report_json, indent=2, ensure_ascii=False)
    prompt = f"""
User requested their daily study report. Below is the report JSON (do NOT invent any new numbers):
{report_str}

Instructions for you (StudyBuddy):
1. Produce a short, friendly 3-4 sentence summary highlighting the most important point
   (focus time and whether it improved vs previous day if the data exists).
2. Then provide a compact bulleted list of key metrics:
   - Focus minutes
   - Distracted minutes
   - Sleep/minisleeps
   - Interruptions
   - Points earned
   - Lectures watched (count + titles / URLs)
3. Offer 1-2 short actionable suggestions (if the report includes suggestion candidates, prefer them).
4. End with a single motivating sentence.
Keep the language encouraging and concise. If data is missing, say so concisely (e.g., "No previous-day data available").
Respond as the assistant reply (do not include JSON—plain text only).
"""
    return prompt

def extract_date_from_input(text: str):
    """If user says 'yesterday' or '2025-09-20', return date string YYYY-MM-DD, else None."""
    t = text.lower()
    if "yesterday" in t:
        return (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    import re
    m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if m:
        return m.group(1)
    return None

def handle_report_request(user_id: str, date: str = None):
    if not user_id:
        print("AI: No user id configured. Please set USER_ID env var or enter your user id.")
        return

    backend_resp = fetch_report(user_id=user_id, date=date)
    if backend_resp is None:
        print("AI: Failed to reach backend.")
        return

    if "error" in backend_resp:
        print("AI: Sorry — couldn't fetch report")
        return

    # Accept both { report: {...} } or direct report object
    report_json = backend_resp.get("report", backend_resp)


    #testing
    # report_json = {
    #     "report": {
    #         "userId": "user_123",
    #         "date": "2025-09-21",
    #         "metrics": {
    #         "total_session_minutes": 120,
    #         "focus_minutes": 85,
    #         "distract_minutes": 25,
    #         "sleep_minutes": 10,
    #         "interruptions": 6
    #         },
    #         "lectures_watched": [
    #         {"title": "Integration by Parts - Lecture 3", "url":"https://…", "minutes":26}
    #         ],
    #         "points": 175,
    #         "improvement": {"focus_minutes_pct": 12.5},
    #         "suggestions": ["Do 10 minutes of flashcards on integration", "Short walk before next session"],
    #         "raw_events_count": 312
    #     }
    # }


    report_prompt = build_report_prompt(report_json)
    chat_history.append(HumanMessage(content=report_prompt))
    result = model.invoke(chat_history)
    summary = result.content
    chat_history.append(AIMessage(content=summary))
    print("AI:", summary)

def get_ai_response():
    global USER_ID
    # if not USER_ID:
    #     USER_ID = input("Enter your user id (used to fetch report) or press Enter to skip: ").strip() or None


    print("Type your messages. To request report say 'report' or 'daily report' (you can say 'report for YYYY-MM-DD' or 'yesterday'). Type 'bye' to exit.")
    while True:
        user_input = input('You: ').strip()
        if user_input.lower() in {'bye', 'exit', 'quit'}:
            print("AI: Bye! Good luck studying.")
            break

        low = user_input.lower()
        report_keywords = ("report", "daily report", "my report", "send report", "show report", "summary of my day")
        if any(k in low for k in report_keywords):
            date = extract_date_from_input(user_input)
            handle_report_request(USER_ID, date)
            continue

        chat_history.append(HumanMessage(content=user_input))
        result = model.invoke(chat_history)
        chat_history.append(AIMessage(content=result.content))
        print("AI:", result.content)

def fetch_report_from_file(filename="report.json"):
    try:
        filepath = os.path.join(os.path.dirname(_file_), filename)
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        return {"error": f"Failed to read report file: {e}"}

if __name__ == "__main__":
    get_ai_response()
