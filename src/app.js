const initGrid = () => {
    var grid = GridStack.init({
        handle: '.card-header',
        animate: false,
        margins: 4,
        columnOpts: {
        columnMax: 12,
        layout: 'list',
        breakpointForWindow: true,  
        breakpoints: [{w:750, c:4},{w:1500, c:8}]
      },
    });
    return grid;
}

const getTabledapUrlParam = () => {
  const params = new URLSearchParams(window.location.search);
  const url = params.get('dataseturl').replace('.html', '.json');
  return url;
}


const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    erddapURL: params.get('erddapURL'),
    dataset: params.get('dataset')
  };  
}

const getVariablesFromTable = (table) => {
    const variables = table.rows.filter(row => row[0] === 'variable' && (row[3] === 'double' || row[3] === 'float' || row[3] === 'int'))
                     .map(row => row[1]);
    const variablesWithLongNames = variables.map(variable => {
        const longNameInfo = table.rows.find(row => row[1] === variable && row[2] === 'long_name');
        const unitInfo = table.rows.find(row => row[1] === variable && row[2] === 'units');
        return {
            name: variable,
            longName: longNameInfo ? longNameInfo[4] : '',
            unit: unitInfo ? unitInfo[4] : ''
        };
    });
    return variablesWithLongNames;
}

const getPlottableVariables = async (erddapURL, dataset) => {
    return fetch(`${erddapURL}/info/${dataset}/index.json`).then(async response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}, response Text: ${ await response.text()}`);
        }
        return response.json();
    }).then(data => {
        const variables = getVariablesFromTable(data.table);
        return variables;
    }).catch(error => {
        console.error('Error fetching dataset info:', error);
    });
}

const createNewPlotCard = (config) => {
    const plot = document.createElement(config.component);
    plot.setAttribute('plot-config', JSON.stringify(config.plotData.data));
    plot.classList.add('flex-1');
    const wrapper = document.createElement('div');
    wrapper.classList.add('grid-stack-item');
    wrapper.setAttribute('gs-w', '4');
    wrapper.setAttribute('gs-h', '4');
    wrapper.setAttribute('gs-min-w', '3');
    wrapper.setAttribute('gs-min-h', '3');
    wrapper.innerHTML = `
        <div class="grid-stack-item-content flex-column shadow">
            <div class="card-header flex-row justify-between align-center themed-primary padding">
                <span>${config.plotData.title}</span>
                <button class="font-button" id="removeBtn">&times;</button>
            </div>
            ${plot.outerHTML}
        </div>
    `;
    return wrapper;
}

const saveGridState = (grid, tabbledapUrl) => {
    const state = grid.save();
    localStorage.setItem(`gridState_${tabbledapUrl}`, JSON.stringify(state));
}

const loadGridState = (grid, tabbledapUrl) => {
    const state = JSON.parse(localStorage.getItem(`gridState_${tabbledapUrl}`));
    console.log('Loaded grid state:', state);
    if (state && state.length > 0) {
        state.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('grid-stack-item');
            wrapper.setAttribute('gs-x', item.x);
            wrapper.setAttribute('gs-y', item.y);
            wrapper.setAttribute('gs-w', item.w);
            wrapper.setAttribute('gs-h', item.h);
            wrapper.setAttribute('gs-min-w', '3');
            wrapper.setAttribute('gs-min-h', '3');
            wrapper.innerHTML = `
                <div class="grid-stack-item-content flex-column shadow">
                ${item.content}
                </div>
            `;
            wrapper.querySelector('#removeBtn').onclick = () => {
                grid.removeWidget(wrapper);
                saveGridState(grid, tabbledapUrl);
            }
            grid.makeWidget(wrapper);
        });
    }
}



const main = async () => {
    const grid = initGrid();
    const tabbledapUrl = getTabledapUrlParam();
    loadGridState(grid, tabbledapUrl);
    // const { erddapURL, dataset } = getUrlParams();
    // const plottableVariables = await getPlottableVariables(erddapURL, dataset);
    const urlParts = tabbledapUrl.split('/');
    const dataset = urlParts[urlParts.length - 1].replace('.json', '');
    const erddapURL = urlParts.slice(0, urlParts.length - 2).join('/');
    const plottableVariables = await getPlottableVariables(erddapURL, dataset); 
    console.log('Plottable variables:', plottableVariables);
    const configModal = document.querySelector('config-modal');
    configModal.setAttribute('plot-params', JSON.stringify(plottableVariables));
    configModal.addEventListener('plot-created', (event) => {
        console.log('Received plot-created event with config:', event.detail);
        const config = event.detail;
        config.plotData.data.url = tabbledapUrl;
        const newPlotCard = createNewPlotCard(config);
        grid.makeWidget(newPlotCard);
        saveGridState(grid, tabbledapUrl);
        newPlotCard.querySelector('#removeBtn').onclick = () => {
            grid.removeWidget(newPlotCard);
            saveGridState(grid, tabbledapUrl);
        }
    });
};

main();