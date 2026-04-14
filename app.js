const initGrid = () => {
    var grid = GridStack.init({handle: '.card-header'});
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
        return {
            name: variable,
            longName: longNameInfo ? longNameInfo[4] : ''
        };
    });
    return variablesWithLongNames;
}

const getPlottableVariables = async (erddapURL, dataset) => {
    return fetch(`${erddapURL}/info/${dataset}/index.json`).then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.json();
    }).then(data => {
        const variables = getVariablesFromTable(data.table);
        return variables;
    }).catch(error => {
        console.error('Error fetching dataset info:', error);
    });
}



const main = async () => {
    const grid = initGrid();
    const { erddapURL, dataset } = getUrlParams();
    const plottableVariables = await getPlottableVariables(erddapURL, dataset);
    console.log('Plottable variables:', plottableVariables);
    const configurator = document.querySelector('plot-configurator');
    configurator.setAttribute('params', JSON.stringify(plottableVariables));
    configurator.addEventListener('plot-configured', (event) => {
        console.log('Plot configured with:', event.detail);
    });
};

main();