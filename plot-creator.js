class PlotCreator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._modalOpen = false;
    }

    static get observedAttributes() {
        return ['plot-types', 'plot-params'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'plot-types') {
                this._types = tryParseJSON(newValue, []);
            } else if (name === 'plot-params') {
                this._params = tryParseJSON(newValue, []);
            }
            this.render(this._types, this._params);
        }
    }

    connectedCallback() {
        this.render(this._types, this._params);
    }

    toggleModal() {
        this._modalOpen = !this._modalOpen;
        this.render(this._types, this._params);
    }

    getStyle() {
        return `
        <style>
            @import './main.css';
        </style>
        `;
    }

    render() {

        this.shadowRoot.innerHTML = `
             ${this.getStyle()}
            <button class="themed-primary round-button shadow" id="openBtn">+</button>
            ${this._modalOpen ? this.modalTemplate() : ''}
        `;


        this.shadowRoot.getElementById('openBtn').onclick = () => this.toggleModal();


        if (this._modalOpen) {
            this.shadowRoot.getElementById('closeBtn').onclick = () => this.closeModal();
            this.shadowRoot.getElementById('addY1Btn').onclick = () => this.addYParam('y1');
            this.shadowRoot.getElementById('addY2Btn').onclick = () => this.addYParam('y2');
            this.shadowRoot.getElementById('typeSelect').onchange = (e) => this.onTypeChange(e);
            this.shadowRoot.getElementById('plotForm').onsubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const type = form.type.value;
                const x = this._params.find(p => p.name === form.x.value) || null;
                const y1Rows = Array.from(this.shadowRoot.querySelectorAll('.y1-param-row'));
                const y1 = y1Rows.reduce((acc, row) => {
                    const p = this._params.find(p => p.name === row.querySelector('select[name="y1"]').value) || null;
                    if (p) {
                        acc.push({ param: p, color: row.querySelector('input[name="y1Color"]').value });
                    }
                    return acc;
                }, []);
                const y2Rows = Array.from(this.shadowRoot.querySelectorAll('.y2-param-row'));
                const y2 = y2Rows.reduce((acc, row) => {
                    const p = this._params.find(p => p.name === row.querySelector('select[name="y2"]').value) || null;
                    if (p) {
                        acc.push({ param: p, color: row.querySelector('input[name="y2Color"]').value });
                    }
                    return acc;
                }, []);
                // Parametro colorazione
                let colorParam = '';
                if (type === 'scatter' || type === 'heatmap') {
                    colorParam = form.color.value;
                }
                // Range temporale
                // const start = form.start.value;
                // const end = form.end.value;
                // Evento custom
                this.dispatchEvent(new CustomEvent('plot-configured', {
                    detail: {
                        type,
                        x,
                        y1,
                        y2,
                        color: colorParam,
                        // start,
                        // end
                    },
                    bubbles: true,
                    composed: true
                }));
                this.closeModal();
            };
        }
    }

    modalTemplate() {
  
        const typeOptions = this._types.map(t => `<option value="${t}">${t}</option>`).join('');

        const paramsOptions = this._params.map(p => `<option title="${p.longName} (${p.unit})" value="${p.name}">${p.name}</option>`).join('');

        let xOptions = '';
        if(this._selectedType === 'timeseries') {
            xOptions = "<option value='time'>time</option>" 
        } else{
            xOptions = paramsOptions
        }

        return `
        <div class="fixed-stretch background-transp flex-row flex-center">
            <div class="themed-base shadow padding flex-column">
                <button id="closeBtn">&times;</button>
                <form id="plotForm">
                    <div class="form-row">
                        <label>plot type:</label>
                        <select id="typeSelect" name="type">
                            ${typeOptions}
                        </select>
                    </div>
                    <div class="form-row">
                        <label>X Axis:</label>
                        <select name="x">
                            ${xOptions}
                        </select>
                    </div>
                    <div class="form-row y-section">
                        <label>Y Axis 1:</label>
                        <div id="y1Params" class="y-params-container">
                            <div class="y-param-row y1-param-row">
                                <select name="y1">
                                    <option value="">--</option>
                                    ${paramsOptions}
                                </select>
                                <input type="color" name="y1Color" value="blue" />
                            </div>
                        </div>
                        <button type="button" class="add-y-btn" id="addY1Btn">+</button>
                    </div>
                    <div class="form-row y-section">
                        <label>Asse Y2:</label>
                        <div id="y2Params" class="y-params-container">
                            <div class="y-param-row y2-param-row">
                                <select name="y2">
                                    <option value="">--</option>
                                    ${paramsOptions}
                                </select>
                                <input type="color" name="y2Color" value="red" />
                            </div>
                        </div>
                        <button type="button" class="add-y-btn" id="addY2Btn">+</button>
                    </div>
                    <div class="form-row" id="colorRow" style="display:none;">
                        <label>Parametro colorazione:</label>
                        <select name="color">
                            <option value="">--</option>
                            ${paramsOptions}
                        </select>
                    </div>

                    <div class="form-row" style="justify-content: flex-end;">
                        <button type="submit">create</button>
                    </div>
                </form>
            </div>
        </div>
        `;
    }

    addYParam(axis) {
        const yParams = this.shadowRoot.getElementById(axis === 'y1' ? 'y1Params' : 'y2Params');
        const yOptions = this._params.map(p => `<option title="${p.longName}" value="${p.name}">${p.name}</option>`).join('');
        const div = document.createElement('div');
        div.className = `y-param-row ${axis}-param-row`;
        div.innerHTML = `<select name="${axis}">${yOptions}</select> <input type="color" name="${axis}Color" value="${axis === 'y1' ? this.getY1Color() : this.getY2Color()}" /> <button type="button" class="remove-y-btn">-</button>`;
        div.querySelector('.remove-y-btn').onclick = () => div.remove();
        yParams.appendChild(div);
    }

    onTypeChange(e) {
        const val = e.target.value;
        this._selectedType = val;
        this.render();
    }
}

customElements.define('plot-creator', PlotCreator);


                    // <div class="form-row">
                    //     <label>Range temporale:</label>
                    //     <input type="date" name="start" />
                    //     <span>→</span>
                    //     <input type="date" name="end" />
                    // </div>