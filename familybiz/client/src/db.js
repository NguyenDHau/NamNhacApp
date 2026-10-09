// import { openDB } from 'idb'

// const DB_NAME = 'familybiz-local'
// const DB_VERSION = 1

// export async function getDb() {
//   return openDB(DB_NAME, DB_VERSION, {
//     upgrade(db) {
//       if (!db.objectStoreNames.contains('customers')) db.createObjectStore('customers', { keyPath: 'id' })
//       if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' })
//       if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id' })
//       if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'id' })
//     }
//   })
// }

// export async function all(store) {
//   const db = await getDb()
//   return db.getAll(store)
// }
// export async function put(store, value) {
//   const db = await getDb()
//   await db.put(store, value)
// }
// export async function remove(store, id) {
//   const db = await getDb()
//   await db.delete(store, id)
// }
// export async function enqueue(entity, record) {
//   const db = await getDb()
//   await db.put('syncQueue', {
//     id: crypto.randomUUID(),
//     entity,
//     record,
//     createdAt: new Date().toISOString(),
//     status: 'PENDING'
//   })
// }
// export async function exportBackup() {
//   const db = await getDb()
//   const data = {}
//   for (const name of ['customers', 'products', 'transactions', 'syncQueue']) data[name] = await db.getAll(name)
//   return data
// }


import { openDB } from 'idb'

const DB_NAME = 'familybiz-local'
const DB_VERSION = 1

export async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' })
      }
    }
  })
}

export async function all(store) {
  const db = await getDb()
  return db.getAll(store)
}

export async function getById(store, id) {
  const db = await getDb()
  return db.get(store, id)
}

export async function put(store, value) {
  const db = await getDb()
  return db.put(store, value)
}

export async function remove(store, id) {
  const db = await getDb()
  return db.delete(store, id)
}

/**
 * Lưu thao tác cần đồng bộ.
 * operation: UPSERT hoặc DELETE.
 */
export async function enqueue(entity, record, operation = 'UPSERT') {
  const db = await getDb()

  return db.put('syncQueue', {
    id: crypto.randomUUID(),
    entity,
    operation,
    record,
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  })
}

export async function getPendingSync() {
  const db = await getDb()
  const queue = await db.getAll('syncQueue')

  return queue
    .filter(item => item.status === 'PENDING')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function removeSyncItem(id) {
  const db = await getDb()
  return db.delete('syncQueue', id)
}

export async function clearSyncQueue() {
  const db = await getDb()
  return db.clear('syncQueue')
}

export async function exportBackup() {
  const db = await getDb()
  const data = {}

  for (const name of [
    'customers',
    'products',
    'transactions',
    'syncQueue'
  ]) {
    data[name] = await db.getAll(name)
  }

  return data
}