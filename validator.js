let errors = [];

validateFields = (field, fieldName, type = 'string', regex = false, required = true) => {
    if (required && !field) {
        errors.push(`Invalid JSON - ${fieldName} is required`);
    } else if (field && type && typeof field !== type) {
        errors.push(`Invalid JSON - ${fieldName} must be an array`);
    }
};

validate = (details) => {
    validateFields(details.Accounts, 'Accounts', 'object');
    validateFields(details.PerformanceSummary, 'PerformanceSummary', 'object');

    const returnError = [...errors];
    errors = [];
    return returnError.length ? returnError[0] : false;
};

module.exports = {
    validate: validate
}
