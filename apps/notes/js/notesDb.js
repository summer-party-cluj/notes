
/**
 * 
 */
var NotesDb = function (noteLoadCb, notePutCb, noteDeleteCb) {
  "use strict";
  var myself = this,
    dbName,
    storeName,
    dbInst;
  //NotesDb will be singleton
  if (NotesDb.myInstance) {
    return NotesDb.myInstance;
  }
  NotesDb.myInstance = myself;
  dbName = "notesApp";
  storeName = "note";
  dbInst = new DataWrapper(dbName, storeName, 6);
  //callback actions
  /**
   * @description Put callback
   */
  function putCb(note, event, asUpdate) {
    asUpdate = asUpdate || false;
    if (notePutCb) {
      notePutCb(note, event, asUpdate);
    } else {
      console.log(note, event);
    }
  };
  /**
   * @description Load callback
   */
  function loadCb(notes, event) {
    if (noteLoadCb) {
      noteLoadCb(notes, event);
    } else {
      console.log(notes, event);
    }
  };
  /**
   * @description Delete callback
   */
  function deleteCb(noteId, event) {
    if (noteDeleteCb) {
      noteDeleteCb(noteId, event);
    } else {
      console.log(noteId, event);
    }
  };
  // Database methods
  myself.load = function() {
    dbInst.query(dbInst.load, loadCb);
  };
  /**
   * @description Put note to DB
   */
  myself.put = function(note) {
    dbInst.query(dbInst.put, putCb, note);
  },
  /**
   * @description Put note to DB
   */
  myself.update = function(note) {
    dbInst.query(dbInst.update, putCb, note);
  },
  /**
   * @description Delete note
   */
  myself.delete = function(key) {
    dbInst.query(dbInst.delete, deleteCb, key);
  };
};