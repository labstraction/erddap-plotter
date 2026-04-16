function tryParseJSON(jsonString, fallback = {}) {
    try {
        const parsed = JSON.parse(jsonString);
        return parsed;
    } catch (e) {
        console.error('Failed to parse JSON string:', jsonString, 'Error:', e);
        return fallback;
    }
}

