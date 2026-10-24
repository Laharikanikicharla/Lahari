const searchInputBox = document.getElementById('search_inputbox');
const searchButton = document.getElementById('search_icon_container');
const suggestionsBox = document.getElementById('city_suggestions');
const errorMessage = document.getElementById('error_message');
const historyList = document.getElementById('history_list');

let suggestionTimer;

async function searchWeather(city) {
    city = city.trim();
    if (!city) {
        errorMessage.textContent = 'Please enter a city name.';
        return;
    }
    errorMessage.textContent = '';
    suggestionsBox.style.display = 'none';
    searchButton.disabled = true;

    try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'City not found.');

        document.getElementById('city_name').textContent = data.city;
        document.getElementById('country_name').textContent = data.country;
        document.getElementById('weather_status_name').textContent = data.description;
        document.getElementById('weather_temperature_value').innerHTML = `${data.temperature}<span>°C</span>`;
        document.getElementById('humidity_status_value').textContent = `${data.humidity}%`;
        document.getElementById('wind_speed_value').textContent = `${data.wind_speed} km/h`;
        document.getElementById('weather_image').src = data.icon;
        searchInputBox.value = '';
        loadHistory();
    } catch (error) {
        errorMessage.textContent = error.message;
    } finally {
        searchButton.disabled = false;
    }
}

async function loadHistory() {
    const response = await fetch('/api/history');
    const history = await response.json();
    if (!history.length) {
        historyList.innerHTML = '<p class="empty-history">No searches yet.</p>';
        return;
    }
    historyList.innerHTML = history.map(item => `
        <div class="history-item" data-city="${escapeHtml(item.city)}">
            <div>
                <div class="history-city">${escapeHtml(item.city)}</div>
                <div class="history-time">${escapeHtml(item.searched_at)}</div>
            </div>
            <button class="delete-history" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>`).join('');

    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', (event) => {
            if (event.target.closest('.delete-history')) return;
            searchWeather(item.dataset.city);
        });
    });
    document.querySelectorAll('.delete-history').forEach(button => {
        button.addEventListener('click', async () => {
            await fetch(`/api/history/${button.dataset.id}`, {method: 'DELETE'});
            loadHistory();
        });
    });
}

async function loadSuggestions(query) {
    if (query.length < 2) {
        suggestionsBox.style.display = 'none';
        return;
    }
    try {
        const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
        const cities = await response.json();
        if (!cities.length) {
            suggestionsBox.style.display = 'none';
            return;
        }
        suggestionsBox.innerHTML = cities.map(city => `<div class="suggestion">${escapeHtml(city)}</div>`).join('');
        suggestionsBox.style.display = 'block';
        document.querySelectorAll('.suggestion').forEach(item => {
            item.addEventListener('click', () => searchWeather(item.textContent));
        });
    } catch (_) {
        suggestionsBox.style.display = 'none';
    }
}

function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

searchButton.addEventListener('click', () => searchWeather(searchInputBox.value));
searchInputBox.addEventListener('keydown', event => {
    if (event.key === 'Enter') searchWeather(searchInputBox.value);
});
searchInputBox.addEventListener('input', () => {
    clearTimeout(suggestionTimer);
    suggestionTimer = setTimeout(() => loadSuggestions(searchInputBox.value.trim()), 300);
});
document.addEventListener('click', event => {
    if (!event.target.closest('#search_input_container')) suggestionsBox.style.display = 'none';
});
document.getElementById('clear_history').addEventListener('click', async () => {
    await fetch('/api/history', {method: 'DELETE'});
    loadHistory();
});

loadHistory();