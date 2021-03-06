export default class ByteArraySerializer {
    /**
     * @param {string} serializedObject Base64 encoded byteArray
     */
    public static deserialize(serializedObject:string):Array<String> {
        return ByteArraySerializer.deserializeByteArray(serializedObject);
    }

    public static serialize(array:Array<String>) {
        throw new Error('Not implemented!');
    }

    private static JAVA_UTIL_ARRAYLIST = ' java.util.ArrayList';
    private static PREAMBLE = ByteArraySerializer.fromCodePointsToString([172, 237, 0, 5, 115, 114, 0, 19]);
    private static DATA_DELIMITER = ByteArraySerializer.fromCodePointsToString([120, 129, 210, 29, 153, 199, 97, 157, 3, 0, 1, 73, 0, 4, 115, 105, 122, 101, 120, 112, 0, 0, 0, 15, 119, 4, 0, 0, 0, 15, 116, 0, 8]);

    private static fromCodePointsToString(bytes) {
        return bytes.map(function (el) {
            return String.fromCodePoint(el)
        }).join('');
    }

    private static getTypeAndDataFromByteArray(serializedByteArray) {
        if (serializedByteArray.indexOf(ByteArraySerializer.PREAMBLE) !== 0) {
            return;
        }

        const preambleEnd = ByteArraySerializer.PREAMBLE.length;

        const result = serializedByteArray.substr(preambleEnd).split(ByteArraySerializer.DATA_DELIMITER);
        const type = result[0];
        const dataString = result[1].substring(0, result[1].length - 1);

        const data = ByteArraySerializer.dataFromDataString(dataString);

        return [type, data];
    }

    private static deserializeByteArray(str:string) {
        let serializedByteArray;
        try {
            serializedByteArray = window.atob(str);
        } catch (e:Error) {
            return;
        }

        const [type, dataString] = ByteArraySerializer.getTypeAndDataFromByteArray(serializedByteArray);

        if (type !== ByteArraySerializer.JAVA_UTIL_ARRAYLIST) {
            return;
        }

        return ByteArraySerializer.dataFromDataString(dataString);
    }

    private static dataFromDataString(dataString:string):Array<String> {
        const REGEXP = /^(\W+)?(\w+)(\W+)?$/;
        const DELIMITER = 't';

        return dataString.split(DELIMITER).map(el => {
            const matches = REGEXP.exec(el);
            return matches.length ? matches[2] : '';
        });
    }
}
