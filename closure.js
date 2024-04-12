/* Javascript programming
Programmer: Mukul Dharwadkar
Date: 8 January 2023 */

function makeAdder(x){
    function add(y) {
        return y + x;
    };
    return add;
    console.log(add);
}

var plusOne = makeAdder(1);

var plusTen = makeAdder(10);

plusOne(3);
plusTen(13);
plusOne(23);