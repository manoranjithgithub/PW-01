require('dotenv').config();
const sonarqubeScanner = require('sonarqube-scanner');

const sonarUrl = process.argv[2] || process.env.SONAR_HOST_URL;
const sonarSecret = process.argv[3] || process.env.SONAR_TOKEN;

const sonarOptions = {
  serverUrl: sonarUrl,
  options: {
    'sonar.sources': '.',
    'sonar.inclusions': '*/**',
    'sonar.login': sonarSecret,
    'sonar.language': 'javascript',
    'sonar.sourceEncoding': 'UTF-8',
    'sonar.exclusions': '*/*.test.js',
    'sonar.qualitygate.wait': 'true',
  },
};

sonarqubeScanner(sonarOptions, () => {});
