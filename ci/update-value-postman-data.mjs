import fs from 'fs'

const [
  postman_data_file_path,
  key,
  value
] = process.argv.slice(2);

if (postman_data_file_path === undefined
    || key === undefined
    || value === undefined) {
  console.log(`Usage: node --experimental-modules update-value-postman-data.mjs <postman_data_file_path> <key> <value>`);
  process.exit(1);
}

console.log(`Updating value of '${key}' to '${value}' in Postman data file descriptor located at ${postman_data_file_path}.`);

const postman_data = JSON.parse(fs.readFileSync(postman_data_file_path));
postman_data
  .forEach(testIteractionObject => {
    if (testIteractionObject[key] === 'unset') {
      testIteractionObject[key] = value;
    }
  });
fs.writeFileSync(postman_data_file_path, JSON.stringify(postman_data, null, 2));

console.log(`File was overwritten.`);