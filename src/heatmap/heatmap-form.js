class HeatmapForm extends HTMLElement {

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

        this.shadowRoot.innerHTML = `
                ${this.getStyle()}
                <form id="plotForm" class="flex-column padding gap">
                    <div>
                        <label class="bold">x axis:</label>
                        <select name="x">
                            <option value="">--</option>
                            ${this._paramsOptions}
                        </select>
                    </div>
                    <div>
                        <label class="bold">y axis:</label>
                        <select name="y">
                            <option value="">--</option>
                            ${this._paramsOptions}
                        </select>
                        <input type="checkbox" name="invert-y">invert y</input>
                    </div>
                    <div>
                        <label class="bold">z axis (color):</label>
                        <select name="z">
                            <option value="">--</option>
                            ${this._paramsOptions}
                        </select>
                    </div>
                </form>
        `;


        this.shadowRoot.getElementById('plotForm').onchange = (e) => {


            
                let form = e.target.form;
                
                const x = this._params.find(p => p.name === form.x.value) || null;

                const y = this._params.find(p => p.name === form.y.value) || null;

                const z = this._params.find(p => p.name === form.z.value) || null;

                const invertY = form.querySelector('input[name="invert-y"]').checked || false;

                const isValid = x && y && z;

                this.dispatchEvent(new CustomEvent('form-changed', {
                    detail: { valid: isValid, data: { x, y, z, invertY }, title: `heatmap x: ${x ? x.name : ''} y: ${y ? y.name : ''} z: ${z ? z.name : ''}` },
                    bubbles: true,
                    composed: true
                }));

        }


    }

}

customElements.define('heatmap-form', HeatmapForm);




