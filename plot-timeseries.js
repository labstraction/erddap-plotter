class PlotTimeseries extends HTMLElement {

    constructor() {
        super();

    }

    static get observedAttributes() {
        return ['plot-config'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'plot-config' && oldValue !== newValue) {
            try {
                this._config = JSON.parse(newValue);
            } catch {
                this._config = null;
            }
        }
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    render() {

        this.innerHTML = '';

        this.classList.add('flex-row');
        this.classList.add('flex-center');

        const plotMessage = document.createElement('span');
        plotMessage.classList.add('loading');
        plotMessage.textContent = 'loading...';
        this.appendChild(plotMessage);

        console.log('Rendering plot with config:', this._config);

        if (!this._config) {
            plotMessage.textContent = 'Invalid plot configuration';
            return;
        }
        const { url, x, y1, y2 } = this._config;
        if (!url || !x || !y1 ) {
            plotMessage.textContent = 'Missing plot configuration parameters';
            return;
        }

        this.getErddapData(url, x, y1, y2, plotMessage)
        .then((traces) => {
            console.log('Fetched traces:', traces);
            this.renderPlot(traces);
        });
    }

    getErddapData(url, x, y1, y2, message) {
        const xparam = x.name;
        const y1Param = y1.map(trace => trace.param.name).join(',');
        const y2Param = y2 && y2.length ? ',' + y2.map(trace => trace.param.name).join(',') : '';
        console.log('Constructed query parameters with y2:', { xparam, y1Param, y2Param });
        const queryUrl = `${url}?${xparam},${y1Param}${y2Param}&time>=now-10d`;
        return fetch(queryUrl)
        .then(response => response.json())
        .then(data => {


            const sorted = data.table.rows.toSorted((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    

            const xData = sorted.map(row => row[0]);

            let traces = y1.map(trace => {
                const yData = sorted.map(row => row[data.table.columnNames.indexOf(trace.param.name)]);
                return { x: xData, y: yData, mode: 'lines', type: 'scatter', name: trace.param.longName || trace.param.name };
            });

            if (y2 && y2.length) {
                traces = traces.concat(y2.map(trace => {
                    const yData = sorted.map(row => row[data.table.columnNames.indexOf(trace.param.name)]);
                    return { x: xData, y: yData, mode: 'lines', type: 'scatter', yaxis: 'y2', name: trace.param.longName || trace.param.name };
                }));
            }
  

            return traces;
        })
        .catch(error => {
            message.textContent = `Error fetching data: ${error.message}`;
        }); 
            

    }


    renderPlot(traces) {
        this.innerHTML = ''; // Clear loading message
        this.container = document.createElement('div');
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.appendChild(this.container);


        const layout = {
            title: { text: 'plot' },
            hovermode: 'x unified',
            yaxis: {
                title: {
                    text: this._config.y1[0].param.unit || 'y axis'
                }
            },
            "legend": {
                "orientation": "h",
                "x": 0.5,
                "xanchor": "center",
                "y": -0.15,
                "yanchor": "top"
            }
        };

        if (traces.some(trace => trace.yaxis === 'y2')) {
            layout.yaxis2 = {
                title: {
                    text: this._config.y2[0].param.unit || 'y2 axis'
                },
                overlaying: 'y',
                side: 'right'
            };
        }



        var config = {
            responsive: true, 
            displaylogo: false, 
            modeBarButtonsToRemove: ['zoomIn2d', 'zoomOut2d', 'select2d', 'lasso2d', 'autoScale2d']};

        this.plot = Plotly.newPlot(this.container, traces, layout, config);

        this.observer = new ResizeObserver(() => {
            if (this.plot) {
                Plotly.Plots.resize(this.container);
            }
        }).observe(this);
    }
}

customElements.define('plot-timeseries', PlotTimeseries);