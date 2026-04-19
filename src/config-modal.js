class configModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._modalOpen = false;
        this._connected = false;
        this._formValid = false;
    }

    static get observedAttributes() {
        return ['plot-types', 'plot-params'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'plot-types') {
                this._types = tryParseJSON(newValue, {});
                this._selectedType = Object.keys(this._types)[0] || null;
            } else if (name === 'plot-params') {
                this._params = tryParseJSON(newValue, []);
            }
            this.render(this._types, this._params);
        }
    }

    connectedCallback() {
        this.render(this._types, this._params);
        this._connected = true;
    }

    disconnectedCallback() {
        this._connected = false;
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

        if (!this._connected) return;
        if (!this._types || !this._params) return;

        const typeOptions = Object.keys(this._types).map(t => {
            if (t === this._selectedType) {
                return `<option value="${t}" selected>${t}</option>`
            }
            return `<option value="${t}">${t}</option>`
        }).join('');


        this.shadowRoot.innerHTML = `
             ${this.getStyle()}
            <button class="themed-primary round-button shadow" id="openBtn">+</button>
            ${this._modalOpen ? `
            <div class="fixed-stretch background-transp flex-row flex-center">
                <div class="themed-base shadow padding flex-column align-end modal">
                    <button id="closeBtn" class="font-button">&times;</button>
                    <div class="padding flex-column gap">
                        <div class="flex-row align-center gap">
                            <label class="bold">plot type:</label>
                            <select id="typeSelect" name="type">
                                ${typeOptions}
                            </select>
                         </div>
                        ${this.formTemplate(this._selectedType, this._types, this._params)}
                        <div class="flex-row justify-end">
                            <button id="createBtn" class="text-button themed-primary" disabled=${!this._formValid}>create</button>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
        `;

        this.shadowRoot.getElementById('openBtn').onclick = () => this.toggleModal();




        if (this._modalOpen) {

            this.shadowRoot.getElementById('form-component').addEventListener('form-changed', (e) => {
                console.log('Received form-changed event with detail:', e.detail); // Log the entire detail object
                const detail = e.detail;
                this.shadowRoot.getElementById('createBtn').disabled = !detail.valid;
                this._formValid = detail.valid;
                if (this._formValid) {
                    this.data = detail;
                } else {
                    this.data = null;
                }
            })

            this.shadowRoot.getElementById('closeBtn').onclick = () => this.toggleModal();

            this.shadowRoot.getElementById('typeSelect').onchange = (e) => this.onTypeChange(e);

            this.shadowRoot.getElementById('createBtn').onclick = () => {
                console.log('Create button clicked with data:', this.data, 'and type:', this._selectedType);
                const type = this._selectedType;
                const plotComponent = this._types[type].plot;
                const plotData = { component: plotComponent, plotData:this.data }
                this.dispatchEvent(new CustomEvent('plot-created', {
                    detail: plotData,
                    bubbles: true,
                    composed: true
                }));
                this.toggleModal();
            }   

        }
    }

    formTemplate(selectedType, types, params) {
        return `
        <${types[selectedType].form} id='form-component' plot-params='${JSON.stringify(params)}'></${types[selectedType].form}>
         `
    }


    onTypeChange(e) {
        const val = e.target.value;
        this._selectedType = val;
        this.render();
    }
}

customElements.define('config-modal', configModal);




