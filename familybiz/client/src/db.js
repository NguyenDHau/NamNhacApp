import { openDB } from 'idb'

const DB_NAME = 'familybiz-local'
const DB_VERSION = 1

export async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('customers')) db.createObjectStore('customers', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'id' })
    }
  })
}

export async function all(store) {
  const db = await getDb()
  return db.getAll(store)
}
export async function put(store, value) {
  const db = await getDb()
  await db.put(store, value)
}
export async function remove(store, id) {
  const db = await getDb()
  await db.delete(store, id)
}
export async function enqueue(entity, record) {
  const db = await getDb()
  await db.put('syncQueue', {
    id: crypto.randomUUID(),
    entity,
    record,
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  })
}
export async function exportBackup() {
  const db = await getDb()
  const data = {}
  for (const name of ['customers', 'products', 'transactions', 'syncQueue']) data[name] = await db.getAll(name)
  return data
}
