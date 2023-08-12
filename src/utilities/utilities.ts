export default class Utilities {
    public static parseCommonParams(query: any): [number, number] {
        let skip: number, limit: number;
        try {
            skip = parseInt(query.page as string);
        } catch (e) {
            skip = 0;
        }

        try {
            limit = parseInt(query.limit as string);
        } catch (e) {
            limit = 0;
        }

        return [skip, limit];
    }
}
