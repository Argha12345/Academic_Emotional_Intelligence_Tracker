// Utility to capitalize the first letter of each word in a string
export const capitalize = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, c => c.toUpperCase());
};
