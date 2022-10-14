const Arrays = require('../../models/arraysModelo')

const save = async ({ ...data }) => {
  const array = await Arrays.findOne({ where: { array:[1, 3, 6, 4, 1, 2] } })
  if (array) return await array.update(data)
  return null
}

module.exports = save