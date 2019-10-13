import bcrypt from 'bcrypt'

const [password] = process.argv.slice(2);

console.log(bcrypt.hashSync(password, 10 + ~~(Math.random() * 8)));