class HeatmapPlot extends HTMLElement {

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

        const { url, x, y, z, invertY } = this._config;
        if (!url || !x || !y || !z) {
            plotMessage.textContent = 'Missing plot configuration parameters';
            return;
        }

        this.getErddapData(url, x, y, z, plotMessage)
            .then((data) => {
                console.log('Data fetched for heatmap:', data);
                this.renderPlot(data, invertY);
            });
    }

    getErddapData(url, x, y, z, message) {
        const xparam = x.name;
        const yParam = y.name;
        const zParam = z.name;
        const queryUrl = `${url}?${xparam},${yParam},${zParam}&time>=max(time)-30d`;

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
                const yData = sorted.map(row => row[data.table.columnNames.indexOf(y.name)]);
                const zData = sorted.map(row => row[data.table.columnNames.indexOf(z.name)]);

                return { xData, yData, zData }
            })
            .catch(error => {
                message.textContent = `Error fetching data: ${error.message}`;
            });


    }


    renderPlot(data, invertY) {


        this.container.innerHTML = '';

        const trace = {
            x: data.xData,
            y: data.yData,
            z: data.zData,
            type: 'heatmap',
            colorscale: 'Viridis',
            colorbar: {
                title:{
                    text: this._config.z.unit
                },
                automargin: true,
            },
            name: this._config.z.name
        };

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
            xaxis: {
                title: {
                    text: this._config.x.name === 'time' ? '' : this._config.x.unit
                },
                automargin: true,
            },
            yaxis: {
                title: {
                    text: this._config.y.name === 'time' ? '' : this._config.y.unit
                },
                automargin: true,
            }
        };
     

        if (invertY) {
            layout.yaxis.autorange = 'reversed';
        }

        var config = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['zoomIn2d', 'zoomOut2d', 'select2d', 'lasso2d', 'autoScale2d'] };

        this.plot = Plotly.newPlot(this.container, [trace], layout, config);

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

customElements.define('heatmap-plot', HeatmapPlot);