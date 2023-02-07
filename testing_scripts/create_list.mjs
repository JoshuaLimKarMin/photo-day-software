import readline from 'readline'
import fs from 'fs'

let amount = 0
let startingHEX = 0
let type
const dataSet = {}

const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout
})

await new Promise(async resolve => {
   const askAmount = async() => await new Promise(resolve => rl.question('Amount: ', async answer => {
      const number = Number(answer)
      if(isNaN(number || number < 1)){
         console.log('Please provide a number not lesser than 1')

         await askAmount()
         return resolve()
      }

      amount = number

      resolve()
   }))

   const askStartingHEX = async() => await new Promise(resolve => rl.question('Startting HEX: ', async answer => {
      if(!answer.startsWith('0x') || isNaN(parseInt(answer))){
         console.log('Please provide a valid hex value starting with "0x"')

         await askStartingHEX()
         return resolve()
      }

      startingHEX = parseInt(answer)

      resolve()
   }))

   const askType = async() => await new Promise(resolve => rl.question('Type:\n1. Students\n2. Teachers\n3. Workers\n> ', async answer => {
      const number = Number(answer)
      if(isNaN(number) || number < 1 || number > 3){
         console.log('Please provide a number between 1 and 3')

         await askType()
         return resolve()
      }

      const selection = [ 'students', 'teachers', 'workers' ]

      type = selection[number - 1]

      resolve()
   }))

   await askAmount()
   await askStartingHEX()
   await askType()

   resolve()
})

rl.close()

let typeLast = type.split('')
typeLast.pop()
typeLast = typeLast.join('')

for(let i = 0 ; i < amount ; i++){
   let key

   const checkChar = (number = (startingHEX + i).toString(16)) => {
      if(number.length < 3 && type === 'students')return checkChar(`0${number}`)
      else if(number.length < 2 )return checkChar(`0${number}`)

      key = number
   }

   checkChar()

   dataSet[key] = `Testing ${typeLast} ${startingHEX + i}`
}

fs.writeFileSync(`./generated test ${type}.json` ,JSON.stringify(dataSet, null, 2))