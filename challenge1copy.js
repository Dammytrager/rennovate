let keywords = require('./keywords');
let helpers = require('./helpers');
let moment = require('moment');
let _ = require('lodash');

function process(details) {
    let salaryArr = helpers.filterByCreditNarration(details.Details, keywords.salary);
    if (!salaryArr.length) salaryArr = nonKeywordsSalary(details.Details)
    const reversalArr = helpers.filterByCreditNarration(details.Details, keywords.reversals);
    const dudChequesArr = helpers.filterByCreditNarration(details.Details, keywords.dudCheques);
    const loanRepaymentsArr = helpers.filterByDebitNarration(details.Details, keywords.loanRepayments);
    const bankChargesArr = helpers.filterByDebitNarration(details.Details, keywords.bankCharges);
    const salary = salaryArr.map((item) => {
        return {amount: item.PCredit, date: item.PTransactionDate, narration: item.PNarration, keywords: keywords.salary}
    });
    const salaryInterval = salaryIntervals(salaryArr);
    const employerName = salaryArr.map((item) => {
        return getCompanyName(item.PNarration);
    });
    const reversal = reversalArr.map((item) => {
        return {amount: item.PCredit, date: item.PTransactionDate, narration: item.PNarration, keywords: keywords.reversals}
    });
    const dudCheques = dudChequesArr.map((item) => {
        return {amount: item.PCredit, date: item.PTransactionDate, narration: item.PNarration, keywords: keywords.dudCheques}
    });
    const loanRepayments = loanRepaymentsArr.map((item) => {
        return {amount: item.PDebit, date: item.PTransactionDate, narration: item.PNarration, keywords: keywords.loanRepayments}
    });
    const bankCharges = bankChargesArr.map((item) => {
        return {amount: item.PDebit, date: item.PTransactionDate, narration: item.PNarration, keywords: keywords.bankCharges}
    });
    const repaymentDate = getRepaymentDate(salaryArr);

    return {
        salary,
        repaymentDate,
        salaryInterval,
        employerName,
        reversal,
        dudCheques,
        loanRepayments,
        bankCharges
    };
}

function salaryIntervals(salaryAr) {
    let salaryDates = [0];
    let salaryArr = _.orderBy(salaryAr, ['PTransactionDate'], ['asc']);
    for (let i = 0; i < salaryArr.length - 1; i++) {
        let previousDate = moment(new Date(salaryArr[i].PTransactionDate).toISOString().split('T')[0]);
        let nextDate = moment(new Date(salaryArr[i + 1].PTransactionDate).toISOString().split('T')[0]);
        salaryDates.push(nextDate.diff(previousDate, 'days'));
    }

    return salaryDates;
}

function getRepaymentDate(salaryArr) {
    const days = salaryArr.map((item) => {
        return moment(new Date(item.PTransactionDate).toISOString().split('T')[0]).date();
    });

    return helpers.mode(days)
}

function getCompanyName(narration) {
    const fromIndex = narration.indexOf(' from ');
    const toIndex = narration.indexOf(' to ');
    return (fromIndex !== -1 && toIndex !== -1) ? narration.substring(fromIndex + 6, toIndex) : '';
}

function nonKeywordsSalary(details) {
    let credits = details.filter(i => i.PCredit > 0);

    let amounts = credits.map(i => ({
        min: parseInt(i.PCredit) - 1250,
        max: parseInt(i.PCredit) + 1250,
        details: []
    }))


    let rangedArr = credits.map(i => {
        let range = amounts.find(amount => {
            return parseFloat(i.PCredit) >= amount.min && parseFloat(i.PCredit) <= amount.max
        })

        if (range && range.details) {
            range.details.push(i)
        }

        return range.details;
    })


    amounts = amounts.filter(i => i.details.length > 0)

    console.log(amounts);

    // amounts = _(amounts).groupBy((item) => {
    //     return item.PCredit
    // }).value();

    let potentialSalaryArr = [];

    console.log(rangedArr);

    for (let item of rangedArr) {
        // if (amounts[key].length === 1) delete amounts[key];

        // if (key == 0) delete amounts[key];

        let arr = _.orderBy(item, ['PTransactionDate'], ['asc']);

        if (arr.length !== 1) {
            for (let i = 0; i < arr.length - 1; i++) {
                let previousDate = moment(new Date(arr[i].PTransactionDate).toISOString().split('T')[0]);
                let nextDate = moment(new Date(arr[i + 1].PTransactionDate).toISOString().split('T')[0]);
                if (nextDate.diff(previousDate, 'days') <= 35 && nextDate.diff(previousDate, 'days') >= 25) {
                    potentialSalaryArr.push(arr[i]);
                    // if(i == arr.length - 2){
                    //     potentialSalaryArr.push(arr[i + 1]);
                    // }
                } else if(i > 0) {
                    let previousDate = moment(new Date(arr[i - 1].PTransactionDate).toISOString().split('T')[0]);
                    let nextDate = moment(new Date(arr[i].PTransactionDate).toISOString().split('T')[0]);
                    if (nextDate.diff(previousDate, 'days') <= 35 && nextDate.diff(previousDate, 'days') >= 25) {
                        potentialSalaryArr.push(arr[i]);
                    }
                }
            }
        }
    }

    return potentialSalaryArr;
}

module.exports = {
    process: process
}
