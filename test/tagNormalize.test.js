import { normalizeTagList } from '../services/tagNormalize';
describe('normalizeTagList', () => {
    it('dedupes, lowercases and maps synonyms', () => {
        const input = ['Siyah', 'black', '   BLACK  ', 'Grey', 'gri', 'Minimalist', 'minimal'];
        const result = normalizeTagList(input);
        expect(result).toEqual(['black', 'gray', 'minimal']);
    });
    it('drops non-strings and trims empties', () => {
        const input = ['  ', null, undefined, '  Blue ', 'blue', '🎉red'];
        const result = normalizeTagList(input);
        expect(result).toEqual(['blue', 'red']);
    });
});
