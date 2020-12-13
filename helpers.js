const _ = require('lodash');

/**
 * Returns transaction credits in bank statement that matches a particular keyword
 * @param details
 * @param keys
 * @returns {Array}
 */
const filterByCreditNarration = (details, keys) => {
    let filteredArr = [];
    let key = `(${keys.join('|')})`; // ['a', 'b'] = "(a|b)"
    for (let detail of details) {
        let regExp = new RegExp("\\b" + key + "\\b", "ig");
        if (detail.PNarration && detail.PNarration.match(regExp) && parseFloat(detail.PCredit) > 0) {
            filteredArr.push(detail)
        }
    }
    return sortArrayRemoveDuplicates(filteredArr);
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

    return sortArrayRemoveDuplicates(filteredArr);
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

module.exports = {
    filterByCreditNarration: filterByCreditNarration,
    filterByDebitNarration: filterByDebitNarration,
    sortArrayRemoveDuplicates: sortArrayRemoveDuplicates,
    mode: mode
}
