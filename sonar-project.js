const sonarqubeScanner = require('sonarqube-scanner');

sonarqubeScanner(
  {
    options: {
      'sonar.sources': '.',
      'sonar.inclusions': '*/**', // Entry point of your code
      'sonar.test.inclusions': '**/*.test.js',
      'sonar.language': 'javascript',
      'sonar.sourceEncoding': 'UTF-8',
      'sonar.exclusions': '*/*.test.js,db/**,config/*,dto/*',
      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
      'sonar.testExecutionReportPaths': 'coverage/test-reporter.xml',
      'sonar.coverage.exclusions':
        '**/*.test.js,**/*.mock.ts,node_modules/*,coverage/lcov-report/*,db/**,config/*,dto/*',
      'sonar.javascript.file.suffixes': '.js',
      'sonar.eslint.reportPaths': 'report.json',
      'sonar.qualitygate.wait': 'true',
    },
  },
  () => {},
);
