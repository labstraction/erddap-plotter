class TimeseriesPlot extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' })
        this.adoptDocumentStyles();
        this._connected = false;
    }

    static get observedAttributes() {
        return ['plot-config'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._config = tryParseJSON(newValue, {});
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


    render() {

        if (!this._connected) return;

        this.container = document.createElement('div');

        this.container.style.width = '100%';
        this.container.style.height = '100%';

        this.container.classList.add('flex-row');
        this.container.classList.add('flex-center');

        this.shadowRoot.appendChild(this.container);

        const plotMessage = document.createElement('span');
        plotMessage.classList.add('loading');
        plotMessage.textContent = 'loading...';
        this.container.appendChild(plotMessage);

        if (!this._config) {
            plotMessage.textContent = 'missing plot configuration';
            return;
        }

        console.log('Plot configuration:', this._config);

        const { url, x, y1, y2 } = this._config;
        if (!url || !x || !y1) {
            plotMessage.textContent = 'Missing plot configuration parameters';
            return;
        }

        this.getErddapData(url, x, y1, y2, plotMessage)
            .then((traces) => {
                this.renderPlot(traces);
            });
    }

    getErddapData(url, x, y1, y2, message) {
        const xparam = x.name;
        const y1Param = y1.map(trace => trace.name).join(',');
        const y2Param = y2 && y2.length ? ',' + y2.map(trace => trace.name).join(',') : '';
        console.log('Constructed query parameters with y2:', { xparam, y1Param, y2Param });
        const queryUrl = `${url}?${xparam},${y1Param}${y2Param}&time>=max(time)-100d`;
        return fetch(queryUrl)
            .then(response => response.json())
            .then(data => {

                let sorted;
                if (x.name === 'time') {
                    sorted = data.table.rows.toSorted((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
                } else {
                    sorted = data.table.rows.toSorted((a, b) => a[0] - b[0]);
                }

                const xData = sorted.map(row => row[data.table.columnNames.indexOf(x.name)]);

                let traces = y1.map(trace => {
                    const yData = sorted.map(row => row[data.table.columnNames.indexOf(trace.name)]);
                    return { x: xData, y: yData, mode: 'lines', type: 'scatter', name: trace.name };
                });

                if (y2 && y2.length) {
                    traces = traces.concat(y2.map(trace => {
                        const yData = sorted.map(row => row[data.table.columnNames.indexOf(trace.name)]);
                        return { x: xData, y: yData, mode: 'lines', type: 'scatter', yaxis: 'y2', name: trace.name };
                    }));
                }

                return traces;
            })
            .catch(error => {
                message.textContent = `Error fetching data: ${error.message}`;
            });


    }


    renderPlot(traces) {


        this.container.innerHTML = '';

        const layout = {
            margin: {
                l: 70,
                r: 70,
                b: 70,
                t: 35,
                pad: 5
            },
            title: false,
            hovermode: 'x unified',
            yaxis: {
                title: {
                    text: this._config.y1[0].unit || 'y axis'
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
                    text: this._config.y2[0].unit || 'y2 axis'
                },
                overlaying: 'y',
                side: 'right'
            };
        }


        var config = {
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['zoomIn2d', 'zoomOut2d', 'select2d', 'lasso2d', 'autoScale2d']
        };

        this.plot = Plotly.newPlot(this.container, traces, layout, config);

        this.observer = new ResizeObserver(() => {
            if (this.plot) {
                Plotly.Plots.resize(this.container);
            }
        }).observe(this);
    }

    adoptDocumentStyles() {
        const documentStyle = document.styleSheets;
        const trnsformedInCSSStyles = Array.from(documentStyle).map(sheet => {
            try {
                return sheet.cssRules ? Array.from(sheet.cssRules).map(rule => rule.cssText).join('') : '';
            } catch (e) {
                return '';
            }
        }).join('');
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(trnsformedInCSSStyles);
        this.shadowRoot.adoptedStyleSheets = [styleSheet];
    }
}

customElements.define('timeseries-plot', TimeseriesPlot);