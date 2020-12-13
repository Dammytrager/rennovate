let keywords = require('./keywords');
let helpers = require('./helpers');
let moment = require('moment');
let _ = require('lodash');

function process(details) {
    let mainDetails = details.Details.map(i => ({...i, PBalance: 0 }))
    let salaryArr = helpers.filterByCreditNarration(mainDetails, keywords.salary);
    console.log(salaryArr);
    if (!salaryArr.length) salaryArr = nonKeywordsSalary(mainDetails)
    const reversalArr = helpers.filterByCreditNarration(mainDetails, keywords.reversals);
    const dudChequesArr = helpers.filterByCreditNarration(mainDetails, keywords.dudCheques);
    const loanRepaymentsArr = helpers.filterByDebitNarration(mainDetails, keywords.loanRepayments);
    const bankChargesArr = helpers.filterByDebitNarration(mainDetails, keywords.bankCharges);
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
        min: parseInt(i.PCredit) - 50,
        max: parseInt(i.PCredit) + 78h 50,
        occurrences: 0,
        details: []
    }))


    let rangedArr = credits.map(i => {
        let range = amounts.find(amount => {
            return parseFloat(i.PCredit) >= amount.min && parseFloat(i.PCredit) <= amount.max
        })

        if (range && range.details) {
            range.details.push(i)
        }

        // return range.details;
    })


    amounts = amounts.filter(i => i.details.length > 0)

    // amounts = _(amounts).groupBy((item) => {
    //     return item.PCredit
    // }).value();

    let potentialSalaryArr = [];

    console.log(rangedArr);

    for (let item of amounts) {
        // if (amounts[key].length === 1) delete amounts[key];

        // if (key == 0) delete amounts[key];

        let arr = _.orderBy(item.details, ['PTransactionDate'], ['asc']);

        if (arr.length > 0) {
            let finalDetails = [];
            for (let i = 0; i < arr.length - 1; i++) {
                // const newArr = [];
                let previousDate = moment(new Date(arr[i].PTransactionDate).toISOString().split('T')[0]);
                let nextDate = moment(new Date(arr[i + 1].PTransactionDate).toISOString().split('T')[0]);
                if (nextDate.diff(previousDate, 'days') <= 35 && nextDate.diff(previousDate, 'days') >= 25) {
                    item.occurrences++
                    finalDetails.push(arr[i])
                    // newArr.push(arr[i]);
                    // if(i == arr.length - 2){
                    //     potentialSalaryArr.push(arr[i + 1]);
                    // }
                }
                // else if(i > 0) {
                //     let previousDate = moment(new Date(arr[i - 1].PTransactionDate).toISOString().split('T')[0]);
                //     let nextDate = moment(new Date(arr[i].PTransactionDate).toISOString().split('T')[0]);
                //     if (nextDate.diff(previousDate, 'days') <= 35 && nextDate.diff(previousDate, 'days') >= 25) {
                //         item.occurrences++
                //         finalDetails.push(arr[i])
                //         // newArr.push(arr[i]);
                //     }
                // }
                // potentialSalaryArr.push(newArr);
            }
            item.details = finalDetails
        }
    }
    amounts = amounts.reduce((a, b) => a.occurrences > b.occurrences ? a : b)
    console.log(amounts);
    return amounts && amounts.details || [];
}

module.exports = {
    process: process
}
