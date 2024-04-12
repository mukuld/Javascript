/* Javascript programming
Programmer: Mukul Dharwadkar
Date: 27 December 2022 */

"use strict";

//Define constants for the variables
const TAX_RATE = 0.0725
const PHONE_PRICE = 999.99
const ACCESORY_PRICE = 29.99

//Initialize the variables
var bank_balance = prompt("Enter you bank balance: ");
var spending_limit = prompt("How much money would you be willing to spend per phone? ");
var amount = 0;
var no_of_phones_bought = 0;

//Calculate the amount of tax to be collected on the purchase.
function taxAmount(amount) {
    return amount * TAX_RATE;
}

//This function beautifies the amount to be human readable and with two decimal places
function formatPrice(amount) {
    return "$" + amount.toFixed(2);
}

while (bank_balance > PHONE_PRICE) {
    var price_without_tax = 0;
    var price_including_accesory = 0;
    var total_price = 0;
    price_without_tax = price_without_tax + PHONE_PRICE;
    //Check if the customer can buy the accesory
    price_including_accesory = price_without_tax + ACCESORY_PRICE;
    if (price_including_accesory < spending_limit) {
        console.log("You can afford the accesory");
    }
    else {
        console.log("You can't afford it. Sorry.");
        break
    }
    //Add the taxman's cut to the total purchase.
    total_price = price_including_accesory + taxAmount(price_including_accesory);
    //formatted_price = formatPrice(total_price);
    //console.log("The price of the phone with tax is " + formatted_price);
    console.log("The price of the phone with tax is " + formatPrice(total_price));

    //Reduce the available bank balance appropriately and check if you can buy another phone. At the same time increment the number of phones bought
    bank_balance = bank_balance - total_price;
    no_of_phones_bought++
    if (bank_balance < price_including_accesory) {
        console.log("Not enough money in bank. Sorry!");
    break
    }
    }
console.log("Total number of phones bought are: " + no_of_phones_bought);