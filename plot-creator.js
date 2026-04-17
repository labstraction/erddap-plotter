class PlotCreator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._modalOpen = false;
        this._connected = false;
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
                this._selectedType = this._types[0] || null;
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

        this.shadowRoot.innerHTML = `
             ${this.getStyle()}
            <button class="themed-primary round-button shadow" id="openBtn">+</button>
            ${this._modalOpen ? this.modalTemplate() : ''}
        `;


        this.shadowRoot.getElementById('openBtn').onclick = () => this.toggleModal();


        if (this._modalOpen) {

            this.shadowRoot.getElementById('closeBtn').onclick = () => this.toggleModal();

            this.shadowRoot.getElementById('typeSelect').onchange = (e) => this.onTypeChange(e);

            const addY1Btn = this.shadowRoot.getElementById('addY1Btn');
            if(addY1Btn){
                addY1Btn.onclick = () => this.addYParam('y1');
            }

            const addY2Btn = this.shadowRoot.getElementById('addY2Btn');
            if(addY2Btn){
                addY2Btn.onclick = () => this.addYParam('y2');
            }

            this.shadowRoot.getElementById('plotForm').onsubmit = (e) => {

                e.preventDefault();

                const form = e.target;

                const type = form.type.value;

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


                const plotData = {
                    type,
                    x,
                    y1,
                    y2,
                }

                if(form.color){
                    const colorParam = this._params.find(p => p.name === form.color.value) || null;
                    plotData.color = colorParam;
                }


                this.dispatchEvent(new CustomEvent('plot-created', {
                    detail: plotData,
                    bubbles: true,
                    composed: true
                }));
                this.toggleModal();
            };
        }
    }

    modalTemplate() {
  
        const typeOptions = this._types.map(t => {
            if(t === this._selectedType) {
                return `<option value="${t}" selected>${t}</option>`
            }
            return `<option value="${t}">${t}</option>`
        }).join('');

        this._paramsOptions = this._params.map(p => `<option title="${p.longName} (${p.unit})" value="${p.name}">${p.name}</option>`).join('');

        let xOptions = '';
        if(this._selectedType === 'timeseries') {
            xOptions = "<option value='time'>time</option>" 
        } else{
            xOptions = this._paramsOptions
        }

        return `
        <div class="fixed-stretch background-transp flex-row flex-center">
            <div class="themed-base shadow padding flex-column align-end modal">
                <button id="closeBtn" class="font-button">&times;</button>
                <form id="plotForm" class="flex-column padding gap">
                    <div class="flex-row align-center gap">
                        <label class="bold">plot type:</label>
                        <select id="typeSelect" name="type">
                            ${typeOptions}
                        </select>
                    </div>
                    <div class="flex-row align-center gap">
                        <label class="bold">x axis:</label>
                        <select name="x">
                            ${xOptions}
                        </select>
                    </div>
                    ${this._selectedType === 'timeseries' ? `
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
                    </div> ` : 
                    `<div class="flex-row align-center gap">
                        <label class="bold">y axis:</label>
                        <select name="y1">
                            <option value="">--</option>
                            ${this._paramsOptions}
                        </select>
                    </div>`}
                    ${(this._selectedType === 'scatter' || this._selectedType === 'heatmap') ? `
                    <div class="flex-row align-center gap">
                        <label class="bold">color by:</label>
                        <select name="color">
                            <option value="">--</option>
                            ${this._paramsOptions}
                        </select>
                    </div>` : ''}
                    <div class="flex-row justify-end">
                        <button class="text-button themed-primary" type="submit">create</button>
                    </div>
                </form>
            </div>
        </div>
        `;
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
        li.querySelector('button').onclick = () => li.remove()
        yParams.appendChild(li);
    }

    onTypeChange(e) {
        const val = e.target.value;
        this._selectedType = val;
        this.render();
    }
}

customElements.define('plot-creator', PlotCreator);




               