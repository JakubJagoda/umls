import {SOAPClientParameters, SOAPClient} from './soapClient';
import Promise from '../../bluebird-fix';

class SoapApi {
    private static SERVER_URL = 'http://localhost:8080/UMLSwsService/UMLSws';

    private static prepareData(arr: string[]) {
        return JSON.stringify(arr).replace(`"`, '');
    }

    getDataFromServer() {
        return new Promise(resolve => {
            SOAPClient.invoke(SoapApi.SERVER_URL, 'getHierarchyRoots', new SOAPClientParameters(), true, function (res) {
                resolve(res);
            });
        });
    }

    getMainConcepts(searchTerm: string) {
        return new Promise(resolve => {
            const getMainConceptsParameters = new SOAPClientParameters();
            getMainConceptsParameters.add('arg0', searchTerm);
            SOAPClient.invoke(SoapApi.SERVER_URL, 'getMainConcepts', getMainConceptsParameters, true, function (res) {
                const parsedData = atob(res);
                resolve(res);
            });
        });
    }

    getRelatedConcepts(id: string, concepts: string[]) {
        return new Promise(resolve => {
            let data = SoapApi.prepareData(concepts);
            const getRelatedConceptsParameters = new SOAPClientParameters();

            getRelatedConceptsParameters.add('arg0', btoa(id));
            getRelatedConceptsParameters.add('arg1', btoa(data));
            SOAPClient.invoke(SoapApi.SERVER_URL, 'getRelatedConcepts', getRelatedConceptsParameters, true, function (res) {
                const parsedData = atob(res);
                resolve(res);
            });
        });
    }
}
