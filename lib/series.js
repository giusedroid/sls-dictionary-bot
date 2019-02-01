// Promise.series :: [*λ] -> Promise
const series = task => task.reduce(
    (chain, next) => chain.then(next),
    Promise.resolve()
);

module.exports = {
    series
};