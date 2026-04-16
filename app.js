const initGrid = () => {
    var grid = GridStack.init({
        handle: '.card-header',
        animate: false,
        margins: 4,
        columnOpts: {
        columnMax: 3,
        layout: 'list',
        breakpointForWindow: true,  // test window vs grid size
        breakpoints: [{w:750, c:1},{w:1500, c:2}]
      },
    });
    return grid;
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
    const plot = document.createElement('plot-timeseries');
    plot.setAttribute('plot-config', JSON.stringify(config));
    plot.classList.add('flex-1');
    const wrapper = document.createElement('div');
    wrapper.classList.add('grid-stack-item');
    wrapper.setAttribute('gs-w', '1');
    wrapper.setAttribute('gs-h', '1');
    wrapper.innerHTML = `
        <div class="grid-stack-item-content flex-column shadow">
            <div class="card-header flex-row flex-center">
                <span>drag here</span>
            </div>
            ${plot.outerHTML}
        </div>
    `;
    return wrapper;
}



const main = async () => {
    const grid = initGrid();
    const { erddapURL, dataset } = getUrlParams();
    const plottableVariables = await getPlottableVariables(erddapURL, dataset);
    console.log('Plottable variables:', plottableVariables);

    const configurator = document.querySelector('plot-configurator');
    configurator.setAttribute('params', JSON.stringify(plottableVariables));
    configurator.addEventListener('plot-configured', (event) => {
        const config = event.detail;
        config.url = erddapURL + '/tabledap/' + dataset + '.json';
        const newPlotCard = createNewPlotCard(config);
        grid.makeWidget(newPlotCard);
    });

    const creator = document.querySelector('plot-creator');
    creator.setAttribute('plot-params', JSON.stringify(plottableVariables));
    creator.addEventListener('plot-created', (event) => {
        console.log('Received plot-created event with config:', event.detail);
            // const config = event.detail;
            // config.url = erddapURL + '/tabledap/' + dataset + '.json';
            // const newPlotCard = createNewPlotCard(config);
            // grid.makeWidget(newPlotCard);
    });
};

main();