/* Javascript programming
Programmer: Mukul Dharwadkar
Date: 8 January 2023 */

function foo() {
    console.log(this.bar);
}

var bar = "global";

var obj1 = {
    bar: "Obj1",
    foo: foo
};

var obj2 = {
    bar: "Obj2"
};