class PlotScatter extends HTMLElement {

    constructor() {
        super();
        //this.attachShadow({ mode: 'open' });
        this._connected = false;
    }

    static get observedAttributes() {
        return ['plot-config'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._config = tryParseJSON(newValue, null);
        }
        this.render();
    }

    connectedCallback() {
        this._connected = true;
        this.render();
    }

    disconnectedCallback() {
        this._connected = false;
    }

    getStyle() {
        return `
        <style>
            @import './main.css';
        </style>
        `;
    }

    render() {

        if (!this._connected) return;


        //this.shadowRoot.innerHTML = this.getStyle();

        // this._container = document.createElement('div');
        // this._container.style.width = '100%';
        // this._container.style.height = '100%';
        // this._container.classList.add('flex-row');
        // this._container.classList.add('flex-center');
        // this.appendChild(this._container);

        this.innerHTML = ''; // Clear previous content
        this.classList.add('flex-row');
        this.classList.add('flex-center');
        
        const plotMessage = document.createElement('span');
        plotMessage.classList.add('loading');
        plotMessage.textContent = 'loading...';
        this.appendChild(plotMessage);


        if (!this._config) {
            plotMessage.textContent = 'Invalid plot configuration';
            return;
        }
        const { url, x, y1, color } = this._config;
        if (!url || !x || !y1  || !color) {
            plotMessage.textContent = 'Missing plot configuration parameters';
            return;
        }

        this.getErddapData(url, x, y1[0], color, plotMessage)
        .then((data) => {
            this.renderPlot(data);
        });
    }

    getErddapData(url, x, y, color, message) {
        const xparam = x.name;
        const y1Param = y.name;
        const colorParam = color.name;
        const queryUrl = `${url}?${xparam},${y1Param},${colorParam}&time>=max(time)-356d`;
        return fetch(queryUrl)
        .then(response => response.json())
        .then(data => {


            const sorted = data.table.rows.toSorted((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    

            const xData = sorted.map(row => row[0]);
            const yData = sorted.map(row => row[data.table.columnNames.indexOf(y.name)]);
            const zData = sorted.map(row => row[data.table.columnNames.indexOf(color.name)]);

            return {xData, yData, zData}
        })
        .catch(error => {
            message.textContent = `Error fetching data: ${error.message}`;
        }); 
            

    }


    renderPlot(data) {
        this.innerHTML = ''; // Clear loading message
        this.container = document.createElement('div');
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.appendChild(this.container);

        if (this._config.type === 'scatter') {
            const trace = {
                x: data.xData,
                y: data.yData,
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: data.zData,
                    colorscale: 'Viridis',
                    colorbar: {
                        title: this._config.color.name
                    }
                },
                name: this._config.y1[0].name
            };

            const layout = {
                title: { text: 'scatter plot' },
                hovermode: 'closest',
                xaxis: {
                    title: {
                        text: this._config.x.unit
                    }
                },
                yaxis: {
                    title: {
                        text: this._config.y1[0].unit
                    }
                }
            };

            var config = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['zoomIn2d', 'zoomOut2d', 'select2d', 'lasso2d', 'autoScale2d']};

            this.plot = Plotly.newPlot(this.container, [trace], layout, config);
        } else if (this._config.type === 'heatmap') {
            const trace = {
                x: data.xData,
                y: data.yData,
                z: data.zData,
                type: 'heatmap',
                colorscale: 'Viridis',
                colorbar: {
                    title: this._config.color.name
                },
                name: this._config.y1[0].name
            };

            const layout = {
                title: { text: 'heatmap' },
                hovermode: 'closest',
                xaxis: {
                    title: {
                        text: this._config.x.unit
                    }
                },
                yaxis: {
                    title: {
                        text: this._config.y1[0].unit
                    }
                }
            };

            var config = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['zoomIn2d', 'zoomOut2d', 'select2d', 'lasso2d', 'autoScale2d']};

            this.plot = Plotly.newPlot(this.container, [trace], layout, config);
        }

        // this.observer = new ResizeObserver(() => {
        //     if (this.plot) {
        //         Plotly.Plots.resize(this.container);
        //     }
        // }).observe(this._container);
    }
}

customElements.define('plot-scatter', PlotScatter);


//         const layout = {
//             title: { text: 'plot' },
//             hovermode: 'x unified',
//             yaxis: {
//                 title: {
//                     text: this._config.y1[0].unit || 'y axis'
//                 }
//             },
//             "legend": {
//                 "orientation": "h",
//                 "x": 0.5,
//                 "xanchor": "center",
//                 "y": -0.15,
//                 "yanchor": "top"
//             }
//         };

//         if (traces.some(trace => trace.yaxis === 'y2')) {
//             layout.yaxis2 = {
//                 title: {
//                     text: this._config.y2[0].unit || 'y2 axis'
//                 },
//                 overlaying: 'y',
//                 side: 'right'
//             };
//         }



//         var config = {
//             responsive: true, 
//             displaylogo: false, 
//             modeBarButtonsToRemove: ['zoomIn2d', 'zoomOut2d', 'select2d', 'lasso2d', 'autoScale2d']};

//         this.plot = Plotly.newPlot(this.container, traces, layout, config);

//         this.observer = new ResizeObserver(() => {
//             if (this.plot) {
//                 Plotly.Plots.resize(this.container);
//             }
//         }).observe(this);
//     }
// }

// customElements.define('plot-timeseries', PlotTimeseries);