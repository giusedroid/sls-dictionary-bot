const { series } = require("../../lib/series");
const { expect } = require("chai");

describe("series", function() {
    const shipTo = where => what => () => where.push(what);
    
    it("should preserve the order of execution", done => {
        const context  = [];
        const expected = [1,2,3];
        const ship = shipTo(context);
        const tasks = [
            ship(1),
            ship(2),
            ship(3),
            () => context
        ];

        series(tasks).then(
            resolved => {
                expect(resolved).to.eql(expected);
                done();
            }
        );
    });
});