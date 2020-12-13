const _ = require('lodash');
let moment = require('moment');
/**
 * Returns transaction credits in bank statement that matches a particular keyword
 * @param details
 * @param keys
 * @returns {Array}
 */
const filterByCreditNarration = (details, keys) => {
    let filteredArr = [];
    let key = keys.join('|'); // ['a', 'b'] = "(a|b)"
    for (let detail of details) {
        let regExp = new RegExp(key, "ig");
        if (detail.PNarration && detail.PNarration.search(`/${key}/ig`) >= 0 && parseFloat(detail.PCredit) > 0) {
            filteredArr.push(detail)
        }
    }

    filteredArr = sortArrayRemoveDuplicates(filteredArr)

    filteredArr = dateSimilarities(filteredArr)

    return filteredArr;
}

/**
 * Returns transaction debits in bank statement that matches a particular keyword
 * @param details
 * @param keys
 * @returns {Array}
 */
const filterByDebitNarration = (details, keys) => {
    let filteredArr = [];
    let key = `(${keys.join('|')})`; // ['a', 'b'] = "(a|b)"
    for (let detail of details) {
        let regExp = new RegExp("\\b" + key + "\\b", "ig");
        if (detail.PNarration && detail.PNarration.match(regExp) && parseFloat(detail.PDebit) > 0) {
            filteredArr.push(detail)
        }
    }

    filteredArr = sortArrayRemoveDuplicates(filteredArr)

    filteredArr = dateSimilarities(filteredArr)

    return filteredArr
}

const sortArrayRemoveDuplicates = function (arr) {
    arr = _.uniqWith(arr, (a, b) => {
        return a.PNarration == b.PNarration && a.PTransactionDate == b.PTransactionDate
    })
    // arr = [ ...new Set(arr) ]; //  remove duplicates
    return _.orderBy(arr, ['PTransactionDate'], ['asc']); // sort in ascending order
};

function mode(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

const dateSimilarities = (details) => {

    let arr = _.orderBy(details, ['PTransactionDate'], ['asc']);
    let finalDetails = [];
    if (arr.length > 0) {
        for (let i = 0; i < arr.length - 1; i++) {
            // const newArr = [];
            let previousDate = moment(new Date(arr[i].PTransactionDate).toISOString().split('T')[0]);
            let nextDate = moment(new Date(arr[i + 1].PTransactionDate).toISOString().split('T')[0]);
            if (nextDate.diff(previousDate, 'days') <= 35 && nextDate.diff(previousDate, 'days') >= 25) {
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
    }
    return finalDetails
}

module.exports = {
    filterByCreditNarration: filterByCreditNarration,
    filterByDebitNarration: filterByDebitNarration,
    sortArrayRemoveDuplicates: sortArrayRemoveDuplicates,
    mode: mode
}
