const validator = require('./validator.js');

function process(details) {
    if (details.Accounts) {
        return processWithAccount(details);
    }

    if (details.CustomerPaymentProfile) {
        return processWithProfiles(details);
    }
}

function processWithAccount(details) {
    const processedAccount = processAccounts(details.Accounts);
    if (processedAccount) {
        return processedAccount;
    }

    return processPerformance(details.PerformanceSummary);
}

function processWithProfiles(details) {
    const isAnyDeclined = details.CustomerPaymentProfile.PaymentProfiles.some((item) => {
        const result = processProfiles(item);
        return result === 'decline'
    });

    if (isAnyDeclined) return {message: 'declined'}

    const isAnyRefer = details.CustomerPaymentProfile.PaymentProfiles.some((item) => {
        const result = processProfiles(item);
        return result === 'refer'
    });

    if (isAnyRefer) return {message: 'refer'}

    const isAllApproved = details.CustomerPaymentProfile.PaymentProfiles.some((item) => {
        const result = processProfiles(item);
        return result === 'approve'
    });

    if (isAllApproved) return {message: 'approved'}
}

function processProfiles(profiles) {
    const paymentProfile = profiles.PaymentProfile;
    const paymentProfileArr = paymentProfile.split('');

    if (isLate(paymentProfileArr[0])) return 'decline';

    if (isLate(paymentProfileArr[0]) || isLate(paymentProfileArr[1]) || isLate(paymentProfileArr[2])) return 'decline';

    let last12monthsNotLate = true;
    for (let i = 0; i < 11; i++) {
        if (isLate(paymentProfileArr[i])) {
            last12monthsNotLate = false;
            break;
        }
    }

    if (last12monthsNotLate) return 'approve';

    let occurrence = 0;
    for (let i = 2; i < 5; i++) {
        if (isLate(paymentProfileArr[i])) {
            occurrence += 1;
        }
    }

    if (occurrence === 1) return 'approve';

    let occurred3to12Months = false;
    for (let i = 2; i < 11; i++) {
        if (isLate(paymentProfileArr[i])) {
            occurred3to12Months = true;
            break;
        }
    }

    if (occurred3to12Months) return 'refer';

    return 'decline';
}

function isLate(profile) {
    return profile !== 'N' && parseInt(profile) > 1;
}

function processAccounts(accounts) {
    const deliquentKey = "(Delinquent|Derogatory)";
    const performingKey = "Performing";
    const paidOffKey = "Paid Off";

    const isAnyDelinquent = accounts.some((item) => {
        const regExp = new RegExp("\\b" + deliquentKey + "\\b", "ig");
        return item.Account_Status.match(regExp);
    });

    if (isAnyDelinquent) {
        return {message: 'declined'};
    }

    const isAllPaidOff = accounts.every((item) => {
        const regExp = new RegExp("\\b" + paidOffKey + "\\b", "ig");
        return item.Account_Status.match(regExp);
    });

    if (isAllPaidOff) {
        return {message: 'approved'};
    }

    const performingArray = accounts.filter((item) => {
        const regExp = new RegExp("\\b" + performingKey + "\\b", "ig");
        return item.Account_Status.match(regExp);
    })

    const isAnyRefer = performingArray.some((item) => {
        const result = processDelinquency(item);
        return result === 'refer';
    });

    if (isAnyRefer) return {message: 'refer'};

    const isAllApproved = performingArray.every((item) => {
        const result = processDelinquency(item);
        return result === 'approve';
    });

    if (isAllApproved) return {message: 'approved'};

    return false;
}

function processPerformance(performanceSummary) {
    if (
        performanceSummary.Count_AccountStatus_Derogatory_Lost_360 ||
        performanceSummary.Count_AccountStatus_Derogatory_Doubtful_180 ||
        performanceSummary.Count_AccountStatus_Derogatory_150_days ||
        performanceSummary.Count_AccountStatus_Derogatory_120_days
    ) {
        return {message: 'declined'};
    }

    return {message: 'approved'};
}

function processDelinquency(account) {
    const delinquentKey = 'delinquent';
    const regExp = new RegExp("\\b" + delinquentKey + "\\b", "ig");

    if (!account.Delinquency_Statements.match(regExp)) return 'paid';

    let delinquencies = account.Delinquency_Statements.split('\n');

    delinquencies = delinquencies.map((item) => {
        const overIndex = item.indexOf('(over ');
        const daysIndex = item.indexOf(' days');
        const dashIndex = item.indexOf(' - ');
        const timesIndex = item.indexOf(' time');
        return  {
            days: item.substring(overIndex + 6, daysIndex),
            times: item.substring(dashIndex + 3, timesIndex)
        }
    });

    const maxDelinquency =  delinquencies.reduce((accumulator, currentValue) => {
        const months = parseInt(currentValue.days) / 30;
        const totalMonths = months * parseInt(currentValue.times);
        return accumulator + totalMonths;
    }, 0);

    return !account.Term ? 'pass' : (parseInt(account.Term) / maxDelinquency) < 6 ? 'refer' : 'approve';
}

module.exports = {
    process: process
};
