var timeout_table = {};

module.exports = function throttle(fn, timing, key) {
    timeout_table[key] = timeout_table[key] || 0;
    clearTimeout(timeout_table[key]);
    timeout_table[key] = setTimeout(fn, timing);
};