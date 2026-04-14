class PlotConfigurator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._params = [];
        this._types = ['timeseries', 'profile', 'line', 'scatter', 'heatmap'];
        this._modalOpen = false;
    }

    static get observedAttributes() {
        return ['params'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'params') {
            try {
                this._params = JSON.parse(newValue);
            } catch {
                this._params = [];
            }
        }
    }

    connectedCallback() {
        this.render();
    }

    openModal() {
        this._modalOpen = true;
        this.render();
    }
    openModal() {
        this._modalOpen = true;
        this.render();
    }

    closeModal() {
        this._modalOpen = false;
        this.render();
    }

    render() {
        const style = `
        <style>
        #openBtn {
            background-color: var(--color-primary, #ffffff);
            color: var(--color-primary-text, #000000);
            border: none;
            padding: 10px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 1.5em;
            cursor: pointer;
            text-align: center;
            line-height: 1;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .modal-bg {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            -webkit-transform: translateZ(0);
        }
        .modal {
            background: #fff;
            border-radius: 8px;
            padding: 2em;
            min-width: 350px;
            max-width: 90vw;
            box-shadow: 0 2px 16px rgba(0,0,0,0.2);
            position: relative;
        }
        .close-btn {
            position: absolute;
            top: 0.5em;
            right: 0.5em;
            background: none;
            border: none;
            font-size: 1.5em;
            cursor: pointer;
        }
        .form-row {
            margin-bottom: 1em;
            display: flex;
            align-items: flex-start;
            gap: 0.5em;
        }
        .y-params-container {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        .y-param-row {
            display: flex;
            align-items: center;
            gap: 0.5em;
        }
        .add-y-btn {
            width: 20px;
            height: 20px;
            padding: 0;
            cursor: pointer;
        }
        input[type="color"] {
            width: 20px;
            height: 20px;
            padding: 1;
            line-height: 1;
        }

        </style>
        `;
        this.shadowRoot.innerHTML = `
            ${style}
            <button id="openBtn">+</button>
            ${this._modalOpen ? this.modalTemplate() : ''}
        `;
        this.shadowRoot.getElementById('openBtn').onclick = () => this.openModal();
        if (this._modalOpen) {
            this.shadowRoot.getElementById('closeBtn').onclick = () => this.closeModal();
            this.shadowRoot.getElementById('addY1Btn').onclick = () => this.addYParam('y1');
            this.shadowRoot.getElementById('addY2Btn').onclick = () => this.addYParam('y2');
            this.shadowRoot.getElementById('typeSelect').onchange = (e) => this.onTypeChange(e);
            // Gestione submit
            this.shadowRoot.getElementById('plotForm').onsubmit = (e) => {
                e.preventDefault();
                const form = e.target;
                const type = form.type.value;
                const x = form.x.value;
                // Y1 multipli
                const y1Rows = Array.from(this.shadowRoot.querySelectorAll('.y1-param-row'));
                const y1 = y1Rows.map(row => {
                    return {
                        param: row.querySelector('select[name="y1"]').value,
                        color: row.querySelector('input[name="y1Color"]').value
                    };
                });
                // Y2 multipli
                const y2Rows = Array.from(this.shadowRoot.querySelectorAll('.y2-param-row'));
                const y2 = y2Rows.map(row => {
                    return {
                        param: row.querySelector('select[name="y2"]').value,
                        color: row.querySelector('input[name="y2Color"]').value
                    };
                });
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
        const xOptions = this._params.map(p => `<option title="${p.longName}" value="${p.name}">${p.name}</option>`).join('');
        const yOptions = this._params.map(p => `<option title="${p.longName}" value="${p.name}">${p.name}</option>`).join('');
        const colorOptions = this._params.map(p => `<option title="${p.longName}" value="${p.name}">${p.name}</option>`).join('');
        return `
        <div id="modal-bg" class="modal-bg">
            <div class="modal">
                <button class="close-btn" id="closeBtn">&times;</button>
                <form id="plotForm">
                    <div class="form-row">
                        <label>Tipo di grafico:</label>
                        <select id="typeSelect" name="type">
                            ${typeOptions}
                        </select>
                    </div>
                    <div class="form-row">
                        <label>Asse X:</label>
                        <select name="x">
                            ${xOptions}
                        </select>
                    </div>
                    <div class="form-row y-section">
                        <label>Asse Y1:</label>
                        <div id="y1Params" class="y-params-container">
                            <div class="y-param-row y1-param-row">
                                <select name="y1">
                                    ${yOptions}
                                </select>
                                <input type="color" name="y1Color" value="#1e90ff" />
                            </div>
                        </div>
                        <button type="button" class="add-y-btn" id="addY1Btn">+</button>
                    </div>
                    <div class="form-row y-section">
                        <div class="y-section-title">Asse Y2</div>
                        <div id="y2Params">
                            <div class="y-param-row y2-param-row">
                                <select name="y2">
                                    ${yOptions}
                                </select>
                                <input type="color" name="y2Color" value="#ff6347" />
                            </div>
                        </div>
                        <button type="button" class="add-y-btn" id="addY2Btn">+</button>
                    </div>
                    <div class="form-row" id="colorRow" style="display:none;">
                        <label>Parametro colorazione:</label>
                        <select name="color">
                            <option value="">--</option>
                            ${colorOptions}
                        </select>
                    </div>

                    <div class="form-row" style="justify-content: flex-end;">
                        <button type="submit">Applica</button>
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
        div.innerHTML = `<select name="${axis}">${yOptions}</select> <input type="color" name="${axis}Color" value="${axis === 'y1' ? '#1e90ff' : '#ff6347'}" /> <button type="button" class="remove-y-btn">-</button>`;
        div.querySelector('.remove-y-btn').onclick = () => div.remove();
        yParams.appendChild(div);
    }

    onTypeChange(e) {
        const val = e.target.value;
        const colorRow = this.shadowRoot.getElementById('colorRow');
        if (val === 'scatter' || val === 'heatmap') {
            colorRow.style.display = '';
        } else {
            colorRow.style.display = 'none';
        }
    }
}

customElements.define('plot-configurator', PlotConfigurator);


                    // <div class="form-row">
                    //     <label>Range temporale:</label>
                    //     <input type="date" name="start" />
                    //     <span>→</span>
                    //     <input type="date" name="end" />
                    // </div>