import { quickSort, mergeSort } from "../../utils/sortingTechniques";

describe("sorting items", () => {
    const mockQuickSort = jest.fn(quickSort);
    const mockMergeSort = jest.fn(mergeSort);

    it("should sort items using quick sort", () => {
        const items = [5, 3, 8, 4, 2];
        const cb = (a: any, b: any) => a - b;
        const sortedItems = mockQuickSort(items, cb);
        expect(sortedItems).toEqual([2, 3, 4, 5, 8]);
        expect(sortedItems).not.toEqual([5, 3, 8, 4, 2]);
        expect(sortedItems).not.toEqual([2, 3, 4, 8, 5]);
        expect(sortedItems).not.toBeNull();
        expect(sortedItems).not.toBeNaN();
        expect(sortedItems).not.toBeUndefined();
        expect(sortedItems).not.toBeFalsy();
        expect(sortedItems).toBeTruthy();
        expect(mockQuickSort).toHaveBeenCalledWith(items, cb);
        expect(mockQuickSort).toHaveBeenCalledTimes(1);
    });

    it("should sort items using merge sort", () => {
        const items = [5, 3, 8, 4, 2];
        const cb = (a: any, b: any) => a - b;
        const sortedItems = mockMergeSort(items, cb);
        expect(sortedItems).toEqual([2, 3, 4, 5, 8]);
        expect(sortedItems).not.toEqual([5, 3, 8, 4, 2]);
        expect(sortedItems).not.toEqual([2, 3, 4, 8, 5]);
        expect(sortedItems).not.toBeNull();
        expect(sortedItems).not.toBeNaN();
        expect(sortedItems).not.toBeUndefined();
        expect(sortedItems).not.toBeFalsy();
        expect(sortedItems).toBeTruthy();
        expect(mockMergeSort).toHaveBeenCalledWith(items, cb);
        expect(mockMergeSort).toHaveBeenCalledTimes(1);
    });
});
