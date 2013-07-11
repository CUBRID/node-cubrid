module.exports = process.env.CODE_COV
    ? require('./src-cov/cubrid')
    : require('./src/cubrid');
