/**
 * Storage
 *
 * Provides a way to store persisted data such as original text layer content.
 */

import * as Data from './data'

let data = null

export function set(key, value) {
  if (!data) return

  if (value === null) {
    delete data[key]
  } else {
    data[key] = value
  }
}

export function get(key) {
  if (!data) return

  return data[key]
}

export async function load() {
  try {
    data = JSON.parse(await Data.loadFileInDataFolder('storage.json'))
  } catch (e) {
    data = {}
  }
}

export async function save() {
  try {
    data = await Data.saveFileInDataFolder('storage.json', JSON.stringify(data || {}))
  } catch (e) {}
}
