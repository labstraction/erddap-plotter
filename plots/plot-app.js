const params = new URLSearchParams(window.location.search);
const plotMessage = document.getElementById('plot-message');

const plotUrlMapping = {
    'timeseries': 'timeseries.html'
    // Add more plot types and their corresponding HTML files here
};

if (!params.has('url')) {
    plotMessage.textContent = 'Error: URL parameter is missing.';
} else if (!params.has('x')) {
    plotMessage.textContent = 'Error: X parameter is missing.';
} else if (!params.has('y')) {
    plotMessage.textContent = 'Error: Y parameter is missing.';
} else if (!params.has('type') || !plotUrlMapping[params.get('type')]) {
    plotMessage.textContent = 'Error: Type parameter is missing or invalid.';
} else {    
    const url = params.get('url');
    const x = params.get('x');
    const y = params.get('y');
    const plotUrl = plotUrlMapping[params.get('type')];

    window.location.href = `${plotUrl}?url=${encodeURIComponent(url)}&x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}`;

}