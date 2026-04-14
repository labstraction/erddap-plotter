class PlotComponent extends HTMLElement {

    constructor() {
        super();
        new ResizeObserver(() => {
            if (this.plot) {
                Plotly.Plots.resize(this.container);
            }
        }).observe(this.parentElement);
        this.classList.add('flex-row');
        this.classList.add('flex-center');
    }

    getErddapData(url, x, y, type, message) {

        const queryUrl = `${url}?${x},${y}&time>=now-365d`;

        return fetch(queryUrl)
        .then(response => response.json())
        .then(data => {
            const sorted = data.table.rows.toSorted((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
            const xData = sorted.map(row => row[0]);
            const yData = sorted.map(row => row[1]);

            return { x: xData, y: yData };
        })
        .catch(error => {
            message.textContent = `Error fetching data: ${error.message}`;
        }); 
            

    }

    connectedCallback() {
        
        const plotURL = this.getAttribute('plot-url');
        const plotX = this.getAttribute('plot-x');
        const plotY = this.getAttribute('plot-y');
        const plotType = this.getAttribute('plot-type');
        

        const plotMessage = document.createElement('span');
        plotMessage.classList.add('loading');
        plotMessage.textContent = 'loading...';
        this.appendChild(plotMessage);

    
        if (!plotURL) {
            plotMessage.textContent = 'Error: URL parameter is missing.';
            return;
        } else if (!plotX) {
            plotMessage.textContent = 'Error: X-axis parameter is missing.';
            return;
        } else if (!plotY) {
            plotMessage.textContent = 'Error: Y-axis parameter is missing.';
            return;
        } else if (!plotType) {
            plotMessage.textContent = 'Error: Plot type parameter is missing.';
            return;
        }

        this.getErddapData(plotURL, plotX, plotY, plotType, plotMessage)
        .then((res) => {
            this.renderPlot(res, plotType);
        });
    
    }

    renderPlot(data, type) {
        this.innerHTML = ''; // Clear loading message
        this.container = document.createElement('div');
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.appendChild(this.container);

        const trace = {
            x: data.x,
            y: data.y,
            mode: type === 'scatter' ? 'markers' : 'lines',
            type: type
        };

        const layout = {
            title: 'ERDDAP Plot',
            xaxis: { title: 'x' },
            yaxis: { title: 'y' },
            margin: { t: 50, r: 50, b: 50, l: 50 }
        };

        var config = {responsive: true}

        this.plot = Plotly.newPlot(this.container, [trace], layout, config);
    }
}

customElements.define('plot-component', PlotComponent);