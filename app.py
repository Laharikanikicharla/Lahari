from flask import Flask, render_template, request, jsonify
import sqlite3
import requests
from datetime import datetime
import os

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'weather_history.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT NOT NULL,
        searched_at TEXT NOT NULL
    )''')
    conn.commit()
    conn.close()


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/weather')
def weather():
    city = request.args.get('city', '').strip()
    if not city:
        return jsonify({'error': 'Please enter a city name.'}), 400

    try:
        response = requests.get(
            'https://api.openweathermap.org/data/2.5/weather',
            params={'q': city, 'appid': API_KEY, 'units': 'metric'},
            timeout=10
        )
        data = response.json()
        if response.status_code != 200:
            return jsonify({'error': data.get('message', 'City not found.')}), response.status_code

        conn = get_db()
        conn.execute(
            'INSERT INTO search_history (city, searched_at) VALUES (?, ?)',
            (data.get('name', city), datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        )
        conn.commit()
        conn.close()

        return jsonify({
            'city': data['name'],
            'country': data.get('sys', {}).get('country', ''),
            'description': data['weather'][0]['description'].title(),
            'temperature': round(data['main']['temp']),
            'feels_like': round(data['main']['feels_like']),
            'humidity': data['main']['humidity'],
            'wind_speed': round(data['wind']['speed'] * 3.6, 1),
            'icon': f"https://openweathermap.org/img/wn/{data['weather'][0]['icon']}@2x.png"
        })
    except requests.RequestException:
        return jsonify({'error': 'Unable to connect to the weather service.'}), 503


@app.route('/api/history')
def history():
    conn = get_db()
    rows = conn.execute(
        'SELECT id, city, searched_at FROM search_history ORDER BY id DESC LIMIT 20'
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route('/api/history/<int:history_id>', methods=['DELETE'])
def delete_history(history_id):
    conn = get_db()
    conn.execute('DELETE FROM search_history WHERE id = ?', (history_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/history', methods=['DELETE'])
def clear_history():
    conn = get_db()
    conn.execute('DELETE FROM search_history')
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/cities')
def cities():
    query = request.args.get('q', '').strip()
    if len(query) < 2:
        return jsonify([])

    try:
        response = requests.get(
            'https://api.openweathermap.org/geo/1.0/direct',
            params={'q': query, 'limit': 10, 'appid': API_KEY},
            timeout=10
        )
        if response.status_code != 200:
            return jsonify([])
        results = response.json()
        suggestions = []
        seen = set()
        for item in results:
            label = item.get('name', '')
            state = item.get('state')
            country = item.get('country', '')
            if state:
                label += f', {state}'
            if country:
                label += f', {country}'
            key = label.lower()
            if key not in seen:
                suggestions.append(label)
                seen.add(key)
        return jsonify(suggestions)
    except requests.RequestException:
        return jsonify([])


if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='127.0.0.1', port=5000)