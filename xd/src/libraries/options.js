import * as fileSystemLib from './fileSystem'

const cachedOptions = {}

export function getOptionForKey(key, ignoreCache) {
  return new Promise(async resolve => {
    if (!ignoreCache && cachedOptions[key]) return resolve(cachedOptions[key])

    try {
      const options = JSON.parse(await fileSystemLib.readFile('data', 'options'))
      const value = options?.[key]
      if (value) cachedOptions[key] = value

      resolve(value)
    } catch (e) {
      resolve()
    }
  })
}

export function setOptionForKey(key, value) {
  return new Promise(async resolve => {
    let options
    try {
      options = JSON.parse(await fileSystemLib.readFile('data', 'options'))
    } catch (e) {}

    try {
      await fileSystemLib.writeFile(
        'data',
        'options',
        JSON.stringify({
          ...(options || {}),
          [key]: value
        })
      )

      cachedOptions[key] = value

      resolve()
    } catch (e) {
      resolve()
    }
  })
}
