import ByteArraySerializer from './byteArraySerializer';

describe('ByteArraySerializer', () => {
    it('should return nothing if argument is not base64 encoded', () => {
        expect(ByteArraySerializer.deserialize('a')).toBeFalsy();
    });


});
