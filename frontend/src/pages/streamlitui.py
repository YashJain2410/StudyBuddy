# filename: streamlit_app.py
import streamlit as st
from chatbo3 import (
    chat_history,
    model,
    extract_date_from_input,
    handle_report_request,
)
from langchain_core.messages import HumanMessage, AIMessage

# Streamlit Page Config
st.set_page_config(page_title="📚 StudyBuddy", layout="wide")

st.title("📚 StudyBuddy – Your Study Mentor")
st.write("Chat with your personal AI mentor. Ask study questions or request your *daily report*.")

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []

# Chat message display
for msg in st.session_state.messages:
    if msg["role"] == "user":
        st.chat_message("user").markdown(msg["content"])
    else:
        st.chat_message("assistant").markdown(msg["content"])

# Input box
user_input = st.chat_input("Type your message here...")

if user_input:
    # Show user message
    st.chat_message("user").markdown(user_input)
    st.session_state.messages.append({"role": "user", "content": user_input})

    # Detect if it's a report request
    low = user_input.lower()
    report_keywords = ("report", "daily report", "my report", "send report", "show report", "summary of my day")

    if any(k in low for k in report_keywords):
        date = extract_date_from_input(user_input)
        with st.spinner("Fetching your report..."):
            try:
                handle_report_request("user_123", date)  # replace "user_123" with your USER_ID env
                ai_reply = chat_history[-1].content
            except Exception as e:
                ai_reply = f"⚠ Error fetching report: {e}"
    else:
        # Normal AI chat
        chat_history.append(HumanMessage(content=user_input))
        with st.spinner("Thinking..."):
            result = model.invoke(chat_history)
        chat_history.append(AIMessage(content=result.content))
        ai_reply = result.content

    # Show AI reply
    st.chat_message("assistant").markdown(ai_reply)
    st.session_state.messages.append({"role": "assistant", "content": ai_reply})