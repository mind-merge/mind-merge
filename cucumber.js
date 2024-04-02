const common = [
    'features/**/*.feature',                // Specify our feature files
    '--require-module ts-node/register',    // Load TypeScript module
    '--require feature-step-definitions/**/*.ts',   // Load step definitions
    '--format progress-bar',                // Load custom formatter
    '-f @cucumber/pretty-formatter'         // Load custom formatter
].join(' ');

module.exports = {
    default: common
};
