WEATHER APPLICATION - FLASK + SQLITE

Features:
1. Search weather for cities worldwide.
2. City suggestions while typing (for example Rajahmundry, Rajanagaram).
3. Search history stored in SQLite database.
4. Click a history item to search it again.
5. Delete individual history items or clear all history.
6. Responsive UI for desktop and mobile.

SETUP (Windows Command Prompt)

1. Open Command Prompt in this Weather folder.
2. Create virtual environment:
   python -m venv venv
3. Activate it:
   venv\Scripts\activate
4. Install packages:
   pip install -r requirements.txt
5. Run:
   python app.py
6. Open in browser:
   http://127.0.0.1:5000

API KEY
The project currently uses the OpenWeather API key that was present in the original JavaScript file. For a safer setup, set your own key before running:

set OPENWEATHER_API_KEY=YOUR_API_KEY
python app.py

The SQLite database file weather_history.db is created automatically the first time the app starts.