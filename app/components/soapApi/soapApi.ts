import {SOAPClientParameters, SOAPClient} from './soapClient';
import Promise from '../../bluebird-fix';

export default class SoapApi {
    private static SERVER_URL = 'http://localhost:3000';

    private static prepareData(arr:string[]) {
        return JSON.stringify(arr).replace(`"`, '');
    }

    getHierarchyRoots() {
        return new Promise<{id: string; name: string}[]>(resolve => {
            SOAPClient.invoke(SoapApi.SERVER_URL, 'getHierarchyRoots', new SOAPClientParameters(), true, function (res:string) {
                const idNamePairs = res.split('*');

                if (!idNamePairs[idNamePairs.length - 1]) {
                    idNamePairs.pop();
                }

                const hierarchyRoots = idNamePairs.map(idNamePair => {
                    const splitted = idNamePair.split('/');
                    const id = splitted[0].replace('id=', '');
                    const name = splitted[1].replace('name=', '');

                    return {id, name}
                });

                resolve(hierarchyRoots);
            });
        });
    }

    getMainConcepts(searchTerm:string) {
        return new Promise<any[]>(resolve => {
            const getMainConceptsParameters = new SOAPClientParameters();
            getMainConceptsParameters.add('arg0', searchTerm);
            SOAPClient.invoke(SoapApi.SERVER_URL, 'getMainConcepts', getMainConceptsParameters, true, function (res) {
                const cuiStrPairs = res.split('*');

                if (!cuiStrPairs[cuiStrPairs.length - 1]) {
                    cuiStrPairs.pop();
                }

                const mainConcepts = cuiStrPairs.map(idNamePair => {
                    const splitted = idNamePair.split('/');
                    const cui = splitted[0].replace('Cui=', '');
                    const nstr = splitted[1].replace('Nstr=', '');

                    return {cui, nstr}
                });

                const mainConceptsWithoutDuplicates = mainConcepts.reduce((reduced, current) => {
                    if (reduced.map(concept => concept.cui).indexOf(current.cui) === -1) {
                        reduced.push(current);
                    }

                    return reduced;
                }, []);

                resolve(mainConceptsWithoutDuplicates);
            });
        });
    }

    getRelatedConcepts(id:string, concepts:string[]) {
        return new Promise(resolve => {
            let data = SoapApi.prepareData(concepts);
            const getRelatedConceptsParameters = new SOAPClientParameters();

            getRelatedConceptsParameters.add('arg0', btoa(id));
            getRelatedConceptsParameters.add('arg1', btoa(data));
            SOAPClient.invoke(SoapApi.SERVER_URL, 'getRelatedConcepts', getRelatedConceptsParameters, true, function (res) {
                const parsedData = atob(res);
                resolve(parsedData);
            });
        });
    }
}
