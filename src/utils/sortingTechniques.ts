// quicksort implementation
export const quickSort = <T>(
    arr: T[],
    compareFn: (a: T, b: T) => number
): T[] => {
    if (arr.length <= 1) {
        return arr;
    }

    const pivot = arr[arr.length - 1];
    const left: T[] = [];
    const right: T[] = [];

    for (let i = 0; i < arr.length - 1; i++) {
        if (compareFn(arr[i], pivot) < 0) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }

    return [
        ...quickSort(left, compareFn),
        pivot,
        ...quickSort(right, compareFn),
    ];
};

// Merge Sort implementation
export const mergeSort = <T>(
    arr: T[],
    compareFn: (a: T, b: T) => number
): T[] => {
    if (arr.length <= 1) {
        return arr;
    }

    // Split the array into left and right halves
    const middle = Math.floor(arr.length / 2);
    const left = arr.slice(0, middle);
    const right = arr.slice(middle);

    // Recursively sort both halves and merge them
    return merge<T>(
        mergeSort<T>(left, compareFn),
        mergeSort<T>(right, compareFn),
        compareFn
    );
};

// Merge two sorted arrays
const merge = <T>(
    left: T[],
    right: T[],
    compareFn: (a: T, b: T) => number
): T[] => {
    const result: T[] = [];
    let i = 0,
        j = 0;

    // Compare elements and merge in sorted order
    while (i < left.length && j < right.length) {
        if (compareFn(left[i], right[j]) <= 0) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }

    // Add remaining elements from left and right (if any)
    return result.concat(left.slice(i)).concat(right.slice(j));
};
