
/**
 * @description Data wrapper
 * @returns
 */
var DataWrapper = function (dbName, storeName, dbVersion) {
  "use strict";
  var myself = this,
    mDbRef;
  myself.dbName = dbName;
  myself.storeName = storeName;
  dbVersion = dbVersion || 1;
  myself.dbVersion = dbVersion;
  /**
   * Query database
   */
  myself.query = function(func, callback, data) {
    var request = mDbRef.open(myself.dbName, myself.dbVersion);
    request.onsuccess = function(event) {
      func(request.result, callback, data);
    };
    request.onerror = function(event) {
      console.error('Can\'t open database', dbName, event);
    };
    // DB init
    request.onupgradeneeded = function(event) {
      console.log('Upgrading db');
      var db;
      db = event.target.result;
      if (db.objectStoreNames.contains(myself.storeName)) {
        db.deleteObjectStore(myself.storeName);
      }
      db.createObjectStore(myself.storeName, {keyPath: 'id', autoIncrement: true});
      console.log('Upgrading db done');
    };
  };
  /**
   * @description Update item to database 
   */
  myself.update = function(database, callback, item) {
    myself.put(database, callback, item, true);
  };
  /**
   * @description Put item to database 
   */
  myself.put = function(database, callback, item, asUpdate) {
    var txn,
      store,
      putreq;
    asUpdate = asUpdate || false;
    txn = database.transaction(myself.storeName, 'readwrite');
    store = txn.objectStore(myself.storeName);
    putreq = store.put(item);
    //on success
    putreq.onsuccess = function (event) {
      item.id = event.target.result;
      callback(item, event, asUpdate);
    };
    //on error
    putreq.onerror = function (event) {
      callback(item, event, asUpdate);
      console.error('Add operation failure: ', database.name,
        myself.storeName, event.message, putreq.errorCode);
    };
  };
  /**
   * @description Load database and retrieve data 
   */
  myself.load = function(database, callback) {
    var results,
      txn,
      store,
      cursor;
    results = [];
    try {
      txn = database.transaction(myself.storeName);
      store = txn.objectStore(myself.storeName);
      cursor = store.openCursor(null, 'prev');
      //on success
      cursor.onsuccess = function (event) {
        var item = event.target.result;
        if (item) {
          results.push(item.value);
          item.continue();
        } else {
          callback(results, event);
        }
      };
      //on error
      cursor.onerror = function (event) {
        callback([], event);
      };
    } catch( err ) {
      console.log("CAUGHT", err);
    }
  };
  /**
   * @description Delete item
   */
  myself.delete = function(database, callback, key) {
    var txn,
      store,
      request;
    txn = database.transaction(myself.storeName, 'readwrite');
    store = txn.objectStore(myself.storeName);
    request = store.delete(key);
    //on success
    request.onsuccess = function (event) {
      callback(key, event);
    }
    //on error
    request.onerror = function (event) {
      callback(-1, event);
      console.error('Delete operation failure: ', database.name,
        myself.storeName, event.message, putreq.errorCode);
    };
  }
  /**
   * @description Initialize wrapper
   * @returns
   */
  function init() {
    mDbRef = window.indexedDB || window.mozIndexedDB || webkitIndexedDB;
    if ('webkitIndexedDB' in window) {
      window.IDBDatabase = window.webkitIDBDatabase;
      window.IDBTransaction = window.webkitIDBTransaction;
      window.IDBKeyRange = window.webkitIDBKeyRange;
    }
  }
  init();
};