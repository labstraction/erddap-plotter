class TimeseriesForm extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._connected = false;
    }

    static get observedAttributes() {
        return ['plot-params'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._params = tryParseJSON(newValue, []);
            this.render();
        }
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
        if (!this._params) return;

        this._paramsOptions = this._params.map(p => `<option title="${p.longName} (${p.unit})" value="${p.name}">${p.name}</option>`).join('');
        const xOptions = `<option title=${this._params.find(p => p.name === 'time')?.longName || 'Time'} value='time'>time</option>`

        this.shadowRoot.innerHTML = `
                ${this.getStyle()}
                <form id="plotForm" class="flex-column gap">
                    <div class="flex-row align-center gap">
                        <label class="bold">x axis:</label>
                        <select name="x">
                            ${xOptions}
                        </select>
                    </div>
                    <div class="flex-column gap">
                        <div class="flex-row align-center gap">
                            <label class="bold">y axis 1</label>
                            <button type="button" class="font-button" id="addY1Btn">+</button>
                        </div>
                        <ol id="y1Params" class="flex-column gap">
                            <li>
                                <label>variable:</label>
                                <select name="y1">
                                    <option value="">--</option>
                                    ${this._paramsOptions}
                                </select>
                            </li>
                        </ol>
                    </div>
                    <div class="flex-column gap">
                        <div class="flex-row align-center gap">
                            <label class="bold">y axis 2:</label>
                            <button type="button" class="font-button" id="addY2Btn">+</button>
                        </div>
                        <ol id="y2Params" class="flex-column gap">
                        </ol>
                    </div> 
                </form>
        `;


        this.shadowRoot.getElementById('addY1Btn').onclick = () => this.addYParam('y1');

        this.shadowRoot.getElementById('addY2Btn').onclick = () => this.addYParam('y2');

        this.shadowRoot.getElementById('plotForm').onchange = (e) => {


            
                let form = e.target.form;

                if (!form) {
                    form = e.target;
                }
                
                const x = this._params.find(p => p.name === form.x.value) || null;

                const y1Selects = form.querySelectorAll('select[name="y1"]');
                const y1 = Array.from(y1Selects).reduce((acc, select) => {
                    const p = this._params.find(p => p.name === select.value) || null;
                    if (p) {
                        acc.push(p);
                    }
                    return acc;
                }, []);

                const y2Selects = form.querySelectorAll('select[name="y2"]');
                const y2 = Array.from(y2Selects).reduce((acc, select) => {
                    const p = this._params.find(p => p.name === select.value) || null;
                    if (p) {
                        acc.push(p);
                    }
                    return acc;
                }, []);

                const isValid = x && (y1.length > 0 || y2.length > 0);

                this.dispatchEvent(new CustomEvent('form-changed', {
                    detail: { valid: isValid, data: { x, y1, y2 }, title: `timeseries x: ${x ? x.name : ''} y1: ${y1.map(p => p.name).join(', ')} ${ y2.length ? `y2: ${y2.map(p => p.name).join(', ')}` : ''}` },
                    bubbles: true,
                    composed: true
                }));

        }


    }

    addYParam(axis) {
        const yParams = this.shadowRoot.getElementById(axis === 'y1' ? 'y1Params' : 'y2Params');
        const li = document.createElement('li');
        li.innerHTML = `
            <label>variable:</label>
            <select name="${axis}">
                <option value="">--</option>
                ${this._paramsOptions}
            </select>
            <button type="button" class="font-button">-</button>
        `;
        li.querySelector('button').onclick = () => {
            li.remove()
            this.shadowRoot.getElementById('plotForm').dispatchEvent(new Event('change', { bubbles: true }));
        };
        yParams.appendChild(li);
    }
}

customElements.define('timeseries-form', TimeseriesForm);




